# Brightloop Software - Subscription Management Platform (Backend)

Enterprise-grade, modular monolithic subscription billing and revenue management backend built with Node.js, Express.js (ES Modules), PostgreSQL, Prisma ORM, Redis, BullMQ, and Docker.

---

## 1. Architectural Highlights

- **Modular Monolith**: Clean layer separation: `routes` $\to$ `middleware` $\to$ `controllers` $\to$ `services` $\to$ `database`.
- **Strict Decimal Precision**: Complete prevention of floating-point arithmetic using `decimal.js` and PostgreSQL `NUMERIC` types.
- **Fail-Fast Configuration**: Strict runtime environment variable validation using Zod.
- **High Concurrency & Idempotency**: PostgreSQL row-level locks and unique constraints to prevent duplicate billing.
- **Centralized Error Handling**: Unified operational error lifecycle supporting Zod, Prisma, and custom `AppError` without leaking stack traces in production.
- **Structured Logging**: High-performance JSON logging via `pino` with human-readable formatting in development via `pino-pretty`.

---

## 2. Directory Layout

```
backend/
├── src/
│   ├── config/             # Runtime environment, Prisma, and Redis singletons
│   │   ├── environment.js  # Zod schema validation for environment variables
│   │   ├── database.js     # Prisma client singleton and connection health checks
│   │   └── redis.js        # ioredis client singleton and connection health checks
│   │
│   ├── modules/            # Business domain modules
│   │   └── health/         # System health & liveness probes (/api/v1/health)
│   │
│   ├── middleware/         # Centralized middlewares
│   │   ├── errorHandler.js # Unified error handling (Zod, Prisma, AppError)
│   │   ├── notFoundHandler.js # 404 route handling
│   │   └── rateLimiter.js  # Global & sensitive route rate limiters
│   │
│   ├── jobs/               # Background task queues (BullMQ + Redis)
│   │   └── queues.js       # Shared queue registry (billing, email, pdf)
│   │
│   ├── utils/              # Reusable core utilities
│   │   ├── apiResponse.js  # Standardized JSON response envelopes
│   │   ├── appError.js     # Typed operational error classes
│   │   └── logger.js       # Pino structured logger
│   │
│   ├── app.js              # Centralized Express application factory
│   └── server.js           # Server entrypoint with graceful shutdown hooks
│
├── prisma/
│   └── schema.prisma       # PostgreSQL relational schema and Prisma client config
├── tests/
│   ├── unit/               # Domain logic & utility unit tests
│   └── integration/        # Supertest API & middleware integration tests
├── .env.example            # Environment configuration template
├── Dockerfile              # Multi-stage production container build
├── docker-compose.yml      # Orchestration for Backend, PostgreSQL, and Redis
└── package.json            # ES Modules configuration and npm scripts
```

---

## 3. Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | HTTP port for the Express application | `5000` |
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | `development` |
| `APP_BASE_URL` | Base URL of backend application | `http://localhost:5000` |
| `FRONTEND_URL` | Origin allowed by CORS policy | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string with schema parameter | `postgresql://...` |
| `REDIS_URL` | Redis connection URI for caching and BullMQ | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | Secret key for signing access tokens (min 32 chars) | Required |
| `JWT_ACCESS_EXPIRES_IN`| Expiry duration for access tokens | `1h` |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens (min 32 chars) | Required |
| `JWT_REFRESH_EXPIRES_IN`| Expiry duration for refresh tokens | `7d` |
| `PASSWORD_RESET_URL` | Frontend URL for password reset links | `http://localhost:3000/reset-password` |
| `PASSWORD_RESET_TOKEN_EXPIRES_MINUTES` | Token lifetime for password reset | `30` |
| `SMTP_HOST` | Host for outgoing transactional emails | `smtp.mailtrap.io` |
| `SMTP_PORT` | Port for SMTP server | `2525` |
| `SMTP_USER` | SMTP username | Optional |
| `SMTP_PASSWORD` | SMTP password | Optional |
| `EMAIL_FROM` | Sender display name and email address | `Brightloop Software <billing@...>` |
| `RATE_LIMIT_WINDOW_MS` | Rate limiting sliding window in ms | `900000` (15 mins) |
| `RATE_LIMIT_MAX` | Max allowed requests per window per IP | `100` |

---

## 4. Local Installation & Development

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Initialize Database Client
```bash
npm run prisma:generate
```

### Step 3: Run Database Migrations
```bash
npm run prisma:migrate
```

### Step 4: Run Development Server
```bash
npm run dev
```

Server will start on `http://localhost:5000`.

---

## 5. Docker Deployment

To spin up the entire stack (Backend + PostgreSQL 16 + Redis 7):

```bash
docker compose up -d --build
```

To inspect logs:
```bash
docker compose logs -f backend
```

To stop all containers:
```bash
docker compose down
```

