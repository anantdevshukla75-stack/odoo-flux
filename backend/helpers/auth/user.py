import jwt
from database.db import get_session
from database.model import User
from fastapi import Depends, HTTPException
from sqlmodel import Session

from helpers.auth.jwt import ACCESS_TOKEN_TYPE, decode_token
from helpers.auth.password import oauth2_scheme


def get_current_user(
    token: str = Depends(oauth2_scheme), session: Session = Depends(get_session)
):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_token(token, expected_type=ACCESS_TOKEN_TYPE)

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


def get_current_active_user(current_user: User = Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    return current_user
