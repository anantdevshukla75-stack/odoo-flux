from contextlib import asynccontextmanager

from config import API_V1_PREFIX, settings
from database import db
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, plans, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Before start-up
    db.create_tables()
    # Yield control back to FastAPI
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin.strip()
        for origin in settings.FRONTEND_ORIGINS.split(",")
        if origin.strip()
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    auth.router, prefix=f"{API_V1_PREFIX}/auth", tags=["auth"]
)
app.include_router(
    products.router, prefix=f"{API_V1_PREFIX}/products", tags=["products"]
)
app.include_router(
    plans.router, prefix=f"{API_V1_PREFIX}/plans", tags=["plans"]
)


@app.get("/health")
def health():
    return {"success": "ok"}