---
 
 ## 6. API Documentation
 
 ### System & Health
 | Method | Endpoint | Access | Description |
 | :--- | :--- | :--- | :--- |
 | `GET` | `/` | Public | Service descriptor |
 | `GET` | `/api/v1/health` | Public | System liveness, PostgreSQL & Redis health check |
 
 ### Authentication (`/api/v1/auth`)
 | Method | Endpoint | Access | Description |
 | :--- | :--- | :--- | :--- |
 | `POST` | `/api/v1/auth/register` | Public | Register customer account (auto assigns `CUSTOMER` role) |
 | `POST` | `/api/v1/auth/login` | Public | Authenticate user, returns access & refresh tokens |
 | `POST` | `/api/v1/auth/refresh-token` | Public | Rotate refresh token and obtain new access token |
 | `POST` | `/api/v1/auth/forgot-password` | Public | Request single-use password reset link |
 | `POST` | `/api/v1/auth/reset-password` | Public | Complete password reset with token & new password |
 | `GET` | `/api/v1/auth/me` | Authenticated | Retrieve current user profile |
 | `POST` | `/api/v1/auth/logout` | Authenticated | Revoke session and refresh token |
 
 ### User & Staff Management (`/api/v1/users`)
 | Method | Endpoint | Access | Description |
 | :--- | :--- | :--- | :--- |
 | `POST` | `/api/v1/users/staff` | `ADMIN` only | Create staff account with audit trail |
 | `GET` | `/api/v1/users` | `ADMIN`, `STAFF` | List system users with pagination and filters |
 | `GET` | `/api/v1/users/:id` | `ADMIN`, `STAFF`, Owner | View single user details |
 | `PATCH` | `/api/v1/users/:id` | `ADMIN`, `STAFF`, Owner | Update user profile details |
 | `PATCH` | `/api/v1/users/:id/status` | `ADMIN` only | Activate or deactivate user account |
 | `GET` | `/api/v1/users/customers` | `ADMIN`, `STAFF` | List customer profiles with company/tax info |
 | `GET` | `/api/v1/users/customers/:id` | `ADMIN`, `STAFF`, Owner | View specific customer profile (IDOR protected) |
 | `PUT` | `/api/v1/users/customers/:id` | `ADMIN`, `STAFF`, Owner | Update customer business/address profile |

 ### Products & Product Variants (`/api/v1/products`, `/api/v1/variants`)
 | Method | Endpoint | Access | Description |
 | :--- | :--- | :--- | :--- |
 | `POST` | `/api/v1/products` | `ADMIN` only | Create catalog product with prices and tax links |
 | `GET` | `/api/v1/products` | Public / All | List products (Customers see active; Admin sees all) |
 | `GET` | `/api/v1/products/:id` | Public / All | View product details with variants and taxes |
 | `PATCH` | `/api/v1/products/:id` | `ADMIN` only | Update product details |
 | `DELETE` | `/api/v1/products/:id` | `ADMIN` only | Soft-deactivate/archive product |
 | `POST` | `/api/v1/products/:productId/variants` | `ADMIN` only | Create product variant with price adjustment |
 | `GET` | `/api/v1/products/:productId/variants` | Public / All | List variants belonging to product |
 | `PATCH` | `/api/v1/variants/:id` | `ADMIN` only | Update variant details or price adjustment |
 | `DELETE` | `/api/v1/variants/:id` | `ADMIN` only | Soft-deactivate/archive variant |

 ### Subscription Plans (`/api/v1/plans`)
 | Method | Endpoint | Access | Description |
 | :--- | :--- | :--- | :--- |
 | `POST` | `/api/v1/plans` | `ADMIN` only | Create plan (DAILY, WEEKLY, MONTHLY, YEARLY) |
 | `GET` | `/api/v1/plans` | Public / All | List plans (filtered by active & availability date) |
 | `GET` | `/api/v1/plans/:id` | Public / All | View single plan configuration |
 | `PATCH` | `/api/v1/plans/:id` | `ADMIN` only | Update plan settings |
 | `DELETE` | `/api/v1/plans/:id` | `ADMIN` only | Soft-deactivate/archive plan |

 ### Tax Configuration (`/api/v1/taxes`)
 | Method | Endpoint | Access | Description |
 | :--- | :--- | :--- | :--- |
 | `POST` | `/api/v1/taxes` | `ADMIN` only | Create tax rule (EXCLUSIVE or INCLUSIVE, rate %) |
 | `GET` | `/api/v1/taxes` | `ADMIN`, `STAFF` | List tax rules with applicability filters |
 | `GET` | `/api/v1/taxes/:id` | `ADMIN`, `STAFF` | View single tax rule |
 | `PATCH` | `/api/v1/taxes/:id` | `ADMIN` only | Update tax rule rate or calculation method |
 | `DELETE` | `/api/v1/taxes/:id` | `ADMIN` only | Soft-deactivate/archive tax rule |
 
 ---
 
 ## 7. Database Seeding
 
 Seed initial development accounts (`ADMIN`, `STAFF`, `CUSTOMER`):
 ```bash
 npm run prisma:seed
 ```
 Default dev accounts created:
 - **Admin**: `admin@brightloopsoftware.com` (`BrightAdmin@2026!`)
 - **Staff**: `operations@brightloopsoftware.com` (`BrightStaff@2026!`)
 - **Customer**: `customer@acmecorp.com` (`BrightCustomer@2026!`)
 
 ---
 
 ## 8. Verification & Health Probes

Verify system status and service dependencies at:
```http
GET /api/v1/health
```

Sample response:
```json
{
  "success": true,
  "message": "System is currently healthy",
  "data": {
    "status": "healthy",
    "environment": "development",
    "timestamp": "2026-10-31T04:05:00.000Z",
    "uptimeSeconds": 42,
    "services": {
      "database": {
        "status": "connected",
        "latencyMs": 4
      },
      "redis": {
        "status": "connected",
        "latencyMs": 1
      }
    },
    "system": {
      "nodeVersion": "v20.18.0",
      "memoryUsageMb": 58
    }
  }
}
```

---

## 7. Running Tests

```bash
# Run test suite once
npm test

# Run tests in watch mode
npm run test:watch
```
