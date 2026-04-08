from typing import Dict, List, Optional, Set, Tuple

from app.utils.mood_map import moods_for_weather, normalize_weather_condition
from app.utils.serialization import serialize_doc, serialize_docs


def _as_lower_set(values: List[str]) -> Set[str]:
    return {str(item).strip().lower() for item in values if str(item).strip()}


def _temperature_match(song: Dict, temperature: float) -> int:
    temp_range = song.get("tempRange", {}) or {}
    min_temp = float(temp_range.get("min", -50))
    max_temp = float(temp_range.get("max", 60))
    return 1 if min_temp <= temperature <= max_temp else 0


def _song_popularity(song: Dict) -> float:
    raw = float(song.get("popularity", 0))
    if raw > 1:
        raw = raw / 100.0
    return max(0.0, min(1.0, raw))


def score_song(
    song: Dict,
    user: Dict,
    weather_condition: str,
    moods: List[str],
    time_tag: str,
    temperature: float,
    recently_played_ids: Set[str],
) -> float:
    weather_key = normalize_weather_condition(weather_condition)

    weather_tags = _as_lower_set(song.get("weatherTags", []))
    mood_tags = _as_lower_set(song.get("moods", []))
    time_tags = _as_lower_set(song.get("timeTags", []))

    target_moods = _as_lower_set(moods)
    favorite_artists = _as_lower_set(user.get("favoriteArtists", []))

    weather_match = 1 if weather_key in weather_tags else 0
    mood_match = 1 if target_moods.intersection(mood_tags) else 0
    time_match = 1 if time_tag.lower() in time_tags else 0
    temp_match = _temperature_match(song, temperature)

    song_artist = str(song.get("artist", "")).strip().lower()
    user_likes_artist = 1 if song_artist in favorite_artists else 0

    song_popularity = _song_popularity(song)
    recently_played_penalty = 1 if str(song.get("_id")) in recently_played_ids else 0

    score = (
        (weather_match * 5)
        + (mood_match * 4)
        + (time_match * 3)
        + (temp_match * 2)
        + (user_likes_artist * 4)
        + (song_popularity * 2)
        - (recently_played_penalty * 3)
    )
    return round(score, 4)


async def recommend_for_user(
    db,
    user: Dict,
    weather_condition: str,
    temperature: float,
    time_tag: str,
    mood_override: Optional[str] = None,
    limit: int = 10,
) -> Dict:
    normalized_weather = normalize_weather_condition(weather_condition)
    target_moods = [mood_override.lower()] if mood_override else moods_for_weather(normalized_weather)

    query = {
        "$or": [
            {"weatherTags": {"$in": [normalized_weather]}},
            {"moods": {"$in": target_moods}},
        ]
    }

    songs = await db.songs.find(query).to_list(length=400)
    if not songs:
        songs = await db.songs.find({}).to_list(length=400)

    recently_played_ids = {str(item) for item in user.get("recentlyPlayed", [])}

    scored: List[Tuple[float, Dict]] = []
    for song in songs:
        song_score = score_song(
            song=song,
            user=user,
            weather_condition=normalized_weather,
            moods=target_moods,
            time_tag=time_tag,
            temperature=temperature,
            recently_played_ids=recently_played_ids,
        )
        scored.append((song_score, song))

    scored.sort(key=lambda item: item[0], reverse=True)

    recommendations = []
    for score, song in scored[:limit]:
        doc = serialize_doc(song)
        doc["score"] = score
        recommendations.append(doc)

    return {
        "weatherCondition": normalized_weather,
        "temperature": temperature,
        "mood": target_moods[0] if target_moods else "happy",
        "timeOfDay": time_tag,
        "recommendations": recommendations,
    }


async def get_trending_songs(db, limit: int = 12) -> List[Dict]:
    songs = await db.songs.find({}).sort("popularity", -1).limit(limit).to_list(length=limit)
    return serialize_docs(songs)


async def get_mood_songs(db, mood: str, limit: int = 12) -> List[Dict]:
    songs = await db.songs.find({"moods": {"$in": [mood.lower()]}}).sort("popularity", -1).limit(limit).to_list(length=limit)
    return serialize_docs(songs)
