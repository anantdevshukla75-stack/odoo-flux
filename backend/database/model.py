from datetime import UTC, datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Column, Numeric
from sqlmodel import Field, Relationship, SQLModel


class UserRole(str, Enum):
    ADMIN = "admin"
    STAFF = "staff"
    CUSTOMER = "customer"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: int | None = Field(default=None, primary_key=True)

    email: str = Field(unique=True, index=True, nullable=False)

    password_hash: str = Field(nullable=False)

    full_name: str = Field(nullable=False)

    role: UserRole = Field(default=UserRole.CUSTOMER, nullable=False)

    is_active: bool = Field(default=True, nullable=False)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )


class Customer(SQLModel, table=True):
    __tablename__ = "customers"

    id: int | None = Field(default=None, primary_key=True)

    user_id: int = Field(
        foreign_key="users.id", unique=True, nullable=False, index=True
    )

    company_name: str | None = Field(default=None, nullable=True)

    phone: str | None = Field(default=None, nullable=True)

    billing_address: str | None = Field(default=None, nullable=True)

    tax_number: str | None = Field(default=None, nullable=True)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )


class PasswordResetToken(SQLModel, table=True):
    __tablename__ = "password_reset_tokens"

    id: int | None = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="users.id", nullable=False, index=True)

    token_hash: str = Field(unique=True, index=True, nullable=False)

    expires_at: datetime = Field(nullable=False)

    used_at: datetime | None = Field(default=None, nullable=True)


class ProductType(str, Enum):
    SERVICE = "service"
    GOODS = "goods"
    SUBSCRIPTION = "subscription"


class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(nullable=False, index=True)

    product_type: ProductType = Field(
        default=ProductType.SERVICE, nullable=False
    )

    sales_price: Decimal = Field(
        sa_column=Column(Numeric(12, 2), nullable=False)
    )

    cost_price: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    notes: str | None = Field(default=None, nullable=True)

    is_active: bool = Field(default=True, nullable=False)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )
