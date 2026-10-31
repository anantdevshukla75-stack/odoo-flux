from datetime import UTC, date, datetime
from decimal import Decimal
from enum import Enum

from sqlalchemy import Column, Index, Numeric, text
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


class ProductVariant(SQLModel, table=True):
    __tablename__ = "product_variants"

    id: int | None = Field(default=None, primary_key=True)

    product_id: int = Field(foreign_key="products.id", nullable=False, index=True)

    attribute_name: str = Field(nullable=False)

    attribute_value: str = Field(nullable=False)

    code: str | None = Field(default=None, nullable=True)

    price_adjustment: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), nullable=False),
    )

    is_active: bool = Field(default=True, nullable=False)


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


class QuotationTemplate(SQLModel, table=True):
    __tablename__ = "quotation_templates"

    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(nullable=False, index=True)

    description: str | None = Field(default=None, nullable=True)

    default_plan_id: int | None = Field(
        default=None, foreign_key="plans.id", nullable=True, index=True
    )

    validity_days: int = Field(default=30, nullable=False)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )

    product_lines: list["QuotationTemplateLine"] = Relationship(
        back_populates="template", cascade_delete=True
    )


class QuotationTemplateLine(SQLModel, table=True):
    __tablename__ = "quotation_template_lines"

    id: int | None = Field(default=None, primary_key=True)

    template_id: int = Field(
        foreign_key="quotation_templates.id", nullable=False, index=True
    )

    product_id: int = Field(foreign_key="products.id", nullable=False, index=True)

    variant_id: int | None = Field(
        default=None, foreign_key="product_variants.id", nullable=True, index=True
    )

    quantity: int = Field(default=1, nullable=False)

    unit_price: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    template: "QuotationTemplate" = Relationship(back_populates="product_lines")


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

    payments: list["Payment"] = Relationship(back_populates="invoice")


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


class PaymentMethod(str, Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CARD = "card"
    UPI = "upi"
    OTHER = "other"


class Payment(SQLModel, table=True):
    __tablename__ = "payments"

    id: int | None = Field(default=None, primary_key=True)

    invoice_id: int = Field(
        foreign_key="invoices.id", nullable=False, index=True
    )

    payment_method: PaymentMethod = Field(nullable=False)

    amount: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    payment_date: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )

    reference: str | None = Field(default=None, nullable=True)

    note: str | None = Field(default=None, nullable=True)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )

    invoice: "Invoice" = Relationship(back_populates="payments")


class TaxCalculationType(str, Enum):
    EXCLUSIVE = "exclusive"
    INCLUSIVE = "inclusive"


class Tax(SQLModel, table=True):
    __tablename__ = "taxes"
    __table_args__ = (
        Index(
            "uq_taxes_single_active_default",
            "is_default",
            unique=True,
            sqlite_where=text("is_active = 1 AND is_default = 1"),
            postgresql_where=text("is_active = true AND is_default = true"),
        ),
    )

    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(nullable=False, index=True)

    rate: Decimal = Field(sa_column=Column(Numeric(5, 2), nullable=False))

    calculation_type: TaxCalculationType = Field(
        default=TaxCalculationType.EXCLUSIVE, nullable=False
    )

    is_default: bool = Field(default=False, nullable=False)

    is_active: bool = Field(default=True, nullable=False)

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )


class DiscountType(str, Enum):
    FIXED = "fixed"
    PERCENTAGE = "percentage"


class DiscountAppliesTo(str, Enum):
    ALL = "all"
    PRODUCT_SPECIFIC = "product_specific"
    SUBSCRIPTION_WIDE = "subscription_wide"


class Discount(SQLModel, table=True):
    __tablename__ = "discounts"

    id: int | None = Field(default=None, primary_key=True)

    name: str = Field(nullable=False, index=True)

    code: str = Field(unique=True, index=True, nullable=False)

    description: str | None = Field(default=None, nullable=True)

    discount_type: DiscountType = Field(nullable=False)

    value: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    min_purchase: Decimal | None = Field(
        default=None, sa_column=Column(Numeric(12, 2), nullable=True)
    )

    min_quantity: int = Field(default=1, nullable=False)

    start_date: date = Field(nullable=False)

    end_date: date | None = Field(default=None, nullable=True)

    usage_limit: int | None = Field(default=None, nullable=True)

    redemptions_count: int = Field(default=0, nullable=False)

    applicability: DiscountAppliesTo = Field(
        default=DiscountAppliesTo.ALL, nullable=False
    )

    is_active: bool = Field(default=True, nullable=False)


class DiscountProduct(SQLModel, table=True):
    __tablename__ = "discount_products"

    discount_id: int = Field(
        foreign_key="discounts.id", primary_key=True, nullable=False
    )

    product_id: int = Field(
        foreign_key="products.id", primary_key=True, nullable=False
    )


class DiscountPlan(SQLModel, table=True):
    __tablename__ = "discount_plans"

    discount_id: int = Field(
        foreign_key="discounts.id", primary_key=True, nullable=False
    )

    plan_id: int = Field(
        foreign_key="plans.id", primary_key=True, nullable=False
    )


class DiscountRedemption(SQLModel, table=True):
    __tablename__ = "discount_redemptions"

    id: int | None = Field(default=None, primary_key=True)

    discount_id: int = Field(foreign_key="discounts.id", nullable=False, index=True)

    subscription_id: int | None = Field(
        default=None, foreign_key="subscriptions.id", nullable=True, index=True
    )

    invoice_id: int | None = Field(
        default=None, foreign_key="invoices.id", nullable=True, index=True
    )

    redeemed_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )


