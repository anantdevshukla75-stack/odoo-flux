from sqlmodel import Field, SQLModel
from typing import Literal
from enum import Enum
from datetime import datetime, timezone

class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"
    CUSTOMER = "customer"

class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)

    email: str = Field(
        unique=True,
        index=True,
        nullable=False
    )

    password_hash: str = Field(nullable=False)

    full_name: str = Field(
        unique=True,
        nullable=False
    )

    role: UserRole = Field(
        default=UserRole.CUSTOMER,
        nullable=False
    )

    is_active: bool = Field(
        default=True,
        nullable=False
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False
    )
