# API Specifications

## Base URL

```text
/api/v1
```

All endpoints below are relative to this base path.

> **Implementation status:** the backend currently mounts the auth router at `/auth` (no version prefix). The `/api/v1` prefix is the target defined in [PRD §9](PRD.md#9-api-endpoints). Only the auth module is implemented today.

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
- Products, variants, and plans
- Quotation templates
- Subscriptions
- Invoices and billing
- Payments
- Taxes and discounts
- Dashboard summary
