from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from database import model


class SubscriptionLineResponse(BaseModel):
    id: int
    product_id: int
    variant_id: int | None = None
    variant_name: str | None = None
    quantity: int
    unit_price: Decimal
    tax_rate: Decimal
    tax_calculation_type: model.TaxCalculationType = (
        model.TaxCalculationType.EXCLUSIVE
    )

    model_config = ConfigDict(from_attributes=True)


class SubscriptionCreate(BaseModel):
    customer_id: int
    plan_id: int
    start_date: date
    payment_terms_days: int = Field(default=0, ge=0)


class SubscriptionUpdate(BaseModel):
    expiry_date: date | None = None
    next_billing_date: date | None = None
    payment_terms_days: int | None = Field(default=None, ge=0)


class SubscriptionResponse(BaseModel):
    id: int
    subscription_number: str
    customer_id: int
    plan_id: int
    start_date: date
    expiry_date: date | None
    next_billing_date: date | None
    payment_terms_days: int
    status: model.SubscriptionStatus
    created_at: datetime
    lines: list[SubscriptionLineResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
