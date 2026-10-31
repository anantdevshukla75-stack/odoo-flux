# Remaining Frontend API Contract

This contract documents endpoints the frontend integration now expects but that
are not present in the current FastAPI router/model set. All paths are relative
to `/api/v1`. JSON fields are snake_case; decimal values may be serialized as
JSON numbers or decimal strings. IDs are integers. Dates use `YYYY-MM-DD`.

The frontend branch is frontend-only. Backend implementation and validation of
these contracts remains a backend task.

## Taxes

Admin-only CRUD:

- `GET /taxes` → `Tax[]`
- `POST /taxes` → `Tax` (201)
- `GET /taxes/{id}` → `Tax`
- `PATCH /taxes/{id}` → `Tax`

`Tax`: `id`, `name`, `rate`, `calculation_type` (`exclusive | inclusive`),
`is_default`, `is_active`, `created_at`. Setting an active default should clear
the previous default in the same transaction. A tax change must not rewrite
existing invoice snapshots.

## Discounts

Admin-only CRUD and eligibility preview:

- `GET /discounts` → `Discount[]`
- `POST /discounts` → `Discount` (201)
- `GET /discounts/{id}` → `Discount`
- `PATCH /discounts/{id}` → `Discount`
- `DELETE /discounts/{id}` → 204
- `POST /discounts/eligibility` → eligibility result; preview only, no redemption

Eligibility request: `code`, `purchase_amount`, `quantity`, optional
`product_id`, optional `plan_id`. Response: `eligible`, `message`, `savings`,
`final_total`.

`Discount`: `id`, `name`, `code`, `description`, `discount_type`
(`percentage | fixed`), `value`, `min_purchase`, `min_quantity`, `start_date`,
`end_date`, nullable `usage_limit` (null means unlimited), `redemptions_count`,
`applicability` (`all | product_specific | subscription_wide`),
`applicable_products: int[]`, `applicable_subscriptions: int[]`, `is_active`.
The server must enforce eligibility and quota at redemption time; a preview
must not reserve or consume a redemption.

## Quotation templates

Admin-only CRUD:

- `GET /quotation-templates` → `QuotationTemplate[]`
- `POST /quotation-templates` → `QuotationTemplate` (201)
- `GET /quotation-templates/{id}` → `QuotationTemplate`
- `PATCH /quotation-templates/{id}` → `QuotationTemplate`
- `DELETE /quotation-templates/{id}` → 204

`QuotationTemplate`: `id`, `name`, `description`, `default_plan_id`,
`validity_days`, `product_lines: [{product_id, quantity, unit_price}]`,
`created_at`. Product names and the default plan name may be embedded for
display but IDs are authoritative.

## Quotations

- `GET /quotations?customer_id=&status=` → `Quotation[]`; customer-role requests
  are always scoped to the authenticated customer's records.
- `POST /quotations` → `Quotation` (201)
- `GET /quotations/{id}` → `Quotation`
- `PATCH /quotations/{id}` → `Quotation` (currently status transitions only)

Create request fields: `customer_id`, `plan_id`, `status` (`draft | sent`),
`valid_until`, `payment_terms`, `notes`, optional `tax_id`, optional
`discount_code`, and `product_lines: [{product_id, description, quantity,
unit_price}]`. The backend owns tax/discount eligibility and all totals; the
response returns frozen quote snapshots: `quotation_number`, customer and plan
display fields, `status` (`draft | sent | accepted | rejected | expired`),
`subtotal`, `tax_amount`, `discount_amount`, `total_amount`, `tax_id`,
`discount_code`, `valid_until`, `created_at`, `subscription_id` (nullable), and
`product_lines` with line-level tax/discount/total values.

Allowed transitions: `draft -> sent`, `sent -> accepted | rejected`. Accepting
may create/link a draft subscription, but must not activate it or create an
invoice implicitly. Billing remains an explicit `/billing/generate` operation.

## Staff directory

- `GET /auth/staff` → `Staff[]` (admin only)
- Existing `POST /auth/staff` → `Staff` (admin only)
- `GET /auth/staff/{id}` → `Staff` (admin only)
- `PATCH /auth/staff/{id}` → `Staff`; currently used for `is_active` changes

`Staff`: `id`, `email`, `full_name`, `role`, `is_active`, `created_at`.
Department is not currently a backend user field, so the frontend should not
claim department assignments persist.

## Reports

No additional report endpoint is required for the current UI. The frontend
derives MRR/ARR, payment history by month, plan distribution and receivable
aging from the existing dashboard summary, subscriptions, invoices and payments
endpoints. Do not return fabricated growth, churn or retention percentages.
