from typing import List, Optional

from pydantic import BaseModel, Field


class TempRange(BaseModel):
    min: float = -10
    max: float = 45


class SongBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    artist: str = Field(min_length=1, max_length=120)
    language: str = Field(default="Tamil", min_length=1, max_length=30)
    genre: str = Field(default="Unknown", min_length=1, max_length=60)
    moods: List[str] = Field(default_factory=list)
    weatherTags: List[str] = Field(default_factory=list)
    timeTags: List[str] = Field(default_factory=list)
    tempRange: TempRange = Field(default_factory=TempRange)
    energy: float = Field(default=0.5, ge=0, le=1)
    popularity: int = Field(default=50, ge=0, le=100)
    soundcloudUrl: Optional[str] = None
    albumArt: Optional[str] = None
    duration: int = Field(default=180, ge=30)


class SongCreate(SongBase):
    pass


class SongUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=180)
    artist: Optional[str] = Field(default=None, min_length=1, max_length=120)
    language: Optional[str] = Field(default=None, min_length=1, max_length=30)
    genre: Optional[str] = Field(default=None, min_length=1, max_length=60)
    moods: Optional[List[str]] = None
    weatherTags: Optional[List[str]] = None
    timeTags: Optional[List[str]] = None
    tempRange: Optional[TempRange] = None
    energy: Optional[float] = Field(default=None, ge=0, le=1)
    popularity: Optional[int] = Field(default=None, ge=0, le=100)
    soundcloudUrl: Optional[str] = None
    albumArt: Optional[str] = None
    duration: Optional[int] = Field(default=None, ge=30)


class SongResponse(SongBase):
    id: str
    createdAt: str
    score: Optional[float] = None
