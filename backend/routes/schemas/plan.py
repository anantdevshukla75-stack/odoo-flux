from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from database import model


class PlanLineCreate(BaseModel):
    product_id: int
    quantity: int = Field(default=1, ge=1)
    unit_price: Decimal = Field(ge=0)


class PlanLineResponse(PlanLineCreate):
    id: int

    model_config = ConfigDict(from_attributes=True)


class PlanBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    billing_interval: model.BillingInterval
    billing_interval_count: int = Field(default=1, ge=1)
    minimum_quantity: int = Field(default=1, ge=1)
    start_date: date
    end_date: date | None = None
    auto_close: bool = False
    allow_early_close: bool = False
    allow_pause: bool = False
    allow_renewal: bool = False
    is_active: bool = True

    @model_validator(mode="after")
    def check_dates(self):
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        return self


class PlanCreate(PlanBase):
    lines: list[PlanLineCreate] = Field(default_factory=list)


class PlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    billing_interval: model.BillingInterval | None = None
    billing_interval_count: int | None = Field(default=None, ge=1)
    minimum_quantity: int | None = Field(default=None, ge=1)
    start_date: date | None = None
    end_date: date | None = None
    auto_close: bool | None = None
    allow_early_close: bool | None = None
    allow_pause: bool | None = None
    allow_renewal: bool | None = None
    is_active: bool | None = None
    lines: list[PlanLineCreate] | None = None

    @model_validator(mode="after")
    def check_required_fields(self):
        # `description` and `end_date` are the only columns that can be cleared
        for field in (
            "name",
            "billing_interval",
            "billing_interval_count",
            "minimum_quantity",
            "start_date",
            "auto_close",
            "allow_early_close",
            "allow_pause",
            "allow_renewal",
            "is_active",
        ):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class PlanResponse(PlanBase):
    id: int
    lines: list[PlanLineResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)
