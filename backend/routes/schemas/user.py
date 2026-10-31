from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PASSWORD_MIN_LENGTH = 9
PASSWORD_MAX_LENGTH = 128


def _validate_password_strength(password: str) -> str:
    if not any(character.isupper() for character in password):
        raise ValueError("password must contain an uppercase letter")
    if not any(character.islower() for character in password):
        raise ValueError("password must contain a lowercase letter")
    if not any(
        not character.isalnum() and not character.isspace()
        for character in password
    ):
        raise ValueError("password must contain a special character")
    return password


# Registration
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)
    full_name: str = Field(min_length=1, max_length=255)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, password: str) -> str:
        return _validate_password_strength(password)


class UserCreateResponse(BaseModel):
    id: int
    # Plain string: response payloads must not re-validate stored addresses,
    # or reserved/special-use domains (e.g. `@odooflux.local`) fail on read.
    email: str
    full_name: str

    model_config = ConfigDict(from_attributes=True)


# Staff (admin-managed)
class StaffCreate(UserCreate):
    pass


# Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# Refresh
class TokenRefresh(BaseModel):
    refresh_token: str


# Password reset
class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordReset(BaseModel):
    token: str = Field(min_length=1)
    new_password: str = Field(
        min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH
    )

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, password: str) -> str:
        return _validate_password_strength(password)


class StaffUpdate(BaseModel):
    is_active: bool


class StaffResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# JWT
class JWTTokenPayload(BaseModel):
    sub: str
    role: str
    exp: int
    type: str
