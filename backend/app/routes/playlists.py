from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.dependencies import get_current_user_document
from app.database.mongo import get_database
from app.schemas.playlist import PlaylistCreateRequest
from app.services.song_resolver import resolve_song_object_id
from app.utils.serialization import serialize_docs, to_object_id

router = APIRouter(prefix="/playlists", tags=["Playlists"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_playlist(payload: PlaylistCreateRequest, user=Depends(get_current_user_document)):
    db = get_database()

    resolved_song_ids = []
    seen_ids = set()

    for raw_song_id in payload.songs:
        object_id = await resolve_song_object_id(db=db, song_id=raw_song_id, song=None)
        serialized_id = str(object_id)
        if serialized_id not in seen_ids:
            seen_ids.add(serialized_id)
            resolved_song_ids.append(serialized_id)

    for item in payload.songItems:
        object_id = await resolve_song_object_id(db=db, song_id=item.songId, song=item.song)
        serialized_id = str(object_id)
        if serialized_id not in seen_ids:
            seen_ids.add(serialized_id)
            resolved_song_ids.append(serialized_id)

    doc = {
        "userId": user["_id"],
        "playlistName": payload.playlistName,
        "songs": resolved_song_ids,
        "mood": payload.mood,
        "weatherType": payload.weatherType,
        "createdAt": datetime.now(timezone.utc).isoformat(),
    }

    result = await db.playlists.insert_one(doc)
    created = await db.playlists.find_one({"_id": result.inserted_id})

    response = {
        "id": str(created["_id"]),
        "userId": str(created["userId"]),
        "playlistName": created["playlistName"],
        "songs": created.get("songs", []),
        "mood": created.get("mood"),
        "weatherType": created.get("weatherType"),
        "createdAt": created["createdAt"],
    }
    return response


@router.get("")
async def list_playlists(user=Depends(get_current_user_document)):
    db = get_database()
    playlists = await db.playlists.find({"userId": user["_id"]}).sort("createdAt", -1).to_list(length=200)

    items = []
    for playlist in serialize_docs(playlists):
        playlist["userId"] = str(user["_id"])
        items.append(playlist)

    return {"items": items}


@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist(playlist_id: str, user=Depends(get_current_user_document)):
    db = get_database()

    try:
        object_id = to_object_id(playlist_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid playlist id.") from exc

    result = await db.playlists.delete_one({"_id": object_id, "userId": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found.")

    return None
