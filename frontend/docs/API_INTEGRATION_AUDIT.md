# Brightloop Software / Odoo Flux — Backend API Verification & Integration Audit

> **Audit Type:** Phase 0 Read-Only Architecture & Contract Inspection  
> **Backend Framework:** Python 3.14+, FastAPI, SQLModel (SQLAlchemy), Pydantic v2  
> **API Prefix:** `/api/v1`  
> **Database:** SQLite / PostgreSQL via SQLAlchemy URL  
> **Target Frontend Document:** `frontend/docs/API_INTEGRATION_AUDIT.md`  

---

## 1. Executive Summary & Stack Overview

An exhaustive, read-only audit of the backend repository located in `backend/` was executed against [`API-Specifications.md`](file:///e:/odoo%20flux/API-Specifications.md) and [`PRD.md`](file:///e:/odoo%20flux/PRD.md).

### Confirmed Application Architecture
- **Framework & Entry Point:** FastAPI application configured in [`backend/main.py`](file:///e:/odoo%20flux/backend/main.py#L28-L70).
- **Base Route Prefix:** Exactly `/api/v1` confirmed via [`backend/config.py`](file:///e:/odoo%20flux/backend/config.py#L3) (`API_V1_PREFIX = "/api/v1"`).
- **CORS Configuration:** Fully configured with `allow_credentials=True`, `allow_methods=["*"]`, `allow_headers=["*"]`, and dynamic origins sourced from `FRONTEND_ORIGINS` (defaults to `http://localhost:5173,http://127.0.0.1:5173`).
- **Data Persistence:** SQLModel with typed relationships and SQLite development database, seeded via [`backend/seed.py`](file:///e:/odoo%20flux/backend/seed.py).
- **Backend File Integrity:** Zero files in `backend/` were modified during this inspection.

---

## 2. Complete Endpoint Verification Table

Every endpoint documented in [`API-Specifications.md`](file:///e:/odoo%20flux/API-Specifications.md) was inspected directly against its FastAPI controller in `backend/routes/`, its Pydantic schemas in `backend/routes/schemas/`, and its database layer in `backend/database/`.

| HTTP Method | API Route | Documentation Status | Backend Source Controller | Enforced Role / Security | Request Payload | Response Schema & Status | Verification Result |
|---|---|---|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Defined | `routes/auth.py:register` | Public (No Auth) | `user.UserCreate` (JSON) | `user.UserCreateResponse` (`201`) | **MATCH** |
| `POST` | `/api/v1/auth/login` | Defined | `routes/auth.py:login` | Public (No Auth) | `OAuth2PasswordRequestForm` (Form URL-encoded) | `user.UserLoginResponse` (`200`) | **MATCH** |
| `POST` | `/api/v1/auth/refresh` | Defined | `routes/auth.py:refresh` | Public (No Auth) | `user.TokenRefresh` (JSON) | `user.UserLoginResponse` (`200`) | **MATCH** |
| `POST` | `/api/v1/auth/logout` | Defined | `routes/auth.py:logout` | Public (Doc says Bearer) | None | Empty Body (`204`) | **MISMATCH (Security)**: Backend does not enforce auth dependency on logout |
| `GET` | `/api/v1/auth/me` | Defined | `routes/auth.py:me` | Bearer (Active User) | None | `user.UserCreateResponse` (`200`) | **MATCH**: Note: `role` is in JWT, not in body |
| `POST` | `/api/v1/auth/staff` | Defined | `routes/auth.py:staff` | Admin Only | `user.StaffCreate` (JSON) | `user.UserCreateResponse` (`201`) | **MATCH** |
| `POST` | `/api/v1/auth/forgot-password` | Defined | `routes/auth.py:forgot_password` | Public (No Auth) | `user.PasswordResetRequest` (JSON) | Empty Body (`202`) | **MATCH**: Email delivery is stubbed |
| `POST` | `/api/v1/auth/reset-password` | Defined | `routes/auth.py:reset_password` | Public (No Auth) | `user.PasswordReset` (JSON) | Empty Body (`204`) | **MATCH** |
| `GET` | `/api/v1/products` | Defined | `routes/products.py:list_products` | Bearer (Active User) | Query: `is_active`, `offset`, `limit` | `list[ProductResponse]` (`200`) | **MATCH** |
| `POST` | `/api/v1/products` | Defined | `routes/products.py:create_product` | Admin Only | `product.ProductCreate` (JSON) | `product.ProductResponse` (`201`) | **MATCH** |
| `GET` | `/api/v1/products/{product_id}` | Defined | `routes/products.py:get_product` | Bearer (Active User) | Path: `product_id` (int) | `product.ProductResponse` (`200`) | **MATCH** |
| `PATCH` | `/api/v1/products/{product_id}` | Defined | `routes/products.py:update_product` | Admin Only | `product.ProductUpdate` (JSON) | `product.ProductResponse` (`200`) | **MATCH** |
| `GET` | `/api/v1/plans` | Defined | `routes/plans.py:list_plans` | Bearer (Active User) | Query: `is_active`, `offset`, `limit` | `list[PlanResponse]` (`200`) | **MATCH** |
| `POST` | `/api/v1/plans` | Defined | `routes/plans.py:create_plan` | Admin Only | `plan.PlanCreate` with `lines` | `plan.PlanResponse` (`201`) | **MATCH** |
| `GET` | `/api/v1/plans/{plan_id}` | Defined | `routes/plans.py:get_plan` | Bearer (Active User) | Path: `plan_id` (int) | `plan.PlanResponse` (`200`) | **MATCH** |
| `PATCH` | `/api/v1/plans/{plan_id}` | Defined | `routes/plans.py:update_plan` | Admin Only | `plan.PlanUpdate` (JSON) | `plan.PlanResponse` (`200`) | **MATCH** |
| `GET` | `/api/v1/customers` | Defined | `routes/customers.py:list_customers` | Staff or Admin | Query: `offset`, `limit` | `list[CustomerResponse]` (`200`) | **MATCH** |
| `GET` | `/api/v1/customers/me` | Defined | `routes/customers.py:get_my_customer` | Bearer (Active User) | None | `customer.CustomerResponse` (`200`) | **MATCH** |
| `GET` | `/api/v1/customers/{customer_id}` | Defined | `routes/customers.py:get_customer` | Bearer (Owner, Staff, Admin) | Path: `customer_id` (int) | `customer.CustomerResponse` (`200`) | **MATCH** |
| `PATCH` | `/api/v1/customers/{customer_id}` | Defined | `routes/customers.py:update_customer` | Bearer (Owner, Staff, Admin) | `customer.CustomerUpdate` (JSON) | `customer.CustomerResponse` (`200`) | **MATCH** |
| `GET` | `/api/v1/subscriptions` | Defined | `routes/subscriptions.py:list_subscriptions` | Bearer (Active User) | Query: `customer_id`, `status`, `offset`, `limit` | `list[SubscriptionResponse]` (`200`) | **MATCH**: Scopes customer automatically |
| `POST` | `/api/v1/subscriptions` | Defined | `routes/subscriptions.py:create_subscription` | Staff or Admin | `subscription.SubscriptionCreate` (JSON) | `subscription.SubscriptionResponse` (`201`) | **MATCH** |
| `GET` | `/api/v1/subscriptions/{subscription_id}` | Defined | `routes/subscriptions.py:get_subscription` | Bearer (Owner, Staff, Admin) | Path: `subscription_id` (int) | `subscription.SubscriptionResponse` (`200`) | **MATCH** |
| `PATCH` | `/api/v1/subscriptions/{subscription_id}` | Defined | `routes/subscriptions.py:update_subscription` | Staff or Admin | `subscription.SubscriptionUpdate` (JSON) | `subscription.SubscriptionResponse` (`200`) | **MATCH** |
| `POST` | `/api/v1/subscriptions/{subscription_id}/confirm` | Defined | `routes/subscriptions.py:confirm_subscription` | Staff or Admin | Path: `subscription_id` (int) | `subscription.SubscriptionResponse` (`200`) | **MATCH** |
| `POST` | `/api/v1/subscriptions/{subscription_id}/activate` | Defined | `routes/subscriptions.py:activate_subscription` | Staff or Admin | Path: `subscription_id` (int) | `subscription.SubscriptionResponse` (`200`) | **MATCH** |
| `POST` | `/api/v1/subscriptions/{subscription_id}/pause` | Defined | `routes/subscriptions.py:pause_subscription` | Staff or Admin | Path: `subscription_id` (int) | `subscription.SubscriptionResponse` (`200`) | **MATCH** |
| `POST` | `/api/v1/subscriptions/{subscription_id}/close` | Defined | `routes/subscriptions.py:close_subscription` | Staff or Admin | Path: `subscription_id` (int) | `subscription.SubscriptionResponse` (`200`) | **MATCH** |
| `GET` | `/api/v1/invoices` | Defined | `routes/invoices.py:list_invoices` | Bearer (Active User) | Query: `customer_id`, `subscription_id`, `status`, `offset`, `limit` | `list[InvoiceResponse]` (`200`) | **MATCH**: Scopes customer automatically |
| `GET` | `/api/v1/invoices/{invoice_id}` | Defined | `routes/invoices.py:get_invoice` | Bearer (Owner, Staff, Admin) | Path: `invoice_id` (int) | `invoice.InvoiceResponse` (`200`) | **MATCH** |
| `POST` | `/api/v1/billing/generate` | Defined | `routes/billing.py:generate_invoices` | Staff or Admin | `invoice.BillingGenerate` (`subscription_id`, `as_of`) | `list[InvoiceResponse]` (`200`) | **MATCH** |
| `GET` | `/api/v1/payments` | Defined | `routes/payments.py:list_payments` | Bearer (Active User) | Query: `invoice_id`, `payment_method`, `offset`, `limit` | `list[PaymentResponse]` (`200`) | **MATCH**: Scopes customer automatically |
| `POST` | `/api/v1/payments` | Defined | `routes/payments.py:create_payment` | Staff or Admin | `payment.PaymentCreate` (JSON) | `payment.PaymentResponse` (`201`) | **MATCH** |
| `GET` | `/api/v1/dashboard/summary` | Defined | `routes/dashboard.py:get_summary` | Staff or Admin | Query: `as_of` (date) | `dashboard.DashboardSummaryResponse` (`200`) | **MATCH** |

---

## 3. In-Depth Authentication Audit

### 3.1 Login Content Type & Parameter Shape
- **Content-Type:** `application/x-www-form-urlencoded` (strictly required by FastAPI's `OAuth2PasswordRequestForm`). Sending JSON to `POST /api/v1/auth/login` fails with HTTP `422 Unprocessable Entity`.
- **Username Field:** Uses `username`, which **must contain the user's email address**.
- **Password Field:** `password`.
- **Axios / Fetch Serialization Requirement:**
  ```javascript
  const params = new URLSearchParams();
  params.append('username', email);
  params.append('password', password);
  const response = await api.post('/auth/login', params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  ```

### 3.2 Token Lifecycle & JWT Claims
- **Tokens Returned:**
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer"
  }
  ```
- **JWT Claims Payload:**
  - `sub`: User ID encoded as a string (e.g. `"1"`).
  - `role`: One of `"admin"`, `"staff"`, `"customer"`.
  - `exp`: Standard Unix timestamp expiry.
  - `type`: `"access"` for access tokens, `"refresh"` for refresh tokens.
- **Expiration Configuration:**
  - Access Token: 30 minutes (`JWT_ACCESS_TOKEN_EXPIRE_MINUTES`).
  - Refresh Token: 7 days (`JWT_REFRESH_TOKEN_EXPIRE_DAYS`).
- **Token Rotation:** `POST /api/v1/auth/refresh` expects `{"refresh_token": "..."}` and rejects tokens of `type != "refresh"`.

### 3.3 Critical Current-User Response Discrepancy
- The endpoint `GET /api/v1/auth/me` returns `user.UserCreateResponse`:
  ```json
  {
    "id": 1,
    "email": "customer@example.com",
    "full_name": "Customer User"
  }
  ```
- **Vital Finding:** The user's `role` is **not present** in the `/auth/me` response JSON body.
- **Frontend Implication:** The frontend authentication context must decode the `role` directly from the decoded JWT `access_token` payload (`jwtDecode(token).role`).

### 3.4 Password Validation Rules
- Enforced by Pydantic: `min_length=8`, `max_length=128`.
- Hashing: Argon2 via `pwdlib` (`argon2-cffi`).

### 3.5 Password Reset Implementation
- `POST /auth/forgot-password`: Generates an alphanumeric secure token and hashes it via SHA-256 into table `password_reset_tokens`. Token valid for 30 minutes.
- **Email Delivery Limitation:** The backend currently stubs email delivery; raw reset tokens are not transmitted externally.

---

## 4. Database & Entity Model Audit

The database schema is defined in [`backend/database/model.py`](file:///e:/odoo%20flux/backend/database/model.py) using SQLModel.

### 4.1 Products (`products`)
- Fields: `id` (int), `name` (str), `product_type` (`service` | `goods` | `subscription`), `sales_price` (Decimal 12,2), `cost_price` (Decimal 12,2), `notes` (str, nullable), `is_active` (bool), `created_at` (datetime).
- **Audit Note:** No database columns or foreign keys exist for product variants or parent-child variant grouping.

### 4.2 Plans & Plan Lines (`plans`, `plan_lines`)
- `Plan` Fields: `id`, `name`, `description`, `billing_interval` (`daily` | `weekly` | `monthly` | `yearly`), `billing_interval_count` (int), `minimum_quantity` (int), `start_date` (date), `end_date` (date, nullable), `auto_close` (bool), `allow_early_close` (bool), `allow_pause` (bool), `allow_renewal` (bool), `is_active` (bool).
- `PlanLine` Fields: `id`, `plan_id`, `product_id`, `quantity`, `unit_price`.

### 4.3 Customers (`customers`)
- Linked to `users.id` via 1:1 foreign key.
- Fields: `id`, `user_id`, `company_name`, `phone`, `billing_address`, `tax_number`, `created_at`.

### 4.4 Subscriptions & Subscription Lines (`subscriptions`, `subscription_lines`)
- `Subscription` Fields: `id`, `subscription_number` (`SUB-000001`), `customer_id`, `plan_id`, `start_date`, `expiry_date`, `next_billing_date`, `payment_terms_days`, `status` (`draft` | `quotation` | `confirmed` | `active` | `paused` | `closed`), `created_at`.
- `SubscriptionLine` Fields: `id`, `subscription_id`, `product_id`, `quantity`, `unit_price`, `tax_rate` (default `0.00`).
- **Lifecycle Transition Rules:**
  - `draft` $\to$ `confirmed`
  - `quotation` $\to$ `confirmed`
  - `confirmed` $\to$ `active` or `closed`
  - `active` $\to$ `paused` or `closed`
  - `paused` $\to$ `active` or `closed`
  - `closed` $\to$ terminal state (no transitions allowed)

### 4.5 Invoices & Invoice Lines (`invoices`, `invoice_lines`)
- `Invoice` Fields: `id`, `invoice_number` (`INV-000001`), `customer_id`, `subscription_id`, `issue_date`, `due_date`, `billing_period_start`, `billing_period_end`, `subtotal`, `discount_amount` (default `0.00`), `tax_amount` (default `0.00`), `total_amount`, `status` (`draft` | `confirmed` | `partially_paid` | `paid` | `cancelled`), `created_at`.
- `InvoiceLine` Fields: `id`, `invoice_id`, `product_id`, `description`, `quantity`, `unit_price`, `discount_amount`, `tax_amount`, `line_total`.

### 4.6 Payments (`payments`)
- Fields: `id`, `invoice_id`, `payment_method` (`cash` | `bank_transfer` | `card` | `upi` | `other`), `amount`, `payment_date`, `reference`, `note`, `created_at`.
- Validation: Strictly rejects payments where `amount > (invoice.total_amount - paid_amount)`.
- Auto-status: Updates invoice status to `partially_paid` or `paid`.

---

## 5. API Limitations & Unsupported Endpoints

The following operations were systematically audited against the backend source and confirmed to be **unimplemented / unsupported** at the HTTP routing layer:

| Domain / Operation | Documented Endpoint | Exists in Backend Source? | Backend Implementation Reality | Frontend Strategy |
|---|---|---|---|---|
| **Product Variants** | None | **NO** | No variant table or price adjustment column in `model.py` | Display base products; handle demo Odoo price adjustments client-side |
| **Quotation Templates** | None | **NO** | No `quotation_templates` table or router | Preserve client-side template definitions |
| **Taxes Configuration** | None | **NO** | Fixed `tax_rate` on subscription line, default `0.00` | Support client-side preview; calculate tax lines |
| **Discounts & Coupons** | None | **NO** | `discount_amount` column exists on invoice, but no coupon/discount engine | Maintain demo coupon engine in frontend client layer |
| **Staff Listing** | `GET /auth/staff` | **NO** | Only `POST /auth/staff` exists | Show created staff in local state or inspect users table if needed |
| **Quotation Creation** | `POST /quotations` | **NO** | Subscriptions with status `draft`/`quotation` represent proposals | Use `POST /subscriptions` with initial status |
| **Quotation Sending** | `POST /quotations/{id}/send` | **NO** | No quotation send or email endpoints | Simulate sending state in UI |
| **Subscription Renewal** | `POST /subscriptions/{id}/renew` | **NO** | No renew endpoint; manual billing advances cycle | Trigger billing via `POST /billing/generate` |
| **Invoice PDF Download** | `GET /invoices/{id}/pdf` | **NO** | No PDF rendering pipeline on backend | Use client-side print layout (`@media print` in `InvoicePrint.jsx`) |
| **Invoice Email Delivery** | `POST /invoices/{id}/send` | **NO** | No outbound mailer attached | Simulate email notification confirmation in UI |
| **Invoice Cancellation** | `POST /invoices/{id}/cancel` | **NO** | Enum has `cancelled`, but no endpoint to transition | Restrict cancellation to simulation/demo mode |
| **Payment Voiding / Refund**| `DELETE /payments/{id}` | **NO** | Payments are immutable append-only records | Display settled state without rollback |
| **Customer Payment Action**| `POST /payments` | **RESTRICTED** | Endpoint enforces `require_staff` (Admin or Staff only) | Customers cannot directly invoke `/payments`; customer payment flow requires staff role or simulation wrapper |

---

## 6. Recommended Frontend Integration Architecture

### 6.1 Authentication Adapter
1. **Login:** Send `URLSearchParams` with `username` and `password`.
2. **Token Storage:** Store `access_token` and `refresh_token` in `localStorage`.
3. **Role Extraction:** Decode the JWT access token using a lightweight base64/JSON parser to read `role`.
4. **Current Profile:** Call `GET /api/v1/auth/me` to fetch `id`, `email`, `full_name`. If `role === 'customer'`, additionally call `GET /api/v1/customers/me` to obtain the customer record ID and billing address.

### 6.2 Dual-Mode API Client (`apiClient.js`)
- Provide a configuration flag (e.g. `VITE_USE_LIVE_API=true/false`).
- For supported endpoints (`/auth/*`, `/products/*`, `/plans/*`, `/customers/*`, `/subscriptions/*`, `/invoices/*`, `/billing/*`, `/payments/*`, `/dashboard/*`), dispatch directly to `http://127.0.0.1:8000/api/v1`.
- For unsupported modules (Coupons/Discounts, Product Variants, Quotation Templates, PDF generation), gracefully provide frontend demonstration mocks so the user interface remains rich, responsive, and completely functional.

---

## 7. Audit Sign-Off & Verification Status

- [x] Backend source code inspected in complete read-only mode.
- [x] Every documented API route verified against controllers and router mounts.
- [x] Request and response payloads mapped to Pydantic models.
- [x] Role-based authorization rules mapped (`require_admin`, `require_staff`, `get_current_active_user`).
- [x] Base prefix confirmed: `/api/v1`.
- [x] Limitations, missing routes, and discrepancies documented.
- [x] Zero backend files modified.
- [x] Audit report created strictly at `frontend/docs/API_INTEGRATION_AUDIT.md`.

