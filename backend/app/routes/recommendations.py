from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import get_current_user_document
from app.database.mongo import get_database
from app.services.recommendation_service import get_mood_songs, get_trending_songs, recommend_for_user
from app.services.weather_service import fetch_weather_by_city, fetch_weather_by_coords
from app.utils.serialization import to_object_id
from app.utils.time_utils import current_time_tag

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])


@router.get("/weather")
async def weather_recommendations(
    city: Optional[str] = None,
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    mood: Optional[str] = None,
    limit: int = Query(default=10, ge=1, le=30),
    user=Depends(get_current_user_document),
):
    db = get_database()

    if city:
        weather = await fetch_weather_by_city(city)
    elif lat is not None and lon is not None:
        weather = await fetch_weather_by_coords(lat=lat, lon=lon)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide city or both lat/lon for weather recommendations.",
        )

    time_tag = current_time_tag()
    result = await recommend_for_user(
        db=db,
        user=user,
        weather_condition=weather["condition"],
        temperature=weather["temperature"],
        time_tag=time_tag,
        mood_override=mood,
        limit=limit,
    )

    top_song_ids = [item.get("id") for item in result["recommendations"][:3] if item.get("id")]
    object_ids = []
    for song_id in top_song_ids:
        try:
            object_ids.append(to_object_id(song_id))
        except ValueError:
            continue

    if object_ids:
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$push": {
                    "recentlyPlayed": {
                        "$each": [str(item) for item in object_ids],
                        "$slice": -30,
                    }
                }
            },
        )

        history_docs = [
            {
                "userId": user["_id"],
                "songId": song_id,
                "weatherCondition": weather["condition"],
                "temperature": weather["temperature"],
                "playedAt": datetime.now(timezone.utc).isoformat(),
            }
            for song_id in object_ids
        ]
        await db.playHistory.insert_many(history_docs)

    result["weather"] = weather
    return result


@router.get("/trending")
async def trending(limit: int = Query(default=12, ge=1, le=50)):
    db = get_database()
    items = await get_trending_songs(db, limit=limit)
    return {"items": items}


@router.get("/mood/{mood}")
async def by_mood(mood: str, limit: int = Query(default=12, ge=1, le=50)):
    db = get_database()
    items = await get_mood_songs(db, mood=mood.lower(), limit=limit)
    return {"mood": mood.lower(), "items": items}
