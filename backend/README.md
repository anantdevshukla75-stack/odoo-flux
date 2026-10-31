# Odoo Flux Backend

FastAPI + SQLModel backend for the Odoo Flux subscription and billing MVP.

## Requirements

- Python 3.14 or newer
- [uv](https://docs.astral.sh/uv/)

## Setup

```bash
cd backend
uv sync
```

Copy the example environment file and fill in the values:

```bash
# Windows
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | SQLAlchemy URL, e.g. `sqlite:///database.db` |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_ALGORITHM` | Signing algorithm, e.g. `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime in minutes |
| `JWT_REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime in days |
| `FRONTEND_ORIGINS` | Comma-separated CORS origins |

## Run

```bash
uv run fastapi dev main.py
```

The API listens on <http://127.0.0.1:8000>:

| URL | Description |
| --- | --- |
| `/api/v1/auth/*` | Authentication endpoints |
| `/api/v1/products/*` | Product catalog |
| `/api/v1/plans/*` | Subscription plans and plan lines |
| `/docs` | Swagger UI |
| `/redoc` | ReDoc |
| `/health` | Health check |

All application routes are prefixed with `/api/v1`. See [API-Specifications.md](../API-Specifications.md) for request/response contracts and [PRD.md](../PRD.md) for the data model.

## Seed demo data

```bash
uv run python seed.py
```

Creates (idempotently) an admin, a staff member, a customer, three demo products, and the "Starter Monthly" plan. The demo password is printed by the script. This is for local development only.

## Reset the database

SQLite is used for development, so the schema is created on startup and there are no migrations yet. To start over:

```bash
# stop the server first
del database.db
uv run python seed.py
```

## Project structure

```text
backend/
├── main.py             # FastAPI app, CORS, router registration, lifespan
├── config.py           # Settings (pydantic-settings) and API prefix
├── seed.py             # Development seed script (accounts + catalog)
├── database/
│   ├── db.py           # Engine, create_tables(), get_session()
│   ├── model.py        # SQLModel tables
│   ├── auth.py         # Auth persistence (queries, commits)
│   ├── products.py     # Product persistence
│   └── plans.py        # Plan + plan line persistence
├── routes/
│   ├── auth.py         # Auth HTTP endpoints
│   ├── products.py     # Product HTTP endpoints
│   ├── plans.py        # Plan HTTP endpoints
│   └── schemas/
│       ├── user.py     # Auth request/response models
│       ├── product.py  # Product request/response models
│       └── plan.py     # Plan request/response models
└── helpers/
    └── auth/
        ├── jwt.py      # Access/refresh token creation and decoding
        ├── password.py # Argon2 hashing and OAuth2 scheme
        └── user.py     # get_current_user / require_admin dependencies
```

## Conventions

- Controllers (`routes/`) handle HTTP concerns only; database work lives in `database/`.
- Monetary values use `Decimal`.
- Passwords are hashed with Argon2 via `pwdlib`.
