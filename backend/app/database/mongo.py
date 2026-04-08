from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING

from app.config.settings import settings

_client: Optional[AsyncIOMotorClient] = None
_database: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongo() -> None:
    global _client
    global _database

    _client = AsyncIOMotorClient(settings.mongo_uri)
    _database = _client[settings.mongo_db_name]
    await ensure_indexes(_database)


async def close_mongo_connection() -> None:
    global _client
    global _database

    if _client is not None:
        _client.close()
    _client = None
    _database = None


def get_database() -> AsyncIOMotorDatabase:
    if _database is None:
        raise RuntimeError("Database connection is not initialized.")
    return _database


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    await db.users.create_index([("email", ASCENDING)], unique=True)
    await db.users.create_index([("role", ASCENDING)])
    await db.users.create_index([("blocked", ASCENDING)])
    await db.users.create_index([("favoriteArtists", ASCENDING)])

    await db.songs.create_index([("title", ASCENDING)])
    await db.songs.create_index([("artist", ASCENDING)])
    await db.songs.create_index([("weatherTags", ASCENDING)])
    await db.songs.create_index([("moods", ASCENDING)])
    await db.songs.create_index([("popularity", DESCENDING)])
    await db.songs.create_index([("source", ASCENDING), ("externalId", ASCENDING)], unique=True, sparse=True)

    await db.playHistory.create_index([("userId", ASCENDING), ("playedAt", DESCENDING)])
    await db.likedSongs.create_index([("userId", ASCENDING), ("songId", ASCENDING)], unique=True)
    await db.playlists.create_index([("userId", ASCENDING), ("createdAt", DESCENDING)])

    await db.authEvents.create_index([("issuedAt", DESCENDING)])
    await db.authEvents.create_index([("expiresAt", ASCENDING)])
    await db.authEvents.create_index([("event", ASCENDING), ("issuedAt", DESCENDING)])
    await db.authEvents.create_index([("userId", ASCENDING), ("issuedAt", DESCENDING)])

    await db.appSettings.create_index([("key", ASCENDING)], unique=True)
    await db.appNotifications.create_index([("createdAt", DESCENDING)])
    await db.appNotifications.create_index([("active", ASCENDING), ("pinned", DESCENDING)])
    await db.supportFeedback.create_index([("createdAt", DESCENDING)])
    await db.supportFeedback.create_index([("status", ASCENDING), ("updatedAt", DESCENDING)])
