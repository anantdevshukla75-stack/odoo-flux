# Product Requirement Document

## Front-end

## Back-end

- Authentication
- Products & Plans
- Quotations
- Discount & Taxes
- Analytics
- Customers
- Subscriptions
- Invoicing
- Payments

### API Base Route

```
/api/vi/
```

### Auth

Table: `users`
| Column        | Type     | Constraints          |
| ------------- | -------- | -------------------- |
| id            | Integer  | Primary Key          |
| email         | String   | UNIQUE, NOT NULL     |
| password_hash | String   | NOT NULL             |
| full_name     | String   | UNIQUE, NOT NULL     |
| role          | Enum     | admin/staff/customer |
| is_active     | Boolean  | Default true         |
| created_at    | DateTime | NOT NULL             |

Note: Table Users is for admins + staff.

Table: `customers`
| Column          | Type     | Constraints           |
| --------------- | -------- | --------------------- |
| id              | Integer  | Primary Key           |
| user_id         | Integer  | FK → users.id, UNIQUE |
| company_name    | String   | Optional              |
| phone           | String   | Optional              |
| billing_address | Text     | Optional              |
| tax_number      | String   | Optional              |
| created_at      | DateTime | NOT NULL              |

Note: Table Customers is for billable users.

Table `password_reset_tokens`

id
user_id
token_hash
expires_at
used_at

### Product Management

Table: `products`
| Column       | Type     | Constraints |
| ------------ | -------- | ----------- |
| id           | Integer  | Primary Key |
| name         | String   |             |
| product_type | Enum     |             |
| sales_price  | Decimal  |             |
| cost_price   | Decimal  |             |
| notes        | Text     |             |
| is_active    | Boolean  |             |
| created_at   | DateTime |             |

Product types can initially be:
- Service
- Goods
- Subscription

Table: `product_variants`
TO-DO

### Subscriptions

Table: `plans`
| Column                 | Type    | Constraints |
| ---------------------- | ------- | ----------- |
| id                     | Integer | Primary Key |
| name                   | String  |             |
| description            | Text    |             |
| billing_interval       | Enum    |             |
| billing_interval_count | Integer |             |
| minimum_quantity       | Integer |             |
| start_date             | Date    |             |
| end_date               | Date    |             |
| auto_close             | Boolean |             |
| allow_early_close      | Boolean |             |
| allow_pause            | Boolean |             |
| allow_renewal          | Boolean |             |
| is_active              | Boolean |             |

Billing interval enum:
|daily | weekly | monthly | yearly|

Table: `plan_lines`

| Column     | Type             |
| ---------- | ---------------- |
| id         | Integer PK       |
| plan_id    | FK → plans.id    |
| product_id | FK → products.id |
| quantity   | Integer          |
| unit_price | Decimal          |

A join table between `plan` and `product` tables. Many-to-Many Relationship.

### Quotations

TODO:

### Subscription

Table: `subscriptions`
| Column              | Type              |
| ------------------- | ----------------- |
| id                  | Integer PK        |
| subscription_number | String UNIQUE     |
| customer_id         | FK → customers.id |
| plan_id             | FK → plans.id     |
| template_id         | FK, nullable      |
| start_date          | Date              |
| expiry_date         | Date, nullable    |
| next_billing_date   | Date              |
| payment_terms_days  | Integer           |
| status              | Enum              |
| created_at          | DateTime          |

Status lifecycle:
draft → quotation → confirmed → active → closed

A `subscription` joins a `plan` to a specific `customer`

### Payments

Table: `payments`

| Column         | Type             |
| -------------- | ---------------- |
| id             | Integer PK       |
| invoice_id     | FK               |
| payment_method | Enum             |
| amount         | Decimal          |
| payment_date   | DateTime         |
| reference      | String, nullable |
| note           | Text             |
| created_at     | DateTime         |

Payment Methods: cash, bank_transfer, card, upi, other

### Discounts

TODO:

Table `discount_redemptions`

id
discount_id
subscription_id
invoice_id
redeemed_at