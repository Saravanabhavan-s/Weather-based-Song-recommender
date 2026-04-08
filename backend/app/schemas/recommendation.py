from typing import List

from pydantic import BaseModel, Field

from app.schemas.song import SongResponse


class RecommendationResponse(BaseModel):
    weatherCondition: str
    temperature: float
    mood: str
    timeOfDay: str
    recommendations: List[SongResponse] = Field(default_factory=list)
