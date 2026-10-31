import hashlib
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from database import db, model
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm
from helpers import auth
from helpers.auth.jwt import REFRESH_TOKEN_TYPE
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from routes.schemas import user

router = APIRouter()

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
    existing = session.exec(
        select(model.User).where(model.User.email == data.email)
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    new_user = model.User(
        email=data.email,
        full_name=data.full_name,
        password_hash=auth.hash_password(data.password),
    )

    session.add(new_user)

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")

    session.refresh(new_user)

    return new_user


@router.post("/login", response_model=user.UserLoginResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(db.get_session),
):
    statement = select(model.User).where(model.User.email == form_data.username)

    db_user = session.exec(statement).first()

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

    db_user = session.get(model.User, user_id)

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
def logout():
    return Response(status_code=204)


@router.post("/forgot-password", status_code=202)
def forgot_password(
    data: user.PasswordResetRequest, session: Session = Depends(db.get_session)
):
    db_user = session.exec(
        select(model.User).where(model.User.email == data.email)
    ).first()

    if db_user and db_user.is_active:
        # Invalidate any outstanding reset tokens for this user
        outstanding = session.exec(
            select(model.PasswordResetToken).where(
                model.PasswordResetToken.user_id == db_user.id,
                model.PasswordResetToken.used_at.is_(None),
            )
        ).all()

        for token_row in outstanding:
            session.delete(token_row)

        raw_token = secrets.token_urlsafe(32)

        session.add(
            model.PasswordResetToken(
                user_id=db_user.id,
                token_hash=_hash_token(raw_token),
                expires_at=datetime.now(UTC)
                + timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES),
            )
        )

        session.commit()

        # Stub: email delivery is not wired up yet, so raw_token is not exposed.

    return Response(status_code=202)


@router.post("/reset-password", status_code=204)
def reset_password(
    data: user.PasswordReset, session: Session = Depends(db.get_session)
):
    token_row = session.exec(
        select(model.PasswordResetToken).where(
            model.PasswordResetToken.token_hash == _hash_token(data.token)
        )
    ).first()

    now = datetime.now(UTC)

    if (
        token_row is None
        or token_row.used_at is not None
        or _to_utc(token_row.expires_at) < now
    ):
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    db_user = session.get(model.User, token_row.user_id)

    if db_user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    db_user.password_hash = auth.hash_password(data.new_password)

    # Invalidate every outstanding token for this user
    outstanding = session.exec(
        select(model.PasswordResetToken).where(
            model.PasswordResetToken.user_id == db_user.id,
            model.PasswordResetToken.used_at.is_(None),
        )
    ).all()

    for outstanding_row in outstanding:
        outstanding_row.used_at = now
        session.add(outstanding_row)

    session.add(db_user)
    session.commit()

    return Response(status_code=204)


@router.post("/staff", response_model=user.UserCreateResponse, status_code=201)
def staff(
    data: user.StaffCreate,
    session: Session = Depends(db.get_session),
    current_user: model.User = Depends(auth.get_current_active_user),
):
    if current_user.role != model.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin privileges required")

    existing = session.exec(
        select(model.User).where(model.User.email == data.email)
    ).first()

    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    new_user = model.User(
        email=data.email,
        full_name=data.full_name,
        password_hash=auth.hash_password(data.password),
        role=model.UserRole.STAFF,
    )

    session.add(new_user)

    try:
        session.commit()
    except IntegrityError:
        session.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")

    session.refresh(new_user)

    return new_user
