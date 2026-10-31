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


def _token_claims(db_user: model.User) -> dict:
    return {"sub": str(db_user.id), "role": db_user.role.value}


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


@router.post("/forgot-password")
def forgot_password():
    return {"route": "forgot-password"}


@router.post("/reset-password")
def reset_password():
    return {"route": "reset-password"}


@router.post("/staff")
def staff():
    return {"route": "staff"}
