from fastapi import FastAPI
from config import settings
from routes import auth

app = FastAPI()

app.include_router(auth.router, prefix="/auth", tags=["auth"])

@app.get("/health")
def checkHealth():
    return {"success": "ok"}