from typing import List, Optional

from pydantic import BaseModel, Field

from app.schemas.user import ExternalSongPayload


class PlaylistSongInput(BaseModel):
    songId: str = Field(min_length=1, max_length=120)
    song: Optional[ExternalSongPayload] = None


class PlaylistCreateRequest(BaseModel):
    playlistName: str = Field(min_length=2, max_length=100)
    songs: List[str] = Field(default_factory=list)
    songItems: List[PlaylistSongInput] = Field(default_factory=list)
    mood: Optional[str] = None
    weatherType: Optional[str] = None


class PlaylistResponse(BaseModel):
    id: str
    userId: str
    playlistName: str
    songs: List[str]
    mood: Optional[str] = None
    weatherType: Optional[str] = None
    createdAt: str
