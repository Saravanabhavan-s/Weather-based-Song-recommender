from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field


class BlockUserRequest(BaseModel):
    blocked: bool
    reason: Optional[str] = Field(default=None, max_length=240)


class AdminSettingsPayload(BaseModel):
    appName: str = Field(default="Vibecast", min_length=2, max_length=80)
    supportEmail: EmailStr = Field(default="support@vibecast.app")
    featuredCity: str = Field(default="Chennai", min_length=2, max_length=80)
    maintenanceMode: bool = False
    allowNewRegistrations: bool = True
    defaultRecommendationLimit: int = Field(default=12, ge=5, le=30)
    weatherRefreshMinutes: int = Field(default=15, ge=5, le=120)


class RecommendationControlsPayload(BaseModel):
    weatherWeight: int = Field(default=5, ge=1, le=10)
    moodWeight: int = Field(default=4, ge=1, le=10)
    timeWeight: int = Field(default=3, ge=1, le=10)
    temperatureWeight: int = Field(default=2, ge=1, le=10)
    artistAffinityWeight: int = Field(default=4, ge=1, le=10)
    popularityWeight: int = Field(default=2, ge=1, le=10)
    recentPenaltyWeight: int = Field(default=3, ge=1, le=10)
    maxCandidatePool: int = Field(default=400, ge=50, le=2000)
    diversityBoost: float = Field(default=0.15, ge=0, le=1)


class WeatherMappingPayload(BaseModel):
    rain: list[str] = Field(default_factory=lambda: ["romantic", "calm", "melancholic"])
    clear: list[str] = Field(default_factory=lambda: ["happy", "energetic"])
    cloud: list[str] = Field(default_factory=lambda: ["chill", "soft"])
    thunder: list[str] = Field(default_factory=lambda: ["intense", "emotional"])
    mist: list[str] = Field(default_factory=lambda: ["dreamy", "lo-fi"])
    snow: list[str] = Field(default_factory=lambda: ["peaceful", "cozy"])


class AdminNotificationCreatePayload(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    message: str = Field(min_length=3, max_length=600)
    channel: Literal["in_app", "email", "push"] = "in_app"
    pinned: bool = False


class AdminNotificationUpdatePayload(BaseModel):
    active: Optional[bool] = None
    pinned: Optional[bool] = None


class FeedbackCreatePayload(BaseModel):
    userEmail: Optional[EmailStr] = None
    subject: str = Field(min_length=3, max_length=140)
    message: str = Field(min_length=3, max_length=1000)


class FeedbackUpdatePayload(BaseModel):
    status: Literal["new", "in_progress", "resolved"]
    adminNote: Optional[str] = Field(default=None, max_length=300)