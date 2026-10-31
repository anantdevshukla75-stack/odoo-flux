# API Specifications

## Base URL

```text
/api/v1
```

All endpoints below are relative to this base path.

> **Implementation status:** Authentication, Products, and Plans are implemented. Remaining modules will follow the same `/api/v1` prefix.

## Conventions

- Requests and responses are JSON unless stated otherwise.
- Authenticated endpoints require `Authorization: Bearer <access_token>`.
- Errors return `{"detail": "..."}`. Validation errors use FastAPI's standard `422` structure.
- Timestamps are ISO 8601 UTC.

## Authentication

| Method | Endpoint | Auth | Success | Purpose |
| --- | --- | --- | --- | --- |
| `POST` | `/auth/register` | — | `201` | Customer registration |
| `POST` | `/auth/login` | — | `200` | Login, issues token pair |
| `POST` | `/auth/refresh` | — | `200` | Rotate access + refresh tokens |
| `POST` | `/auth/logout` | Bearer | `204` | Logout (client discards tokens) |
| `GET` | `/auth/me` | Bearer | `200` | Current authenticated user |
| `POST` | `/auth/staff` | Admin | `201` | Admin creates a staff account |
| `POST` | `/auth/forgot-password` | — | `202` | Request a password reset token |
| `POST` | `/auth/reset-password` | — | `204` | Reset password with a token |

### Register

`POST /auth/register` · no auth · `201`

`UserCreate`

```json
{
  "email": "customer@example.com",
  "password": "Secret123!",
  "full_name": "User Name"
}
```

| Field | Type | Rules |
| --- | --- | --- |
| `email` | string | Valid email, unique |
| `password` | string | 8–128 characters |
| `full_name` | string | 1–255 characters |

`UserCreateResponse`

```json
{
  "id": 1,
  "email": "customer@example.com",
  "full_name": "User Name"
}
```

| Status | Meaning |
| --- | --- |
| `201` | Account created |
| `409` | Email already registered |
| `422` | Validation failed |

### Login

`POST /auth/login` · no auth · `200`

Uses OAuth2 password flow. The body is form-encoded (`application/x-www-form-urlencoded`), and the **`username` field carries the email** so the Swagger "Authorize" button works.

| Field | Type | Description |
| --- | --- | --- |
| `username` | string | Customer/staff/admin email |
| `password` | string | Plain password |

```text
username=customer@example.com&password=Secret123!
```

`UserLoginResponse`

```json
{
  "access_token": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "token_type": "bearer"
}
```

| Status | Meaning |
| --- | --- |
| `200` | Tokens issued |
| `401` | Incorrect email or password |
| `403` | Account is inactive |
| `422` | Missing form fields |

### Refresh

`POST /auth/refresh` · no auth · `200`

`TokenRefresh`

```json
{
  "refresh_token": "jwt_refresh_token"
}
```

Returns a **new token pair** (refresh rotation). The previous refresh token is not revoked server-side yet.

`UserLoginResponse` — same shape as login.

| Status | Meaning |
| --- | --- |
| `200` | Tokens rotated |
| `401` | Invalid, expired, or non-refresh token |
| `403` | Account is inactive |

### Current user

`GET /auth/me` · Bearer · `200`

`UserCreateResponse`

```json
{
  "id": 1,
  "email": "customer@example.com",
  "full_name": "User Name"
}
```

| Status | Meaning |
| --- | --- |
| `200` | Current user |
| `401` | Missing or invalid access token |
| `403` | Account is inactive |

### Logout

`POST /auth/logout` · Bearer · `204`

Returns an empty body. Tokens are stateless JWTs, so the client is responsible for discarding them. The endpoint does not validate the token server-side.

### Create staff

`POST /auth/staff` · Bearer, role `admin` · `201`

`StaffCreate` — same fields and rules as `UserCreate`.

```json
{
  "email": "staff@example.com",
  "password": "Secret123!",
  "full_name": "Staff Member"
}
```

Response is `UserCreateResponse`.

| Status | Meaning |
| --- | --- |
| `201` | Staff account created |
| `401` | Missing or invalid access token |
| `403` | Caller is not an admin |
| `409` | Email already registered |
| `422` | Validation failed |

### Forgot password

`POST /auth/forgot-password` · no auth · `202`

`PasswordResetRequest`

```json
{
  "email": "customer@example.com"
}
```

Always returns `202` to avoid account enumeration. For existing active accounts a single-use token is stored (30-minute expiry, SHA-256 hashed, previous unused tokens invalidated).

> Token delivery is not implemented yet, so the raw token is currently neither emailed nor returned.

### Reset password

`POST /auth/reset-password` · no auth · `204`

`PasswordReset`

```json
{
  "token": "reset_token",
  "new_password": "NewSecret123!"
}
```

| Field | Type | Rules |
| --- | --- | --- |
| `token` | string | Raw token from the reset request |
| `new_password` | string | 8–128 characters |

| Status | Meaning |
| --- | --- |
| `204` | Password updated |
| `400` | Invalid, expired, or already-used token |
| `422` | Validation failed |

## Products

| Method | Endpoint | Auth | Success | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/products` | Bearer | `200` | List products |
| `POST` | `/products` | Admin | `201` | Create a product |
| `GET` | `/products/{id}` | Bearer | `200` | Get a product |
| `PATCH` | `/products/{id}` | Admin | `200` | Update a product |

Reads are available to every authenticated role (customers need the catalog); writes are admin-only. Staff receive `403`.

### List products

`GET /products` · Bearer · `200`

Returns products ordered by `name`.

| Query | Type | Default | Description |
| --- | --- | --- | --- |
| `is_active` | boolean | — | Filter by active state |
| `offset` | integer | `0` | Rows to skip |
| `limit` | integer | `100` | Page size, 1–500 |

`ProductResponse[]`

```json
[
  {
    "id": 1,
    "name": "Cloud Hosting",
    "product_type": "service",
    "sales_price": "49.00",
    "cost_price": "12.00",
    "notes": "Managed hosting with daily backups.",
    "is_active": true,
    "created_at": "2026-10-31T06:58:34.728300Z"
  }
]
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Primary key |
| `name` | string | 1–255 characters |
| `product_type` | enum | `service` / `goods` / `subscription` |
| `sales_price` | decimal string | ≥ 0 |
| `cost_price` | decimal string | ≥ 0 |
| `notes` | string \| null | Optional |
| `is_active` | boolean | Default `true` |
| `created_at` | datetime | ISO 8601 UTC |

### Create product

`POST /products` · Bearer, role `admin` · `201`

`ProductCreate`

```json
{
  "name": "Cloud Hosting",
  "product_type": "service",
  "sales_price": "49.00",
  "cost_price": "12.00",
  "notes": "Managed hosting with daily backups.",
  "is_active": true
}
```

`product_type`, `is_active`, and `notes` are optional. `name`, `sales_price`, and `cost_price` are required. Response is `ProductResponse`.

| Status | Meaning |
| --- | --- |
| `201` | Product created |
| `401` | Missing or invalid access token |
| `403` | Caller is not an admin |
| `422` | Validation failed |

### Update product

`PATCH /products/{id}` · Bearer, role `admin` · `200`

Accepts any subset of the create fields. Omitted fields are left unchanged. `notes` can be cleared with `null`; `null` is rejected for the other fields.

| Status | Meaning |
| --- | --- |
| `200` | Product updated |
| `401` | Missing or invalid access token |
| `403` | Caller is not an admin |
| `404` | Product not found |
| `422` | Validation failed |

## Plans

