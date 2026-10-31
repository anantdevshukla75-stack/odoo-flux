from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash

# Password hashing
password_hash = PasswordHash.recommended()

# OAuth2 bearer authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def hash_password(password: str):
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str):
    return password_hash.verify(password, hashed_password)
