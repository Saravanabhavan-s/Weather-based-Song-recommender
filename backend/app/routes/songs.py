from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import require_admin
from app.database.mongo import get_database
from app.schemas.song import SongCreate, SongUpdate
from app.utils.serialization import serialize_doc, serialize_docs, to_object_id

router = APIRouter(prefix="/songs", tags=["Songs"])


@router.get("")
async def list_songs(
    mood: Optional[str] = None,
    weather: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=24, ge=1, le=100),
    skip: int = Query(default=0, ge=0),
):
    db = get_database()
    query = {}

    if mood:
        query["moods"] = {"$in": [mood.lower()]}
    if weather:
        query["weatherTags"] = {"$in": [weather.lower()]}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"artist": {"$regex": search, "$options": "i"}},
        ]

    songs = await db.songs.find(query).sort("popularity", -1).skip(skip).limit(limit).to_list(length=limit)
    return {"items": serialize_docs(songs), "count": len(songs)}


@router.get("/{song_id}")
async def get_song(song_id: str):
    db = get_database()

    try:
        object_id = to_object_id(song_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid song id.") from exc

    song = await db.songs.find_one({"_id": object_id})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found.")

    return serialize_doc(song)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_song(payload: SongCreate, _: dict = Depends(require_admin)):
    db = get_database()

    doc = payload.model_dump()
    doc["moods"] = [item.lower() for item in doc.get("moods", [])]
    doc["weatherTags"] = [item.lower() for item in doc.get("weatherTags", [])]
    doc["timeTags"] = [item.lower() for item in doc.get("timeTags", [])]
    doc["createdAt"] = datetime.now(timezone.utc).isoformat()

    result = await db.songs.insert_one(doc)
    created = await db.songs.find_one({"_id": result.inserted_id})
    return serialize_doc(created)


@router.put("/{song_id}")
async def update_song(song_id: str, payload: SongUpdate, _: dict = Depends(require_admin)):
    db = get_database()

    try:
        object_id = to_object_id(song_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid song id.") from exc

    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    if "moods" in update_data:
        update_data["moods"] = [item.lower() for item in update_data["moods"]]
    if "weatherTags" in update_data:
        update_data["weatherTags"] = [item.lower() for item in update_data["weatherTags"]]
    if "timeTags" in update_data:
        update_data["timeTags"] = [item.lower() for item in update_data["timeTags"]]

    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()

    result = await db.songs.update_one({"_id": object_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Song not found.")

    song = await db.songs.find_one({"_id": object_id})
    return serialize_doc(song)


@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_song(song_id: str, _: dict = Depends(require_admin)):
    db = get_database()

    try:
        object_id = to_object_id(song_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid song id.") from exc

    result = await db.songs.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Song not found.")

    return None
