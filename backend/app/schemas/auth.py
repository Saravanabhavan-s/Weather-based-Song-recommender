from typing import List

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    favoriteArtists: List[str] = Field(default_factory=list)
    favoriteGenres: List[str] = Field(default_factory=list)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class GoogleOAuthRequest(BaseModel):
    credential: str = Field(min_length=32)


class AuthUserResponse(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    blocked: bool = False
    blockedReason: str | None = None
    favoriteArtists: List[str] = Field(default_factory=list)
    favoriteGenres: List[str] = Field(default_factory=list)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUserResponse
