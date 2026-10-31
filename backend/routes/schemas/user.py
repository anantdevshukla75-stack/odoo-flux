from pydantic import BaseModel, ConfigDict, EmailStr, Field

PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


# Registration
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)
    full_name: str = Field(min_length=1, max_length=255)


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


# JWT
class JWTTokenPayload(BaseModel):
    sub: str
    role: str
    exp: int
    type: str