class QuotationStatus(str, Enum):
    DRAFT = "draft"
    SENT = "sent"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"


class Quotation(SQLModel, table=True):
    __tablename__ = "quotations"

    id: int | None = Field(default=None, primary_key=True)

    quotation_number: str = Field(unique=True, index=True, nullable=False)

    customer_id: int = Field(foreign_key="customers.id", nullable=False, index=True)

    plan_id: int = Field(foreign_key="plans.id", nullable=False, index=True)

    status: QuotationStatus = Field(default=QuotationStatus.DRAFT, nullable=False)

    valid_until: date = Field(nullable=False)

    payment_terms: str | None = Field(default=None, nullable=True)

    notes: str | None = Field(default=None, nullable=True)

    tax_id: int | None = Field(default=None, foreign_key="taxes.id", nullable=True)

    discount_code: str | None = Field(default=None, nullable=True)

    subtotal: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    tax_amount: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    discount_amount: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), nullable=False),
    )

    total_amount: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    subscription_id: int | None = Field(
        default=None, foreign_key="subscriptions.id", nullable=True, index=True
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), nullable=False
    )

    product_lines: list["QuotationLine"] = Relationship(
        back_populates="quotation", cascade_delete=True
    )


class QuotationLine(SQLModel, table=True):
    __tablename__ = "quotation_lines"

    id: int | None = Field(default=None, primary_key=True)

    quotation_id: int = Field(
        foreign_key="quotations.id", nullable=False, index=True
    )

    product_id: int = Field(foreign_key="products.id", nullable=False, index=True)

    variant_id: int | None = Field(
        default=None, foreign_key="product_variants.id", nullable=True, index=True
    )

    variant_price_adjustment: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), nullable=False),
    )

    variant_name_snapshot: str | None = Field(default=None, nullable=True)

    description: str = Field(nullable=False)

    product_name_snapshot: str = Field(nullable=False)

    quantity: int = Field(default=1, nullable=False)

    unit_price: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    tax_rate: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(5, 2), nullable=False),
    )

    tax_calculation_type: TaxCalculationType = Field(
        default=TaxCalculationType.EXCLUSIVE, nullable=False
    )

    tax_amount: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), nullable=False),
    )

    discount_amount: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(12, 2), nullable=False),
    )

    line_total: Decimal = Field(sa_column=Column(Numeric(12, 2), nullable=False))

    quotation: "Quotation" = Relationship(back_populates="product_lines")


class SubscriptionLineTax(SQLModel, table=True):
    __tablename__ = "subscription_line_taxes"

    subscription_line_id: int = Field(
        foreign_key="subscription_lines.id", primary_key=True, nullable=False
    )

    tax_id: int | None = Field(default=None, foreign_key="taxes.id", nullable=True)

    tax_rate: Decimal = Field(sa_column=Column(Numeric(5, 2), nullable=False))

    calculation_type: TaxCalculationType = Field(nullable=False)


class SubscriptionLineVariant(SQLModel, table=True):
    __tablename__ = "subscription_line_variants"

    subscription_line_id: int = Field(
        foreign_key="subscription_lines.id", primary_key=True, nullable=False
    )

    variant_id: int = Field(foreign_key="product_variants.id", nullable=False)

    variant_name_snapshot: str = Field(nullable=False)

    price_adjustment_snapshot: Decimal = Field(
        sa_column=Column(Numeric(12, 2), nullable=False)
    )


class SubscriptionDiscount(SQLModel, table=True):
    __tablename__ = "subscription_discounts"

    subscription_id: int = Field(
        foreign_key="subscriptions.id", primary_key=True, nullable=False
    )

    discount_id: int = Field(foreign_key="discounts.id", nullable=False, index=True)


class SubscriptionRenewal(SQLModel, table=True):
    __tablename__ = "subscription_renewals"

    source_subscription_id: int = Field(
        foreign_key="subscriptions.id", primary_key=True, nullable=False
    )

    renewed_subscription_id: int = Field(
        foreign_key="subscriptions.id", unique=True, nullable=False
    )


class InvoicePeriod(SQLModel, table=True):
    __tablename__ = "invoice_periods"

    subscription_id: int = Field(
        foreign_key="subscriptions.id", primary_key=True, nullable=False
    )

    billing_period_start: date = Field(primary_key=True, nullable=False)

    billing_period_end: date = Field(nullable=False)

    invoice_id: int = Field(foreign_key="invoices.id", unique=True, nullable=False)


class InvoiceLineSnapshot(SQLModel, table=True):
    __tablename__ = "invoice_line_snapshots"

    invoice_line_id: int = Field(
        foreign_key="invoice_lines.id", primary_key=True, nullable=False
    )

    variant_id: int | None = Field(
        default=None, foreign_key="product_variants.id", nullable=True
    )

    variant_name_snapshot: str | None = Field(default=None, nullable=True)

    tax_id: int | None = Field(default=None, foreign_key="taxes.id", nullable=True)

    tax_rate: Decimal = Field(
        default=Decimal("0.00"),
        sa_column=Column(Numeric(5, 2), nullable=False),
    )

    tax_calculation_type: TaxCalculationType = Field(
        default=TaxCalculationType.EXCLUSIVE, nullable=False
    )

