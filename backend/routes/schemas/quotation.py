from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from database import model


class QuotationLineCreate(BaseModel):
    product_id: int = Field(gt=0)
    variant_id: int | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, max_length=500)
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(ge=0)


class QuotationCreate(BaseModel):
    customer_id: int = Field(gt=0)
    plan_id: int = Field(gt=0)
    status: model.QuotationStatus = model.QuotationStatus.DRAFT
    valid_until: date
    payment_terms: str | None = Field(default=None, max_length=100)
    notes: str | None = None
    tax_id: int | None = Field(default=None, gt=0)
    discount_code: str | None = Field(default=None, max_length=64)
    product_lines: list[QuotationLineCreate] = Field(default_factory=list)

    @field_validator("discount_code")
    @classmethod
    def normalize_discount_code(cls, value: str | None) -> str | None:
        return value.strip().upper() if value else value

    @model_validator(mode="after")
    def validate_quote(self):
        if self.status not in (model.QuotationStatus.DRAFT, model.QuotationStatus.SENT):
            raise ValueError("new quotations must start as draft or sent")
        if self.valid_until < date.today():
            raise ValueError("valid_until cannot be in the past")
        return self


class QuotationStatusUpdate(BaseModel):
    status: model.QuotationStatus


class QuotationLineResponse(BaseModel):
    id: int
    product_id: int
    variant_id: int | None
    product_name: str
    description: str
    variant_price_adjustment: Decimal
    quantity: int
    unit_price: Decimal
    tax_rate: Decimal
    tax_calculation_type: model.TaxCalculationType
    tax_amount: Decimal
    discount_amount: Decimal
    line_total: Decimal


class QuotationResponse(BaseModel):
    id: int
    quotation_number: str
    customer_id: int
    customer_name: str
    customer_email: str
    customer_phone: str | None
    plan_id: int
    plan_name: str
    plan_interval: model.BillingInterval
    status: model.QuotationStatus
    subtotal: Decimal
    tax_amount: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    tax_id: int | None
    discount_code: str | None
    valid_until: date
    payment_terms: str | None
    notes: str | None
    created_at: datetime
    subscription_id: int | None
    product_lines: list[QuotationLineResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
