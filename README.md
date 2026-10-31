# Odoo Flux

Subscription and billing management platform: React/Vite frontend + FastAPI/SQLModel backend.

## Structure

- `frontend/` - React + Vite web app (role-based dashboards for admin, staff, customer)
- `backend/` - FastAPI + SQLModel API (Python 3.14+, uv)

## Quick start

### Backend

```bash
cd backend
uv sync
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, etc.
uv run alembic upgrade head
uv run python seed.py  # optional demo data
uv run fastapi dev main.py
```

API: http://127.0.0.1:8000 - docs at `/docs`. Tests: `uv run python -m unittest discover -s tests -v`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173.

## Documentation

- `PRD.md` - product requirements and data model
- `API-Specifications.md` - API contracts
- `backend/README.md` - backend setup, routes, migrations, billing job
- `frontend/docs/API_INTEGRATION_AUDIT.md` - frontend/backend integration status

## License

See repository for license details.
