from pydantic import BaseModel, EmailStr, ConfigDict

# Registration
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserCreateResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str

    model_config = ConfigDict(from_attributes=True)

# Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# JWT
class JWTTokenPayload(BaseModel):
    sub: str
    role: str
    exp: int