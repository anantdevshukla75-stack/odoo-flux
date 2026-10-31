from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from database import model


class DiscountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    code: str = Field(min_length=1, max_length=64)
    description: str | None = None
    discount_type: model.DiscountType
    value: Decimal = Field(ge=0)
    min_purchase: Decimal | None = Field(default=None, ge=0)
    min_quantity: int = Field(default=1, ge=1)
    start_date: date
    end_date: date | None = None
    usage_limit: int | None = Field(default=None, ge=1)
    applicability: model.DiscountAppliesTo = model.DiscountAppliesTo.ALL
    applicable_products: list[int] = Field(default_factory=list)
    applicable_subscriptions: list[int] = Field(default_factory=list)
    is_active: bool = True

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        value = value.strip().upper()
        if not value:
            raise ValueError("code cannot be blank")
        if not all(character.isalnum() or character in "-_" for character in value):
            raise ValueError("code may only contain letters, numbers, hyphens, and underscores")
        return value

    @model_validator(mode="after")
    def validate_discount(self):
        if self.discount_type == model.DiscountType.PERCENTAGE and self.value > 100:
            raise ValueError("percentage discounts cannot exceed 100")
        if self.end_date is not None and self.end_date < self.start_date:
            raise ValueError("end_date must be on or after start_date")
        if len(self.applicable_products) != len(set(self.applicable_products)):
            raise ValueError("applicable_products must not contain duplicates")
        if len(self.applicable_subscriptions) != len(set(self.applicable_subscriptions)):
            raise ValueError("applicable_subscriptions must not contain duplicates")
        if any(value < 1 for value in self.applicable_products):
            raise ValueError("applicable product IDs must be positive")
        if any(value < 1 for value in self.applicable_subscriptions):
            raise ValueError("applicable subscription IDs must be positive")
        if (
            self.applicability == model.DiscountAppliesTo.ALL
            and (self.applicable_products or self.applicable_subscriptions)
        ):
            raise ValueError("all discounts cannot specify eligible IDs")
        if (
            self.applicability == model.DiscountAppliesTo.PRODUCT_SPECIFIC
            and (not self.applicable_products or self.applicable_subscriptions)
        ):
            raise ValueError("product-specific discounts require applicable_products only")
        if (
            self.applicability == model.DiscountAppliesTo.SUBSCRIPTION_WIDE
            and self.applicable_products
        ):
            raise ValueError("subscription-wide discounts cannot specify products")
        return self


class DiscountUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    code: str | None = Field(default=None, min_length=1, max_length=64)
    description: str | None = None
    discount_type: model.DiscountType | None = None
    value: Decimal | None = Field(default=None, ge=0)
    min_purchase: Decimal | None = Field(default=None, ge=0)
    min_quantity: int | None = Field(default=None, ge=1)
    start_date: date | None = None
    end_date: date | None = None
    usage_limit: int | None = Field(default=None, ge=1)
    applicability: model.DiscountAppliesTo | None = None
    applicable_products: list[int] | None = None
    applicable_subscriptions: list[int] | None = None
    is_active: bool | None = None

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return DiscountCreate.normalize_code(value)

    @model_validator(mode="after")
    def reject_nulls_for_required_fields(self):
        nullable = {"description", "min_purchase", "end_date", "usage_limit"}
        for field in self.model_fields_set - nullable:
            if getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class DiscountResponse(BaseModel):
    id: int
    name: str
    code: str
    description: str | None
    discount_type: model.DiscountType
    value: Decimal
    min_purchase: Decimal | None
    min_quantity: int
    start_date: date
    end_date: date | None
    usage_limit: int | None
    redemptions_count: int
    applicability: model.DiscountAppliesTo
    applicable_products: list[int] = Field(default_factory=list)
    applicable_subscriptions: list[int] = Field(default_factory=list)
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class DiscountEligibilityRequest(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    purchase_amount: Decimal = Field(ge=0)
    quantity: int = Field(default=1, ge=1)
    product_id: int | None = Field(default=None, gt=0)
    plan_id: int | None = Field(default=None, gt=0)

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()


class DiscountEligibilityResponse(BaseModel):
    eligible: bool
    message: str
    savings: Decimal = Decimal("0.00")
    final_total: Decimal
