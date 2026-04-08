from fastapi import Depends, HTTPException, status

from app.core.security import decode_access_token, oauth2_scheme
from app.database.mongo import get_database
from app.utils.serialization import to_object_id


async def get_current_user_document(token: str = Depends(oauth2_scheme)):
    user_id = decode_access_token(token)
    db = get_database()

    try:
        object_id = to_object_id(user_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject.") from exc

    user = await db.users.find_one({"_id": object_id})
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    if user.get("blocked"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is blocked by admin.")
    return user


async def get_current_user(user=Depends(get_current_user_document)):
    safe_user = dict(user)
    safe_user["id"] = str(safe_user.pop("_id"))
    safe_user.pop("password", None)
    return safe_user


async def require_admin(user=Depends(get_current_user_document)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required.")
    return user
