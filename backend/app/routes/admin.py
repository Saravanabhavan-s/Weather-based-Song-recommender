from datetime import date, datetime, timedelta, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.dependencies import require_admin
from app.database.mongo import get_database
from app.schemas.admin import (
    AdminNotificationCreatePayload,
    AdminNotificationUpdatePayload,
    AdminSettingsPayload,
    BlockUserRequest,
    FeedbackCreatePayload,
    FeedbackUpdatePayload,
    RecommendationControlsPayload,
    WeatherMappingPayload,
)
from app.utils.mood_map import WEATHER_MOOD_MAP
from app.utils.serialization import to_object_id
from app.utils.serialization import serialize_docs

router = APIRouter(prefix="/admin", tags=["Admin"])
ADMIN_SETTINGS_KEY = "global"
RECOMMENDATION_CONTROLS_KEY = "recommendation_controls"
WEATHER_MAPPING_KEY = "weather_mapping"


def _last_n_days_labels(days: int = 7) -> list[str]:
    today = date.today()
    return [(today - timedelta(days=offset)).isoformat() for offset in range(days - 1, -1, -1)]


def _lookup_day(doc_map: dict, day_key: str, value_key: str, default: int = 0) -> int:
    item = doc_map.get(day_key)
    if not item:
        return default
    return int(item.get(value_key, default))


def _default_admin_settings() -> dict:
    return {
        "appName": "Vibecast",
        "supportEmail": "support@vibecast.app",
        "featuredCity": "Chennai",
        "maintenanceMode": False,
        "allowNewRegistrations": True,
        "defaultRecommendationLimit": 12,
        "weatherRefreshMinutes": 15,
    }


def _normalize_admin_settings(value: dict | None) -> dict:
    defaults = _default_admin_settings()
    if not value:
        return defaults

    return {
        "appName": str(value.get("appName") or defaults["appName"]).strip() or defaults["appName"],
        "supportEmail": str(value.get("supportEmail") or defaults["supportEmail"]).strip().lower(),
        "featuredCity": str(value.get("featuredCity") or defaults["featuredCity"]).strip() or defaults["featuredCity"],
        "maintenanceMode": bool(value.get("maintenanceMode", defaults["maintenanceMode"])),
        "allowNewRegistrations": bool(
            value.get("allowNewRegistrations", defaults["allowNewRegistrations"])
        ),
        "defaultRecommendationLimit": int(
            value.get("defaultRecommendationLimit", defaults["defaultRecommendationLimit"])
        ),
        "weatherRefreshMinutes": int(value.get("weatherRefreshMinutes", defaults["weatherRefreshMinutes"])),
    }


def _serialize_id(value) -> str | None:
    if value is None:
        return None
    return str(value)


def _default_recommendation_controls() -> dict:
    return {
        "weatherWeight": 5,
        "moodWeight": 4,
        "timeWeight": 3,
        "temperatureWeight": 2,
        "artistAffinityWeight": 4,
        "popularityWeight": 2,
        "recentPenaltyWeight": 3,
        "maxCandidatePool": 400,
        "diversityBoost": 0.15,
    }


def _normalize_recommendation_controls(value: dict | None) -> dict:
    defaults = _default_recommendation_controls()
    if not value:
        return defaults

    return {
        "weatherWeight": int(value.get("weatherWeight", defaults["weatherWeight"])),
        "moodWeight": int(value.get("moodWeight", defaults["moodWeight"])),
        "timeWeight": int(value.get("timeWeight", defaults["timeWeight"])),
        "temperatureWeight": int(value.get("temperatureWeight", defaults["temperatureWeight"])),
        "artistAffinityWeight": int(
            value.get("artistAffinityWeight", defaults["artistAffinityWeight"])
        ),
        "popularityWeight": int(value.get("popularityWeight", defaults["popularityWeight"])),
        "recentPenaltyWeight": int(
            value.get("recentPenaltyWeight", defaults["recentPenaltyWeight"])
        ),
        "maxCandidatePool": int(value.get("maxCandidatePool", defaults["maxCandidatePool"])),
        "diversityBoost": float(value.get("diversityBoost", defaults["diversityBoost"])),
    }


