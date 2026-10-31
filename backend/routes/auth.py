from fastapi import APIRouter

router = APIRouter(prefix="/auth")

@router.post("/register")
def register():
    return {"route": "register"}

@router.post("/login")
def login():
    return {"route": "login"}

@router.post("/refresh")
def refresh():
    return {"route": "refresh"}

@router.post("/logout")
def logout():
    return {"route": "logout"}

@router.post("/forgot-password")
def forgot_password():
    return {"route": "forgot-password"}

@router.post("/reset-password")
def reset_password():
    return {"route": "reset-password"}

@router.post("/staff")
def staff():
    return {"route": "staff"}