from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.dependencies import get_current_user_document
from app.database.mongo import get_database
from app.schemas.user import SongActionRequest, UserProfileUpdate
from app.services.song_resolver import resolve_song_object_id
from app.utils.serialization import serialize_doc

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/profile")
async def profile(user=Depends(get_current_user_document)):
    safe = serialize_doc(user)
    safe.pop("password", None)
    return safe


@router.put("/profile")
async def update_profile(payload: UserProfileUpdate, user=Depends(get_current_user_document)):
    db = get_database()
    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No profile fields to update.")

    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})

    updated = await db.users.find_one({"_id": user["_id"]})
    safe = serialize_doc(updated)
    safe.pop("password", None)
    return safe


@router.post("/like-song")
async def like_song(payload: SongActionRequest, user=Depends(get_current_user_document)):
    db = get_database()

    song_id = await resolve_song_object_id(db=db, song_id=payload.songId, song=payload.song)

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$addToSet": {"likedSongs": str(song_id)},
            "$pull": {"dislikedSongs": str(song_id)},
        },
    )

    await db.likedSongs.update_one(
        {"userId": user["_id"], "songId": song_id},
        {"$setOnInsert": {"likedAt": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )

    return {"success": True, "detail": "Song added to likes."}


@router.post("/dislike-song")
async def dislike_song(payload: SongActionRequest, user=Depends(get_current_user_document)):
    db = get_database()

    song_id = await resolve_song_object_id(db=db, song_id=payload.songId, song=payload.song)

    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$addToSet": {"dislikedSongs": str(song_id)},
            "$pull": {"likedSongs": str(song_id)},
        },
    )

    await db.likedSongs.delete_one({"userId": user["_id"], "songId": song_id})
    return {"success": True, "detail": "Song added to dislikes."}


@router.get("/history")
async def history(limit: int = Query(default=20, ge=1, le=100), user=Depends(get_current_user_document)):
    db = get_database()

    pipeline = [
        {"$match": {"userId": user["_id"]}},
        {"$sort": {"playedAt": -1}},
        {"$limit": limit},
        {
            "$lookup": {
                "from": "songs",
                "localField": "songId",
                "foreignField": "_id",
                "as": "song",
            }
        },
        {"$unwind": {"path": "$song", "preserveNullAndEmptyArrays": True}},
    ]

    items = await db.playHistory.aggregate(pipeline).to_list(length=limit)

    response = []
    for item in items:
        song = item.get("song") or {}
        response.append(
            {
                "id": str(item.get("_id")),
                "weatherCondition": item.get("weatherCondition"),
                "temperature": item.get("temperature"),
                "playedAt": item.get("playedAt"),
                "song": {
                    "id": str(song.get("_id")) if song.get("_id") else None,
                    "title": song.get("title"),
                    "artist": song.get("artist"),
                    "soundcloudUrl": song.get("soundcloudUrl"),
                    "albumArt": song.get("albumArt"),
                },
            }
        )

    return {"items": response}