def _default_weather_mapping() -> dict:
    return {
        "rain": list(WEATHER_MOOD_MAP.get("rain", ["romantic", "calm", "melancholic"])),
        "clear": list(WEATHER_MOOD_MAP.get("clear", ["happy", "energetic"])),
        "cloud": list(WEATHER_MOOD_MAP.get("cloud", ["chill", "soft"])),
        "thunder": list(WEATHER_MOOD_MAP.get("thunder", ["intense", "emotional"])),
        "mist": list(WEATHER_MOOD_MAP.get("mist", ["dreamy", "lo-fi"])),
        "snow": list(WEATHER_MOOD_MAP.get("snow", ["peaceful", "cozy"])),
    }


def _normalize_weather_mapping(value: dict | None) -> dict:
    defaults = _default_weather_mapping()
    if not value:
        return defaults

    normalized = {}
    for key, fallback in defaults.items():
        raw_values = value.get(key)
        if not isinstance(raw_values, list):
            normalized[key] = fallback
            continue
        cleaned = [str(item).strip().lower() for item in raw_values if str(item).strip()]
        normalized[key] = cleaned or fallback
    return normalized


def _parse_object_id(value: str, *, label: str = "id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {label}.")
    return ObjectId(value)


@router.get("/analytics")
async def analytics(_: dict = Depends(require_admin)):
    db = get_database()

    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()
    last_24h_iso = (now_dt - timedelta(hours=24)).isoformat()
    last_7d_iso = (now_dt - timedelta(days=7)).isoformat()
    last_30d_iso = (now_dt - timedelta(days=30)).isoformat()

    users_count = await db.users.count_documents({})
    songs_count = await db.songs.count_documents({})
    playlists_count = await db.playlists.count_documents({})
    plays_count = await db.playHistory.count_documents({})
    blocked_users_count = await db.users.count_documents({"blocked": True})
    likes_count = await db.likedSongs.count_documents({})
    tokens_issued_count = await db.authEvents.count_documents({})
    tokens_issued_24h = await db.authEvents.count_documents({"issuedAt": {"$gte": last_24h_iso}})
    active_tokens_estimate = await db.authEvents.count_documents({"expiresAt": {"$gte": now_iso}})

    active_users_24h = len(await db.playHistory.distinct("userId", {"playedAt": {"$gte": last_24h_iso}}))
    active_users_7d = len(await db.playHistory.distinct("userId", {"playedAt": {"$gte": last_7d_iso}}))

    top_songs_pipeline = [
        {"$group": {"_id": "$songId", "plays": {"$sum": 1}}},
        {"$sort": {"plays": -1}},
        {"$limit": 5},
        {
            "$lookup": {
                "from": "songs",
                "localField": "_id",
                "foreignField": "_id",
                "as": "song",
            }
        },
        {"$unwind": {"path": "$song", "preserveNullAndEmptyArrays": True}},
    ]
    top_songs = await db.playHistory.aggregate(top_songs_pipeline).to_list(length=5)

    weather_pipeline = [
        {"$group": {"_id": "$weatherCondition", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    weather_trends = await db.playHistory.aggregate(weather_pipeline).to_list(length=20)

    auth_by_day_pipeline = [
        {"$match": {"issuedAt": {"$gte": last_7d_iso}}},
        {
            "$project": {
                "day": {"$substr": ["$issuedAt", 0, 10]},
                "event": "$event",
            }
        },
        {
            "$group": {
                "_id": "$day",
                "tokens": {"$sum": 1},
                "logins": {
                    "$sum": {
                        "$cond": [{"$eq": ["$event", "login"]}, 1, 0]
                    }
                },
                "registrations": {
                    "$sum": {
                        "$cond": [{"$eq": ["$event", "register"]}, 1, 0]
                    }
                },
            }
        },
    ]
    auth_by_day_docs = await db.authEvents.aggregate(auth_by_day_pipeline).to_list(length=20)

    plays_by_day_pipeline = [
        {"$match": {"playedAt": {"$gte": last_7d_iso}}},
        {
            "$project": {
                "day": {"$substr": ["$playedAt", 0, 10]},
            }
        },
        {"$group": {"_id": "$day", "plays": {"$sum": 1}}},
    ]
    plays_by_day_docs = await db.playHistory.aggregate(plays_by_day_pipeline).to_list(length=20)

    top_users_pipeline = [
        {"$match": {"playedAt": {"$gte": last_30d_iso}}},
        {"$group": {"_id": "$userId", "plays": {"$sum": 1}}},
        {"$sort": {"plays": -1}},
        {"$limit": 8},
        {
            "$lookup": {
                "from": "users",
                "localField": "_id",
                "foreignField": "_id",
                "as": "user",
            }
        },
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},
    ]
    top_users_docs = await db.playHistory.aggregate(top_users_pipeline).to_list(length=8)

    formatted_top_songs = [
        {
            "songId": str(item.get("_id")),
            "title": item.get("song", {}).get("title"),
            "artist": item.get("song", {}).get("artist"),
            "plays": item.get("plays", 0),
        }
        for item in top_songs
    ]

    formatted_weather = [
        {"weatherCondition": item.get("_id"), "count": item.get("count", 0)} for item in weather_trends
    ]

    auth_by_day_map = {item.get("_id"): item for item in auth_by_day_docs}
    plays_by_day_map = {item.get("_id"): item for item in plays_by_day_docs}
    usage_by_day = []
    for day in _last_n_days_labels(7):
        usage_by_day.append(
            {
                "date": day,
                "tokens": _lookup_day(auth_by_day_map, day, "tokens"),
                "logins": _lookup_day(auth_by_day_map, day, "logins"),
                "registrations": _lookup_day(auth_by_day_map, day, "registrations"),
                "plays": _lookup_day(plays_by_day_map, day, "plays"),
            }
        )

    top_users = [
        {
            "userId": str(item.get("_id")),
            "name": item.get("user", {}).get("name") or "Unknown",
            "email": item.get("user", {}).get("email"),
            "plays": int(item.get("plays", 0)),
        }
        for item in top_users_docs
    ]

    avg_plays_per_user = round((plays_count / users_count), 2) if users_count else 0
    avg_likes_per_user = round((likes_count / users_count), 2) if users_count else 0

    return {
        "totals": {
            "users": users_count,
            "songs": songs_count,
            "playlists": playlists_count,
            "plays": plays_count,
            "likes": likes_count,
            "blockedUsers": blocked_users_count,
            "activeUsers24h": active_users_24h,
            "activeUsers7d": active_users_7d,
            "tokensIssued": tokens_issued_count,
            "tokensIssued24h": tokens_issued_24h,
            "activeTokensEstimate": active_tokens_estimate,
        },
        "health": {
            "avgPlaysPerUser": avg_plays_per_user,
            "avgLikesPerUser": avg_likes_per_user,
        },
        "usageByDay": usage_by_day,
        "topUsers": top_users,
        "topSongs": formatted_top_songs,
        "weatherTrends": formatted_weather,
    }


@router.get("/users")
async def users(limit: int = Query(default=50, ge=1, le=200), _: dict = Depends(require_admin)):
    db = get_database()

    user_docs = (
        await db.users.find({}, {"password": 0})
        .sort("createdAt", -1)
        .limit(limit)
        .to_list(length=limit)
    )

    user_ids = [item.get("_id") for item in user_docs if item.get("_id") is not None]

    play_stats_pipeline = [
        {"$match": {"userId": {"$in": user_ids}}},
        {
            "$group": {
                "_id": "$userId",
                "playsCount": {"$sum": 1},
                "lastPlayedAt": {"$max": "$playedAt"},
            }
        },
    ]
    play_stats_docs = await db.playHistory.aggregate(play_stats_pipeline).to_list(length=limit)
    play_stats_map = {str(item.get("_id")): item for item in play_stats_docs}

    token_stats_pipeline = [
        {"$match": {"userId": {"$in": user_ids}}},
        {"$sort": {"issuedAt": -1}},
        {
            "$group": {
                "_id": "$userId",
                "tokensIssued": {"$sum": 1},
                "lastIssuedAt": {"$first": "$issuedAt"},
            }
        },
    ]
    token_stats_docs = await db.authEvents.aggregate(token_stats_pipeline).to_list(length=limit)
    token_stats_map = {str(item.get("_id")): item for item in token_stats_docs}

    items = []
    for user in serialize_docs(user_docs):
        user_id = str(user.get("id"))
        play_stats = play_stats_map.get(user_id, {})
        token_stats = token_stats_map.get(user_id, {})

        user["likedSongsCount"] = len(user.get("likedSongs", []))
        user["dislikedSongsCount"] = len(user.get("dislikedSongs", []))
        user["recentlyPlayedCount"] = len(user.get("recentlyPlayed", []))
        user["playsCount"] = int(play_stats.get("playsCount", 0))
        user["lastPlayedAt"] = play_stats.get("lastPlayedAt")
        user["tokensIssued"] = int(token_stats.get("tokensIssued", 0))
        user["lastTokenIssuedAt"] = token_stats.get("lastIssuedAt")
        user["blocked"] = bool(user.get("blocked", False))
        items.append(user)

    return {"items": items}


@router.get("/settings")
async def get_settings(_: dict = Depends(require_admin)):
    db = get_database()
    doc = await db.appSettings.find_one({"key": ADMIN_SETTINGS_KEY})

    settings_doc = _normalize_admin_settings((doc or {}).get("settings"))
    return {
        "success": True,
        "settings": settings_doc,
        "updatedAt": (doc or {}).get("updatedAt"),
    }


@router.put("/settings")
async def update_settings(payload: AdminSettingsPayload, admin_user=Depends(require_admin)):
    db = get_database()
    now = datetime.now(timezone.utc).isoformat()
    settings_doc = payload.model_dump()

    await db.appSettings.update_one(
        {"key": ADMIN_SETTINGS_KEY},
        {
            "$set": {
                "key": ADMIN_SETTINGS_KEY,
                "settings": settings_doc,
                "updatedAt": now,
                "updatedBy": admin_user.get("_id"),
            },
            "$setOnInsert": {
                "createdAt": now,
            },
        },
        upsert=True,
    )

    return {
        "success": True,
        "detail": "Settings saved successfully.",
        "settings": settings_doc,
        "updatedAt": now,
    }


@router.get("/recommendation-controls")
async def get_recommendation_controls(_: dict = Depends(require_admin)):
    db = get_database()
    doc = await db.appSettings.find_one({"key": RECOMMENDATION_CONTROLS_KEY})
    controls = _normalize_recommendation_controls((doc or {}).get("controls"))
    return {
        "success": True,
        "controls": controls,
        "updatedAt": (doc or {}).get("updatedAt"),
    }


@router.put("/recommendation-controls")
async def update_recommendation_controls(
    payload: RecommendationControlsPayload,
    admin_user=Depends(require_admin),
):
    db = get_database()
    now = datetime.now(timezone.utc).isoformat()
    controls = payload.model_dump()

    await db.appSettings.update_one(
        {"key": RECOMMENDATION_CONTROLS_KEY},
        {
            "$set": {
                "key": RECOMMENDATION_CONTROLS_KEY,
                "controls": controls,
                "updatedAt": now,
                "updatedBy": admin_user.get("_id"),
            },
            "$setOnInsert": {
                "createdAt": now,
            },
        },
        upsert=True,
    )

    return {
        "success": True,
        "detail": "Recommendation controls updated.",
        "controls": controls,
        "updatedAt": now,
    }


@router.get("/weather-mapping")
async def get_weather_mapping(_: dict = Depends(require_admin)):
    db = get_database()
    doc = await db.appSettings.find_one({"key": WEATHER_MAPPING_KEY})
    mapping = _normalize_weather_mapping((doc or {}).get("mapping"))
    return {
        "success": True,
        "mapping": mapping,
        "updatedAt": (doc or {}).get("updatedAt"),
    }


@router.put("/weather-mapping")
async def update_weather_mapping(payload: WeatherMappingPayload, admin_user=Depends(require_admin)):
    db = get_database()
    now = datetime.now(timezone.utc).isoformat()
    mapping = _normalize_weather_mapping(payload.model_dump())

    await db.appSettings.update_one(
        {"key": WEATHER_MAPPING_KEY},
        {
            "$set": {
                "key": WEATHER_MAPPING_KEY,
                "mapping": mapping,
                "updatedAt": now,
                "updatedBy": admin_user.get("_id"),
            },
            "$setOnInsert": {
                "createdAt": now,
            },
        },
        upsert=True,
    )

    return {
        "success": True,
        "detail": "Weather mapping updated.",
        "mapping": mapping,
        "updatedAt": now,
    }


@router.get("/playlists")
async def admin_playlists(limit: int = Query(default=100, ge=1, le=400), _: dict = Depends(require_admin)):
    db = get_database()

    playlist_docs = await db.playlists.find({}).sort("createdAt", -1).limit(limit).to_list(length=limit)
    user_ids = [item.get("userId") for item in playlist_docs if item.get("userId") is not None]
    user_docs = await db.users.find({"_id": {"$in": user_ids}}, {"name": 1, "email": 1}).to_list(
        length=len(user_ids)
    )
    user_map = {str(item.get("_id")): item for item in user_docs}

    items = []
    for doc in playlist_docs:
        raw_user_id = doc.get("userId")
        user_id = _serialize_id(raw_user_id)
        user_doc = user_map.get(user_id or "", {})
        items.append(
            {
                "id": str(doc.get("_id")),
                "playlistName": doc.get("playlistName"),
                "songsCount": len(doc.get("songs", [])),
                "mood": doc.get("mood"),
                "weatherType": doc.get("weatherType"),
                "createdAt": doc.get("createdAt"),
                "userId": user_id,
                "userName": user_doc.get("name") or "Unknown",
                "userEmail": user_doc.get("email"),
            }
        )

    return {"items": items}


@router.delete("/playlists/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_playlist(playlist_id: str, _: dict = Depends(require_admin)):
    db = get_database()

    try:
        object_id = to_object_id(playlist_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid playlist id.") from exc

    result = await db.playlists.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Playlist not found.")
    return None


@router.get("/security/logs")
async def security_logs(limit: int = Query(default=80, ge=10, le=500), _: dict = Depends(require_admin)):
    db = get_database()

    auth_docs = await db.authEvents.find({}).sort("issuedAt", -1).limit(limit).to_list(length=limit)
    blocked_docs = (
        await db.users.find(
            {"blocked": True},
            {"name": 1, "email": 1, "blockedReason": 1, "blockedAt": 1},
        )
        .sort("blockedAt", -1)
        .limit(100)
        .to_list(length=100)
    )

    return {
        "logs": [
            {
                "id": str(item.get("_id")),
                "userId": _serialize_id(item.get("userId")),
                "event": item.get("event"),
                "issuedAt": item.get("issuedAt"),
                "expiresAt": item.get("expiresAt"),
                "tokenFingerprint": item.get("tokenFingerprint"),
            }
            for item in auth_docs
        ],
        "blockedUsers": [
            {
                "id": str(item.get("_id")),
                "name": item.get("name"),
                "email": item.get("email"),
                "blockedReason": item.get("blockedReason"),
                "blockedAt": item.get("blockedAt"),
            }
            for item in blocked_docs
        ],
    }


@router.get("/health")
async def system_health(_: dict = Depends(require_admin)):
    db = get_database()

    db_ok = True
    db_error = None
    try:
        await db.command("ping")
    except Exception as exc:
        db_ok = False
        db_error = str(exc)

    now_dt = datetime.now(timezone.utc)
    last_24h_iso = (now_dt - timedelta(hours=24)).isoformat()

    users_count = await db.users.count_documents({})
    songs_count = await db.songs.count_documents({})
    playlists_count = await db.playlists.count_documents({})
    plays_count = await db.playHistory.count_documents({})
    auth_24h = await db.authEvents.count_documents({"issuedAt": {"$gte": last_24h_iso}})

    last_play_doc = await db.playHistory.find_one({}, sort=[("playedAt", -1)])
    last_auth_doc = await db.authEvents.find_one({}, sort=[("issuedAt", -1)])

    return {
        "database": {
            "ok": db_ok,
            "error": db_error,
        },
        "metrics": {
            "users": users_count,
            "songs": songs_count,
            "playlists": playlists_count,
            "plays": plays_count,
            "authEvents24h": auth_24h,
        },
        "lastEvents": {
            "lastPlayAt": (last_play_doc or {}).get("playedAt"),
            "lastAuthAt": (last_auth_doc or {}).get("issuedAt"),
        },
        "checkedAt": now_dt.isoformat(),
    }


@router.get("/revenue")
async def revenue(_: dict = Depends(require_admin)):
    db = get_database()

    users_count = await db.users.count_documents({})
    premium_users_actual = await db.users.count_documents({"role": "premium"})
    premium_users = premium_users_actual if premium_users_actual > 0 else round(users_count * 0.18)
    free_users = max(users_count - premium_users, 0)

    arpu_monthly = 4.99
    mrr = round(premium_users * arpu_monthly, 2)
    arr = round(mrr * 12, 2)

    now_dt = datetime.now(timezone.utc)
    last_30d_iso = (now_dt - timedelta(days=30)).isoformat()
    active_users_30d = len(await db.playHistory.distinct("userId", {"playedAt": {"$gte": last_30d_iso}}))
    conversion_rate = round((premium_users / users_count) * 100, 2) if users_count else 0

    return {
        "totals": {
            "users": users_count,
            "premiumUsers": premium_users,
            "freeUsers": free_users,
            "activeUsers30d": active_users_30d,
        },
        "finance": {
            "arpuMonthly": arpu_monthly,
            "mrr": mrr,
            "arr": arr,
            "conversionRate": conversion_rate,
        },
        "tiers": [
            {"name": "Free", "users": free_users, "price": 0},
            {"name": "Premium", "users": premium_users, "price": arpu_monthly},
        ],
    }


@router.get("/notifications")
async def notifications(limit: int = Query(default=100, ge=1, le=400), _: dict = Depends(require_admin)):
    db = get_database()
    docs = (
        await db.appNotifications.find({})
        .sort([("pinned", -1), ("createdAt", -1)])
        .limit(limit)
        .to_list(length=limit)
    )

    return {
        "items": [
            {
                "id": str(item.get("_id")),
                "title": item.get("title"),
                "message": item.get("message"),
                "channel": item.get("channel", "in_app"),
                "active": bool(item.get("active", True)),
                "pinned": bool(item.get("pinned", False)),
                "createdAt": item.get("createdAt"),
                "updatedAt": item.get("updatedAt"),
            }
            for item in docs
        ]
    }


@router.post("/notifications", status_code=status.HTTP_201_CREATED)
async def create_notification(payload: AdminNotificationCreatePayload, admin_user=Depends(require_admin)):
    db = get_database()
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "title": payload.title,
        "message": payload.message,
        "channel": payload.channel,
        "active": True,
        "pinned": payload.pinned,
        "createdAt": now,
        "updatedAt": now,
        "createdBy": admin_user.get("_id"),
    }
    result = await db.appNotifications.insert_one(doc)
    created = await db.appNotifications.find_one({"_id": result.inserted_id})

    return {
        "id": str(created.get("_id")),
        "title": created.get("title"),
        "message": created.get("message"),
        "channel": created.get("channel"),
        "active": bool(created.get("active", True)),
        "pinned": bool(created.get("pinned", False)),
        "createdAt": created.get("createdAt"),
        "updatedAt": created.get("updatedAt"),
    }


@router.patch("/notifications/{notification_id}")
async def update_notification(
    notification_id: str,
    payload: AdminNotificationUpdatePayload,
    _: dict = Depends(require_admin),
):
    db = get_database()
    object_id = _parse_object_id(notification_id, label="notification id")

    update_data = {}
    if payload.active is not None:
        update_data["active"] = payload.active
    if payload.pinned is not None:
        update_data["pinned"] = payload.pinned

    if not update_data:
        raise HTTPException(status_code=400, detail="No notification fields provided.")

    update_data["updatedAt"] = datetime.now(timezone.utc).isoformat()
    result = await db.appNotifications.update_one({"_id": object_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found.")

    doc = await db.appNotifications.find_one({"_id": object_id})
    return {
        "id": str(doc.get("_id")),
        "title": doc.get("title"),
        "message": doc.get("message"),
        "channel": doc.get("channel"),
        "active": bool(doc.get("active", True)),
        "pinned": bool(doc.get("pinned", False)),
        "createdAt": doc.get("createdAt"),
        "updatedAt": doc.get("updatedAt"),
    }


@router.get("/feedback")
async def feedback(limit: int = Query(default=100, ge=1, le=400), _: dict = Depends(require_admin)):
    db = get_database()
    docs = await db.supportFeedback.find({}).sort("createdAt", -1).limit(limit).to_list(length=limit)

    return {
        "items": [
            {
                "id": str(item.get("_id")),
                "userEmail": item.get("userEmail"),
                "subject": item.get("subject"),
                "message": item.get("message"),
                "status": item.get("status", "new"),
                "adminNote": item.get("adminNote"),
                "createdAt": item.get("createdAt"),
                "updatedAt": item.get("updatedAt"),
            }
            for item in docs
        ]
    }


@router.post("/feedback", status_code=status.HTTP_201_CREATED)
async def create_feedback(payload: FeedbackCreatePayload, _: dict = Depends(require_admin)):
    db = get_database()
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "userEmail": payload.userEmail,
        "subject": payload.subject,
        "message": payload.message,
        "status": "new",
        "adminNote": None,
        "createdAt": now,
        "updatedAt": now,
    }
    result = await db.supportFeedback.insert_one(doc)
    created = await db.supportFeedback.find_one({"_id": result.inserted_id})

    return {
        "id": str(created.get("_id")),
        "userEmail": created.get("userEmail"),
        "subject": created.get("subject"),
        "message": created.get("message"),
        "status": created.get("status", "new"),
        "adminNote": created.get("adminNote"),
        "createdAt": created.get("createdAt"),
        "updatedAt": created.get("updatedAt"),
    }


@router.patch("/feedback/{feedback_id}")
async def update_feedback(
    feedback_id: str,
    payload: FeedbackUpdatePayload,
    _: dict = Depends(require_admin),
):
    db = get_database()
    object_id = _parse_object_id(feedback_id, label="feedback id")
    update_data = {
        "status": payload.status,
        "adminNote": payload.adminNote,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
    }

    result = await db.supportFeedback.update_one({"_id": object_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Feedback item not found.")

    item = await db.supportFeedback.find_one({"_id": object_id})
    return {
        "id": str(item.get("_id")),
        "userEmail": item.get("userEmail"),
        "subject": item.get("subject"),
        "message": item.get("message"),
        "status": item.get("status", "new"),
        "adminNote": item.get("adminNote"),
        "createdAt": item.get("createdAt"),
        "updatedAt": item.get("updatedAt"),
    }


@router.patch("/users/{user_id}/block")
async def block_user(
    user_id: str,
    payload: BlockUserRequest,
    admin_user=Depends(require_admin),
):
    db = get_database()

    try:
        object_id = to_object_id(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user id.") from exc

    if payload.blocked and object_id == admin_user.get("_id"):
        raise HTTPException(status_code=400, detail="You cannot block your own admin account.")

    now = datetime.now(timezone.utc).isoformat()
    update_data = {
        "blocked": payload.blocked,
        "blockedReason": payload.reason.strip() if payload.blocked and payload.reason else None,
        "blockedAt": now if payload.blocked else None,
        "updatedAt": now,
    }

    result = await db.users.update_one({"_id": object_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")

    target = await db.users.find_one({"_id": object_id}, {"password": 0})
    return {
        "success": True,
        "detail": "User blocked successfully." if payload.blocked else "User unblocked successfully.",
        "user": {
            "id": str(target.get("_id")),
            "name": target.get("name"),
            "email": target.get("email"),
            "role": target.get("role"),
            "blocked": bool(target.get("blocked", False)),
            "blockedReason": target.get("blockedReason"),
            "blockedAt": target.get("blockedAt"),
        },
    }


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: str,
    admin_user=Depends(require_admin),
):
    db = get_database()

    try:
        object_id = to_object_id(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid user id.") from exc

    if object_id == admin_user.get("_id"):
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account.")

    result = await db.users.delete_one({"_id": object_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found.")

    await db.playHistory.delete_many({"userId": object_id})
    await db.likedSongs.delete_many({"userId": object_id})
    await db.playlists.delete_many({"userId": object_id})
    await db.authEvents.delete_many({"userId": object_id})

    return None


@router.get("/weather-trends")
async def weather_trends(_: dict = Depends(require_admin)):
    db = get_database()

    pipeline = [
        {"$group": {"_id": "$weatherCondition", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    docs = await db.playHistory.aggregate(pipeline).to_list(length=100)

    return {
        "items": [
            {"weatherCondition": item.get("_id"), "count": item.get("count", 0)} for item in docs
        ]
    }
