from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from database import model


class InvoiceLineResponse(BaseModel):
    id: int
    product_id: int
    description: str
    quantity: int
    unit_price: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    line_total: Decimal

    model_config = ConfigDict(from_attributes=True)


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    customer_id: int
    subscription_id: int
    issue_date: date
    due_date: date
    billing_period_start: date
    billing_period_end: date
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    status: model.InvoiceStatus
    created_at: datetime
    lines: list[InvoiceLineResponse]

    model_config = ConfigDict(from_attributes=True)


class BillingGenerate(BaseModel):
    subscription_id: int | None = None
    as_of: date | None = None
