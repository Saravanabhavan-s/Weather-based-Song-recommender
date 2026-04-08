from datetime import datetime, timedelta, timezone
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.config.settings import settings
from app.core.dependencies import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.database.mongo import get_database
from app.schemas.auth import GoogleOAuthRequest, LoginRequest, RegisterRequest, TokenResponse
from app.utils.serialization import serialize_doc

router = APIRouter(prefix="/auth", tags=["Auth"])


async def record_token_issue(db, user_id, event: str, token: str, issued_at: datetime) -> None:
    expires_at = issued_at + timedelta(minutes=settings.jwt_expire_minutes)
    await db.authEvents.insert_one(
        {
            "userId": user_id,
            "event": event,
            "issuedAt": issued_at.isoformat(),
            "expiresAt": expires_at.isoformat(),
            "tokenFingerprint": token[-18:],
        }
    )


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest):
    db = get_database()
    email = payload.email.lower()

    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered.")

    now_dt = datetime.now(timezone.utc)
    now = now_dt.isoformat()
    user_doc = {
        "name": payload.name,
        "email": email,
        "password": hash_password(payload.password),
        "role": "user",
        "blocked": False,
        "blockedReason": None,
        "blockedAt": None,
        "favoriteArtists": payload.favoriteArtists,
        "favoriteGenres": payload.favoriteGenres,
        "likedSongs": [],
        "dislikedSongs": [],
        "recentlyPlayed": [],
        "createdAt": now,
    }

    result = await db.users.insert_one(user_doc)
    created = await db.users.find_one({"_id": result.inserted_id})

    user = serialize_doc(created)
    user.pop("password", None)

    token = create_access_token(subject=user["id"])
    await record_token_issue(db=db, user_id=created["_id"], event="register", token=token, issued_at=now_dt)
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    db = get_database()
    email = payload.email.lower()

    user_doc = await db.users.find_one({"email": email})
    if not user_doc or not verify_password(payload.password, user_doc["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")

    if user_doc.get("blocked"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is blocked by admin.")

    user = serialize_doc(user_doc)
    user.pop("password", None)

    token = create_access_token(subject=user["id"])
    await record_token_issue(
        db=db,
        user_id=user_doc["_id"],
        event="login",
        token=token,
        issued_at=datetime.now(timezone.utc),
    )
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/oauth/google", response_model=TokenResponse)
async def oauth_google(payload: GoogleOAuthRequest):
    db = get_database()

    if not settings.google_client_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth is not configured on the server.",
        )

    try:
        id_info = google_id_token.verify_oauth2_token(
            payload.credential,
            google_requests.Request(),
            settings.google_client_id,
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google credential.") from exc

    email = str(id_info.get("email") or "").strip().lower()
    if not email or not id_info.get("email_verified"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google account email is not verified.",
        )

    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()

    user_doc = await db.users.find_one({"email": email})
    event_name = "oauth_google_login"

    if user_doc is None:
        display_name = str(id_info.get("name") or email.split("@")[0]).strip()[:80] or "Google User"
        create_doc = {
            "name": display_name,
            "email": email,
            "password": hash_password(secrets.token_urlsafe(24)),
            "role": "user",
            "blocked": False,
            "blockedReason": None,
            "blockedAt": None,
            "favoriteArtists": [],
            "favoriteGenres": [],
            "likedSongs": [],
            "dislikedSongs": [],
            "recentlyPlayed": [],
            "authProvider": "google",
            "googleSub": id_info.get("sub"),
            "avatarUrl": id_info.get("picture"),
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }
        result = await db.users.insert_one(create_doc)
        user_doc = await db.users.find_one({"_id": result.inserted_id})
        event_name = "oauth_google_register"
    else:
        if user_doc.get("blocked"):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is blocked by admin.")

        update_data = {"updatedAt": now_iso}

        google_sub = id_info.get("sub")
        if google_sub and user_doc.get("googleSub") != google_sub:
            update_data["googleSub"] = google_sub

        picture = id_info.get("picture")
        if picture:
            update_data["avatarUrl"] = picture

        auth_provider = str(user_doc.get("authProvider") or "").strip().lower()
        if not auth_provider:
            update_data["authProvider"] = "google"

        await db.users.update_one({"_id": user_doc["_id"]}, {"$set": update_data})
        user_doc = await db.users.find_one({"_id": user_doc["_id"]})

    user = serialize_doc(user_doc)
    user.pop("password", None)

    token = create_access_token(subject=user["id"])
    await record_token_issue(
        db=db,
        user_id=user_doc["_id"],
        event=event_name,
        token=token,
        issued_at=now_dt,
    )

    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return current_user
