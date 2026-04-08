from datetime import datetime, timezone
from typing import Iterable, Optional

from bson import ObjectId
from fastapi import HTTPException, status

from app.schemas.user import ExternalSongPayload
from app.utils.serialization import to_object_id


def _normalize_tags(values: Optional[Iterable[str]]) -> list[str]:
    if not values:
        return []
    return [str(item).strip().lower() for item in values if str(item).strip()]


def _normalize_duration(value: Optional[int]) -> int:
    if value is None:
        return 180
    return max(30, int(value))


async def resolve_song_object_id(db, song_id: str, song: Optional[ExternalSongPayload]) -> ObjectId:
    raw_song_id = str(song_id).strip()
    if not raw_song_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Song id is required.")

    if ObjectId.is_valid(raw_song_id):
        object_id = to_object_id(raw_song_id)
        existing = await db.songs.find_one({"_id": object_id})
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found.")
        return object_id

    if song is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="External tracks require song metadata.",
        )

    source = (song.source or "external").strip().lower()
    external_id = (song.externalId or raw_song_id).strip()
    if not external_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="External track id is required.",
        )

    now = datetime.now(timezone.utc).isoformat()
    sound_url = (song.soundcloudUrl or song.audio or "").strip() or None
    upsert_filter = {"source": source, "externalId": external_id}
    update_doc = {
        "$set": {
            "title": song.title,
            "artist": song.artist,
            "album": song.album,
            "language": "Unknown",
            "genre": song.album or "Unknown",
            "moods": _normalize_tags(song.moods),
            "weatherTags": _normalize_tags(song.weatherTags),
            "timeTags": _normalize_tags(song.timeTags),
            "tempRange": {"min": -10, "max": 45},
            "energy": 0.5,
            "popularity": 50,
            "soundcloudUrl": sound_url,
            "albumArt": song.albumArt,
            "duration": _normalize_duration(song.duration),
            "source": source,
            "externalId": external_id,
            "updatedAt": now,
        },
        "$setOnInsert": {
            "createdAt": now,
        },
    }

    await db.songs.update_one(upsert_filter, update_doc, upsert=True)
    persisted = await db.songs.find_one(upsert_filter)
    if not persisted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist song.",
        )
    return persisted["_id"]