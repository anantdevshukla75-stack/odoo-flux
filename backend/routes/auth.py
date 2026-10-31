import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from database import db, model
from database.auth import (
    EmailAlreadyRegisteredError,
    create_password_reset_token,
    create_user,
    get_password_reset_token,
    get_staff_by_id,
    get_user_by_email,
    get_user_by_id,
    list_staff,
    set_user_password,
    update_staff,
)
from helpers import auth
from helpers import email as email_service
from helpers.auth.jwt import REFRESH_TOKEN_TYPE
from routes.schemas import user

router = APIRouter()
logger = logging.getLogger(__name__)

PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 30


def _token_claims(db_user: model.User) -> dict:
    return {"sub": str(db_user.id), "role": db_user.role.value}


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def _to_utc(value: datetime) -> datetime:
    # SQLite drops tzinfo on read, so re-attach UTC for comparisons
    return value if value.tzinfo else value.replace(tzinfo=UTC)


@router.post(
    "/register", response_model=user.UserCreateResponse, status_code=201
)
def register(data: user.UserCreate, session: Session = Depends(db.get_session)):
    try:
        new_user = create_user(
            session,
            email=data.email,
            full_name=data.full_name,
            password_hash=auth.hash_password(data.password),
        )
    except EmailAlreadyRegisteredError:
        raise HTTPException(status_code=409, detail="Email already registered")

    return new_user


@router.post("/login", response_model=user.UserLoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(db.get_session),
):
    db_user = get_user_by_email(session, form_data.username)

    if not db_user or not auth.verify_password(
        form_data.password, db_user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    claims = _token_claims(db_user)

    return user.UserLoginResponse(
        access_token=auth.create_access_token(claims),
        refresh_token=auth.create_refresh_token(claims),
    )


@router.post("/refresh", response_model=user.UserLoginResponse)
def refresh(
    data: user.TokenRefresh, session: Session = Depends(db.get_session)
):
    try:
        payload = auth.decode_token(
            data.refresh_token, expected_type=REFRESH_TOKEN_TYPE
        )
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, KeyError, ValueError, TypeError):
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db_user = get_user_by_id(session, user_id)

    if db_user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not db_user.is_active:
        raise HTTPException(status_code=403, detail="Inactive user")

    claims = _token_claims(db_user)

    return user.UserLoginResponse(
        access_token=auth.create_access_token(claims),
        refresh_token=auth.create_refresh_token(claims),
    )


@router.get("/me", response_model=user.UserCreateResponse)
def me(current_user: model.User = Depends(auth.get_current_active_user)):
    return current_user


@router.post("/logout", status_code=204)
def logout(current_user: model.User = Depends(auth.get_current_active_user)):
    return Response(status_code=204)


@router.post("/forgot-password", status_code=202)
def forgot_password(
    data: user.PasswordResetRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(db.get_session),
):
    db_user = get_user_by_email(session, data.email)

    if db_user and db_user.is_active:
        raw_token = secrets.token_urlsafe(32)

        create_password_reset_token(
            session,
            user_id=db_user.id,
            token_hash=_hash_token(raw_token),
            expires_at=datetime.now(UTC)
            + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
        )

        if email_service.is_configured():
            background_tasks.add_task(
                email_service.send_password_reset, db_user.email, raw_token
            )
        else:
            logger.warning("Password reset requested but SMTP is not configured")

    return Response(status_code=202)


@router.post("/reset-password", status_code=204)
def reset_password(
    data: user.PasswordReset, session: Session = Depends(db.get_session)
):
    token_row = get_password_reset_token(session, _hash_token(data.token))

    now = datetime.now(UTC)

    if (
        token_row is None
        or token_row.used_at is not None
        or _to_utc(token_row.expires_at) < now
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    db_user = get_user_by_id(session, token_row.user_id)

    if db_user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    set_user_password(
        session,
        db_user=db_user,
        password_hash=auth.hash_password(data.new_password),
        now=now,
    )

    return Response(status_code=204)


@router.post("/staff", response_model=user.StaffResponse, status_code=201)
def staff(
    data: user.StaffCreate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    try:
        new_user = create_user(
            session,
            email=data.email,
            full_name=data.full_name,
            password_hash=auth.hash_password(data.password),
            role=model.UserRole.STAFF,
        )
    except EmailAlreadyRegisteredError:
        raise HTTPException(status_code=409, detail="Email already registered")

    return new_user


@router.get("/staff", response_model=list[user.StaffResponse])
def staff_directory(
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    return list_staff(session, offset=offset, limit=limit)


@router.get("/staff/{staff_id}", response_model=user.StaffResponse)
def get_staff(
    staff_id: int,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    db_staff = get_staff_by_id(session, staff_id)
    if db_staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return db_staff


@router.patch("/staff/{staff_id}", response_model=user.StaffResponse)
def patch_staff(
    staff_id: int,
    data: user.StaffUpdate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.require_admin),
):
    db_staff = get_staff_by_id(session, staff_id)
    if db_staff is None:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return update_staff(session, db_staff, is_active=data.is_active)