| Method | Endpoint | Auth | Success | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/plans` | Bearer | `200` | List plans |
| `POST` | `/plans` | Admin | `201` | Create a plan with lines |
| `GET` | `/plans/{id}` | Bearer | `200` | Get a plan |
| `PATCH` | `/plans/{id}` | Admin | `200` | Update a plan |

Reads are available to every authenticated role; writes are admin-only.

### Plan object

`PlanResponse`

```json
{
  "id": 1,
  "name": "Starter Monthly",
  "description": "Hosting and priority support, billed monthly.",
  "billing_interval": "monthly",
  "billing_interval_count": 1,
  "minimum_quantity": 1,
  "start_date": "2026-01-01",
  "end_date": null,
  "auto_close": false,
  "allow_early_close": false,
  "allow_pause": false,
  "allow_renewal": false,
  "is_active": true,
  "lines": [
    { "id": 1, "product_id": 1, "quantity": 1, "unit_price": "49.00" },
    { "id": 2, "product_id": 2, "quantity": 1, "unit_price": "99.00" }
  ]
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | 1–255 characters |
| `description` | string \| null | Optional |
| `billing_interval` | enum | `daily` / `weekly` / `monthly` / `yearly` |
| `billing_interval_count` | integer | ≥ 1, default `1` |
| `minimum_quantity` | integer | ≥ 1, default `1` |
| `start_date` | date | `YYYY-MM-DD` |
| `end_date` | date \| null | Must be on or after `start_date` |
| `auto_close` | boolean | Default `false` |
| `allow_early_close` | boolean | Default `false` |
| `allow_pause` | boolean | Default `false` |
| `allow_renewal` | boolean | Default `false` |
| `is_active` | boolean | Default `true` |
| `lines` | array | Plan lines, see below |

`PlanLine`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Read-only, assigned on create |
| `product_id` | integer | Must reference an existing product |
| `quantity` | integer | ≥ 1, default `1` |
| `unit_price` | decimal string | ≥ 0 |

### List plans

`GET /plans` · Bearer · `200`

Same query parameters as products (`is_active`, `offset`, `limit`). Returns `PlanResponse[]` ordered by `name`, with lines included.

### Create plan

`POST /plans` · Bearer, role `admin` · `201`

`PlanCreate`

```json
{
  "name": "Starter Monthly",
  "description": "Hosting and priority support, billed monthly.",
  "billing_interval": "monthly",
  "billing_interval_count": 1,
  "minimum_quantity": 1,
  "start_date": "2026-01-01",
  "end_date": null,
  "allow_pause": true,
  "lines": [
    { "product_id": 1, "quantity": 1, "unit_price": "49.00" },
    { "product_id": 2, "quantity": 1, "unit_price": "99.00" }
  ]
}
```

Only `name`, `billing_interval`, and `start_date` are required; `lines` defaults to an empty list. Response is `PlanResponse`.

| Status | Meaning |
| --- | --- |
| `201` | Plan created |
| `400` | A referenced product does not exist |
| `401` | Missing or invalid access token |
| `403` | Caller is not an admin |
| `422` | Validation failed (including `end_date < start_date`) |

### Update plan

`PATCH /plans/{id}` · Bearer, role `admin` · `200`

Accepts any subset of the create fields. Omitted fields are left unchanged.

- Sending `lines` **replaces the entire set** of plan lines; send `[]` to remove them all.
- Omitting `lines` leaves the existing lines untouched.
- `description` and `end_date` can be cleared with `null`; `null` is rejected for the other fields.
- `start_date`/`end_date` are validated together against the merged result.

| Status | Meaning |
| --- | --- |
| `200` | Plan updated |
| `400` | A referenced product does not exist |
| `401` | Missing or invalid access token |
| `403` | Caller is not an admin |
| `404` | Plan not found |
| `422` | Validation failed (including `end_date < start_date`) |

## JWT

Access token payload:

```json
{
  "sub": "1",
  "role": "customer",
  "exp": 1793450000,
  "type": "access"
}
```

Refresh token payload:

```json
{
  "sub": "1",
  "role": "customer",
  "exp": 1796112000,
  "type": "refresh"
}
```

| Claim | Description |
| --- | --- |
| `sub` | User id, as a string |
| `role` | `admin` / `staff` / `customer` |
| `exp` | Expiry, Unix seconds |
| `type` | `access` / `refresh` |

- Tokens are signed with `HS256` (`JWT_ALGORITHM`).
- Access tokens expire after `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` (default 30).
- Refresh tokens expire after `JWT_REFRESH_TOKEN_EXPIRE_DAYS` (default 7).
- Protected routes reject `refresh` tokens; `/auth/refresh` rejects `access` tokens.

## Planned Modules

The remaining modules from [PRD §9](PRD.md#9-api-endpoints) are not implemented yet:

- Customers
- Product variants
- Quotation templates
- Subscriptions
- Invoices and billing
- Payments
- Taxes and discounts
- Dashboard summary
