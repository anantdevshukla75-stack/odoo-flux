from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from database import model


class PaymentCreate(BaseModel):
    invoice_id: int
    payment_method: model.PaymentMethod
    amount: Decimal = Field(gt=0, decimal_places=2)
    payment_date: datetime | None = None
    reference: str | None = Field(default=None, max_length=255)
    note: str | None = None


class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    payment_method: model.PaymentMethod
    amount: Decimal
    payment_date: datetime
    reference: str | None
    note: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
