import jwt
from config import settings
from database.db import get_session
from database.model import User
from fastapi import Depends, HTTPException
from sqlmodel import Session

from backend.helpers.auth.password import oauth2_scheme


def get_current_user(
    token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise credentials_exception

    user = session.get(User, user_id)

    if user is None:
        raise credentials_exception

    return user
