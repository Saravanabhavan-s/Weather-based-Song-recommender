from typing import List, Optional

from pydantic import BaseModel, Field


class UserProfileUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=80)
    favoriteArtists: Optional[List[str]] = None
    favoriteGenres: Optional[List[str]] = None


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    favoriteArtists: List[str] = Field(default_factory=list)
    favoriteGenres: List[str] = Field(default_factory=list)
    likedSongs: List[str] = Field(default_factory=list)
    dislikedSongs: List[str] = Field(default_factory=list)
    recentlyPlayed: List[str] = Field(default_factory=list)
    createdAt: str


class ExternalSongPayload(BaseModel):
    externalId: Optional[str] = Field(default=None, min_length=1, max_length=120)
    source: Optional[str] = Field(default=None, min_length=1, max_length=40)
    title: str = Field(min_length=1, max_length=180)
    artist: str = Field(min_length=1, max_length=120)
    album: Optional[str] = Field(default=None, max_length=180)
    albumArt: Optional[str] = None
    audio: Optional[str] = None
    soundcloudUrl: Optional[str] = None
    moods: List[str] = Field(default_factory=list)
    weatherTags: List[str] = Field(default_factory=list)
    timeTags: List[str] = Field(default_factory=list)
    duration: Optional[int] = Field(default=180, ge=1)


class SongActionRequest(BaseModel):
    songId: str = Field(min_length=1, max_length=120)
    song: Optional[ExternalSongPayload] = None
