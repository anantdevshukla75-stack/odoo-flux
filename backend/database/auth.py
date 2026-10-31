from datetime import datetime

from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from database import model


class EmailAlreadyRegisteredError(Exception):
    """Raised when a user with the given email already exists."""

    def __init__(self, email: str):
        self.email = email
        super().__init__(f"Email already registered: {email}")


def get_user_by_id(session: Session, user_id: int) -> model.User | None:
    return session.get(model.User, user_id)


def get_user_by_email(session: Session, email: str) -> model.User | None:
    statement = select(model.User).where(model.User.email == email)
    return session.exec(statement).first()


def create_user(
    session: Session,
    *,
    email: str,
    full_name: str,
    password_hash: str,
    role: model.UserRole = model.UserRole.CUSTOMER,
) -> model.User:
    if get_user_by_email(session, email) is not None:
        raise EmailAlreadyRegisteredError(email)

    db_user = model.User(
        email=email,
        full_name=full_name,
        password_hash=password_hash,
        role=role,
    )

    session.add(db_user)

    try:
        session.commit()
    except IntegrityError as exc:
        session.rollback()
        raise EmailAlreadyRegisteredError(email) from exc

    session.refresh(db_user)

    return db_user


def create_password_reset_token(
    session: Session,
    *,
    user_id: int,
    token_hash: str,
    expires_at: datetime,
) -> model.PasswordResetToken:
    _delete_unused_reset_tokens(session, user_id)

    token = model.PasswordResetToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=expires_at,
    )

    session.add(token)
    session.commit()
    session.refresh(token)

    return token


def get_password_reset_token(
    session: Session, token_hash: str
) -> model.PasswordResetToken | None:
    statement = select(model.PasswordResetToken).where(
        model.PasswordResetToken.token_hash == token_hash
    )
    return session.exec(statement).first()


def set_user_password(
    session: Session,
    *,
    db_user: model.User,
    password_hash: str,
    now: datetime,
) -> None:
    db_user.password_hash = password_hash
    session.add(db_user)

    _mark_unused_reset_tokens_used(session, db_user.id, now)

    session.commit()


def _get_unused_reset_tokens(
    session: Session, user_id: int
) -> list[model.PasswordResetToken]:
    return list(
        session.exec(
            select(model.PasswordResetToken).where(
                model.PasswordResetToken.user_id == user_id,
                model.PasswordResetToken.used_at.is_(None),
            )
        ).all()
    )


def _delete_unused_reset_tokens(session: Session, user_id: int) -> None:
    for token in _get_unused_reset_tokens(session, user_id):
        session.delete(token)


def _mark_unused_reset_tokens_used(
    session: Session, user_id: int, now: datetime
) -> None:
    for token in _get_unused_reset_tokens(session, user_id):
        token.used_at = now
        session.add(token)
