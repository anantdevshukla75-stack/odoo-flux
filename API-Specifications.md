# API Specifications

## Base URL

```text
/api/v1
```

All endpoints below are relative to this base path.

> **Implementation status:** Authentication, Products, Plans, Customers, and Subscriptions are implemented. Remaining modules will follow the same `/api/v1` prefix.

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

## Customers

| Method | Endpoint | Auth | Success | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/customers` | Staff/Admin | `200` | List customer profiles |
| `GET` | `/customers/me` | Bearer | `200` | Current user's customer profile |
| `GET` | `/customers/{id}` | Owner or Staff/Admin | `200` | Get a customer profile |
| `PATCH` | `/customers/{id}` | Owner or Staff/Admin | `200` | Update a customer profile |

There is no `POST /customers`: a profile row is created automatically when a user registers.

### Customer object

`CustomerResponse`

```json
{
  "id": 2,
  "user_id": 18,
  "email": "customer@example.com",
  "full_name": "Customer User",
  "company_name": "Acme",
  "phone": "+1 555 0100",
  "billing_address": "1 Main Street",
  "tax_number": "TAX-123",
  "created_at": "2026-10-31T06:37:02.061698Z"
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Primary key |
| `user_id` | integer | Owning user |
| `email` | string | Read-only, from the user account |
| `full_name` | string | Read-only, from the user account |
| `company_name` | string \| null | Optional |
| `phone` | string \| null | Optional |
| `billing_address` | string \| null | Optional |
| `tax_number` | string \| null | Optional |
| `created_at` | datetime | ISO 8601 UTC |

### List customers

`GET /customers` · Bearer, role `staff` or `admin` · `200`

| Query | Type | Default | Description |
| --- | --- | --- | --- |
| `offset` | integer | `0` | Rows to skip |
| `limit` | integer | `100` | Page size, 1–500 |

Returns `CustomerResponse[]` ordered by `id`. Customers receive `403`.

### My profile

`GET /customers/me` · Bearer · `200`

Returns the `CustomerResponse` linked to the authenticated user. Admin and staff accounts have no customer profile and receive `404`.

### Get / update customer

`GET /customers/{id}` · Bearer · `200`  
`PATCH /customers/{id}` · Bearer · `200`

Customers can only read and update their own profile; staff and admin can access any. `PATCH` accepts any subset of `company_name`, `phone`, `billing_address`, `tax_number`; all of them can be cleared with `null`.

| Status | Meaning |
| --- | --- |
| `200` | Profile returned or updated |
| `401` | Missing or invalid access token |
| `403` | Caller is not the owner and not staff/admin |
| `404` | Customer not found |
| `422` | Validation failed |

## Subscriptions

| Method | Endpoint | Auth | Success | Purpose |
| --- | --- | --- | --- | --- |
| `GET` | `/subscriptions` | Bearer | `200` | List subscriptions |
| `POST` | `/subscriptions` | Staff/Admin | `201` | Create a subscription |
| `GET` | `/subscriptions/{id}` | Owner or Staff/Admin | `200` | Get a subscription |
| `PATCH` | `/subscriptions/{id}` | Staff/Admin | `200` | Update billing fields |
| `POST` | `/subscriptions/{id}/confirm` | Staff/Admin | `200` | `draft`/`quotation` → `confirmed` |
| `POST` | `/subscriptions/{id}/activate` | Staff/Admin | `200` | `confirmed`/`paused` → `active` |
| `POST` | `/subscriptions/{id}/pause` | Staff/Admin | `200` | `active` → `paused` |
| `POST` | `/subscriptions/{id}/close` | Staff/Admin | `200` | `confirmed`/`active`/`paused` → `closed` |

Customers only ever see their own subscriptions, even if they pass another `customer_id`. Staff and admin see everything.

### Subscription object

`SubscriptionResponse`

```json
{
  "id": 2,
  "subscription_number": "SUB-000002",
  "customer_id": 2,
  "plan_id": 1,
  "start_date": "2026-01-31",
  "expiry_date": null,
  "next_billing_date": "2026-02-28",
  "payment_terms_days": 0,
  "status": "draft",
  "created_at": "2026-10-31T07:07:01.659484Z",
  "lines": [
    { "id": 3, "product_id": 1, "quantity": 1, "unit_price": "49.00", "tax_rate": "0.00" },
    { "id": 4, "product_id": 2, "quantity": 1, "unit_price": "99.00", "tax_rate": "0.00" }
  ]
}
```

| Field | Type | Notes |
| --- | --- | --- |
| `subscription_number` | string | Generated as `SUB-{id:06d}` |
| `customer_id` | integer | Customer profile |
| `plan_id` | integer | Source plan |
| `start_date` | date | Billing start |
| `expiry_date` | date \| null | Copied from `plan.end_date` on create |
| `next_billing_date` | date \| null | `start_date` + one billing interval; cleared on close |
| `payment_terms_days` | integer | ≥ 0, default `0` |
| `status` | enum | `draft` / `quotation` / `confirmed` / `active` / `paused` / `closed` |
| `lines` | array | Price snapshot, see below |

`SubscriptionLine`

| Field | Type | Notes |
| --- | --- | --- |
| `id` | integer | Read-only |
| `product_id` | integer | Product from the plan line |
| `quantity` | integer | Copied from the plan line |
| `unit_price` | decimal string | Copied from the plan line |
| `tax_rate` | decimal string | Default `0.00`, kept for later tax support |

### List subscriptions

`GET /subscriptions` · Bearer · `200`

| Query | Type | Default | Description |
| --- | --- | --- | --- |
| `customer_id` | integer | — | Filter by customer (ignored for customers, who are always scoped to themselves) |
| `status` | enum | — | Filter by subscription status |
| `offset` | integer | `0` | Rows to skip |
| `limit` | integer | `100` | Page size, 1–500 |

Returns `SubscriptionResponse[]`, newest first, with lines included.

### Create subscription

`POST /subscriptions` · Bearer, role `staff` or `admin` · `201`

`SubscriptionCreate`

```json
{
  "customer_id": 2,
  "plan_id": 1,
  "start_date": "2026-01-31",
  "payment_terms_days": 0
}
```

The plan's lines are copied into the subscription as a price snapshot, so later product or plan price changes do not affect existing subscriptions.

- `subscription_number` is assigned after insert as `SUB-{id:06d}`.
- `expiry_date` is copied from `plan.end_date`.
- `next_billing_date` is `start_date` plus the plan's interval, with month-end clamping (Jan 31 + 1 month = Feb 28).
- `status` starts as `draft`.
- The plan must be active and must not end before `start_date`.
- Every plan line must satisfy the plan's `minimum_quantity`.

| Status | Meaning |
| --- | --- |
| `201` | Subscription created |
| `400` | Plan inactive, plan ended, plan has no lines, or quantity below minimum |
| `401` | Missing or invalid access token |
| `403` | Caller is not staff/admin |
| `404` | Customer or plan not found |
| `422` | Validation failed |

### Update subscription

`PATCH /subscriptions/{id}` · Bearer, role `staff` or `admin` · `200`

Accepts any subset of:

| Field | Type | Notes |
| --- | --- | --- |
| `expiry_date` | date \| null | Must be on or after `start_date`; `null` clears it |
| `next_billing_date` | date \| null | `null` clears it |
| `payment_terms_days` | integer | ≥ 0 |

Status is not editable here; use the lifecycle endpoints.

| Status | Meaning |
| --- | --- |
| `200` | Updated |
| `401` | Missing or invalid access token |
| `403` | Caller is not staff/admin |
| `404` | Subscription not found |
| `422` | Validation failed, including `expiry_date < start_date` |

### Lifecycle

Allowed status changes:

| Action | From | To | Extra rule |
| --- | --- | --- | --- |
| `confirm` | `draft`, `quotation` | `confirmed` | — |
| `activate` | `confirmed`, `paused` | `active` | Also resumes a paused subscription |
| `pause` | `active` | `paused` | Plan must have `allow_pause = true` |
| `close` | `confirmed`, `active`, `paused` | `closed` | Clears `next_billing_date` |

| Status | Meaning |
| --- | --- |
| `200` | Status updated, returns the subscription |
| `400` | Plan disallows the change (for example pausing without `allow_pause`) |
| `401` | Missing or invalid access token |
| `403` | Caller is not staff/admin |
| `404` | Subscription not found |
| `409` | Transition not allowed from the current status |

> `auto_close`, `allow_early_close`, and `allow_renewal` are stored on plans but not enforced yet.

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

- Product variants
- Quotation templates
- Invoices and billing
- Payments
- Taxes and discounts
- Dashboard summary
