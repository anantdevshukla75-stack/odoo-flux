from contextlib import asynccontextmanager
from pathlib import Path

from config import API_V1_PREFIX, settings
from database import db
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from routes import (
    auth,
    billing,
    customers,
    dashboard,
    discounts,
    invoices,
    payments,
    plans,
    products,
    quotations,
    quotation_templates,
    subscriptions,
    taxes,
)

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


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
    quotation_templates.router,
    prefix=f"{API_V1_PREFIX}/quotation-templates",
    tags=["quotation templates"],
)
app.include_router(
    quotations.router, prefix=f"{API_V1_PREFIX}/quotations", tags=["quotations"]
)
app.include_router(
    taxes.router, prefix=f"{API_V1_PREFIX}/taxes", tags=["taxes"]
)
app.include_router(
    discounts.router, prefix=f"{API_V1_PREFIX}/discounts", tags=["discounts"]
)
app.include_router(
    plans.router, prefix=f"{API_V1_PREFIX}/plans", tags=["plans"]
)
app.include_router(
    customers.router, prefix=f"{API_V1_PREFIX}/customers", tags=["customers"]
)
app.include_router(
    subscriptions.router,
    prefix=f"{API_V1_PREFIX}/subscriptions",
    tags=["subscriptions"],
)
app.include_router(
    invoices.router, prefix=f"{API_V1_PREFIX}/invoices", tags=["invoices"]
)
app.include_router(
    billing.router, prefix=f"{API_V1_PREFIX}/billing", tags=["billing"]
)
app.include_router(
    payments.router, prefix=f"{API_V1_PREFIX}/payments", tags=["payments"]
)
app.include_router(
    dashboard.router, prefix=f"{API_V1_PREFIX}/dashboard", tags=["dashboard"]
)


@app.get("/health")
def health():
    return {"success": "ok"}


if FRONTEND_DIST.is_dir():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="frontend-assets",
    )

    from fastapi import HTTPException

    @app.get("/{full_path:path}", include_in_schema=False)
    async def spa_fallback(request: Request, full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        candidate = FRONTEND_DIST / full_path
        if candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
