# Build stage
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Runtime stage
FROM python:3.14-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Copy backend
COPY backend/ ./backend/
# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

WORKDIR /app/backend
RUN uv sync --frozen

# Run migrations then start server
EXPOSE 8000
CMD ["sh", "-c", "uv run alembic upgrade head && uv run fastapi run main.py --host 0.0.0.0 --port ${PORT:-8000}"]