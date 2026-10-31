from datetime import UTC, date, datetime
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

    customer: "Customer" = Relationship(back_populates="user")


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

    user: "User" = Relationship(back_populates="customer")


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


class BillingInterval(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


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


class Plan(SQLModel, table=True):
    __tablename__ = "plans"

    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(nullable=False, index=True)

    description: str | None = Field(default=None, nullable=True)

    billing_interval: BillingInterval = Field(nullable=False)

    billing_interval_count: int = Field(default=1, nullable=False)

    minimum_quantity: int = Field(default=1, nullable=False)

    start_date: date = Field(nullable=False)

    end_date: date | None = Field(default=None, nullable=True)

    auto_close: bool = Field(default=False, nullable=False)

    allow_early_close: bool = Field(default=False, nullable=False)

    allow_pause: bool = Field(default=False, nullable=False)

    allow_renewal: bool = Field(default=False, nullable=False)

    is_active: bool = Field(default=True, nullable=False)

    lines: list["PlanLine"] = Relationship(
        back_populates="plan", cascade_delete=True
    )


class PlanLine(SQLModel, table=True):
    __tablename__ = "plan_lines"

    id: int | None = Field(default=None, primary_key=True)

    plan_id: int = Field(foreign_key="plans.id", nullable=False, index=True)

    product_id: int = Field(foreign_key="products.id", nullable=False, index=True)

    quantity: int = Field(default=1, nullable=False)

    unit_price: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    plan: "Plan" = Relationship(back_populates="lines")


class SubscriptionStatus(str, Enum):
    DRAFT = "draft"
    QUOTATION = "quotation"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"


class Subscription(SQLModel, table=True):
    __tablename__ = "subscriptions"

    id: int | None = Field(default=None, primary_key=True)

    subscription_number: str = Field(unique=True, index=True, nullable=False)

    customer_id: int = Field(
        foreign_key="customers.id", nullable=False, index=True
    )

    plan_id: int = Field(foreign_key="plans.id", nullable=False, index=True)

    start_date: date = Field(nullable=False)

    expiry_date: date | None = Field(default=None, nullable=True)

    next_billing_date: date | None = Field(default=None, nullable=True)

    payment_terms_days: int = Field(default=0, nullable=False)

    status: SubscriptionStatus = Field(
        default=SubscriptionStatus.DRAFT, nullable=False
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )

    lines: list["SubscriptionLine"] = Relationship(
        back_populates="subscription", cascade_delete=True
    )


class SubscriptionLine(SQLModel, table=True):
    __tablename__ = "subscription_lines"

    id: int | None = Field(default=None, primary_key=True)

    subscription_id: int = Field(
        foreign_key="subscriptions.id", nullable=False, index=True
    )

    product_id: int = Field(foreign_key="products.id", nullable=False, index=True)

    quantity: int = Field(default=1, nullable=False)

    unit_price: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    tax_rate: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(5, 2), nullable=False),
    )

    subscription: "Subscription" = Relationship(back_populates="lines")


class InvoiceStatus(str, Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    CANCELLED = "cancelled"


class Invoice(SQLModel, table=True):
    __tablename__ = "invoices"

    id: int | None = Field(default=None, primary_key=True)

    invoice_number: str = Field(unique=True, index=True, nullable=False)

    customer_id: int = Field(
        foreign_key="customers.id", nullable=False, index=True
    )

    subscription_id: int = Field(
        foreign_key="subscriptions.id", nullable=False, index=True
    )

    issue_date: date = Field(nullable=False)

    due_date: date = Field(nullable=False)

    billing_period_start: date = Field(nullable=False)

    billing_period_end: date = Field(nullable=False)

    subtotal: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    discount_amount: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), nullable=False),
    )

    tax_amount: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), nullable=False),
    )

    total_amount: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    status: InvoiceStatus = Field(
        default=InvoiceStatus.DRAFT, nullable=False
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )

    lines: list["InvoiceLine"] = Relationship(
        back_populates="invoice", cascade_delete=True
    )


class InvoiceLine(SQLModel, table=True):
    __tablename__ = "invoice_lines"

    id: int | None = Field(default=None, primary_key=True)

    invoice_id: int = Field(
        foreign_key="invoices.id", nullable=False, index=True
    )

    product_id: int = Field(foreign_key="products.id", nullable=False, index=True)

    description: str = Field(nullable=False)

    quantity: int = Field(default=1, nullable=False)

    unit_price: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    discount_amount: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), nullable=False),
    )

    tax_amount: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), nullable=False),
    )

    line_total: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    invoice: "Invoice" = Relationship(back_populates="lines")

