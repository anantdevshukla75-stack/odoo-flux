import os
from contextlib import asynccontextmanager
from datetime import date, timedelta
from unittest.mock import patch
from unittest import TestCase

os.environ.setdefault("DATABASE_URL", "sqlite:///./database.db")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30")
os.environ.setdefault("JWT_REFRESH_TOKEN_EXPIRE_DAYS", "7")

from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine, select

from database import db, model
from helpers import auth
from main import app


@asynccontextmanager
async def _test_lifespan(_app):
    yield


class RemainingEndpointTests(TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        app.router.lifespan_context = _test_lifespan
        app.dependency_overrides[db.get_session] = cls._get_session
        admin = model.User(
            id=1,
            email="admin@example.com",
            password_hash="unused",
            full_name="Test Admin",
            role=model.UserRole.ADMIN,
        )
        app.dependency_overrides[auth.get_current_active_user] = lambda: admin
        app.dependency_overrides[auth.require_admin] = lambda: admin

    @classmethod
    def tearDownClass(cls):
        app.dependency_overrides.clear()
        cls.engine.dispose()

    @classmethod
    def _get_session(cls):
        with Session(cls.engine) as session:
            yield session

    def setUp(self):
        SQLModel.metadata.drop_all(self.engine)
        SQLModel.metadata.create_all(self.engine)
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)

    def _create_product(self):
        response = self.client.post(
            "/api/v1/products",
            json={
                "name": "Test Service",
                "sales_price": "20.00",
                "cost_price": "5.00",
            },
        )
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()["id"]

    def test_product_variants_can_be_created_and_listed(self):
        product_id = self._create_product()
        created = self.client.post(
            f"/api/v1/products/{product_id}/variants",
            json={
                "attribute_name": "Storage",
                "attribute_value": "Large",
                "price_adjustment": "12.50",
            },
        )
        self.assertEqual(created.status_code, 201, created.text)
        self.assertEqual(created.json()["price_adjustment"], "12.50")

        listed = self.client.get(f"/api/v1/products/{product_id}/variants")
        self.assertEqual(listed.status_code, 200, listed.text)
        self.assertEqual(len(listed.json()), 1)
        self.assertEqual(listed.json()[0]["attribute_value"], "Large")

    def test_quotation_template_lines_are_saved_atomically(self):
        product_id = self._create_product()
        created = self.client.post(
            "/api/v1/quotation-templates",
            json={
                "name": "Starter Quote",
                "description": "Template for an initial offer",
                "validity_days": 14,
                "product_lines": [
                    {
                        "product_id": product_id,
                        "quantity": 2,
                        "unit_price": "18.00",
                    }
                ],
            },
        )
        self.assertEqual(created.status_code, 201, created.text)
        self.assertEqual(created.json()["product_lines"][0]["quantity"], 2)

        listed = self.client.get("/api/v1/quotation-templates")
        self.assertEqual(listed.status_code, 200, listed.text)
        self.assertEqual(listed.json()[0]["name"], "Starter Quote")

    def test_tax_rules_can_be_created_and_filtered(self):
        created = self.client.post(
            "/api/v1/taxes",
            json={"name": "Standard", "rate": "8.25"},
        )
        self.assertEqual(created.status_code, 201, created.text)
        self.assertEqual(created.json()["rate"], "8.25")

        listed = self.client.get("/api/v1/taxes", params={"is_active": True})
        self.assertEqual(listed.status_code, 200, listed.text)
        self.assertEqual(len(listed.json()), 1)

    def test_inclusive_tax_is_extracted_from_quoted_price(self):
        product_id = self._create_product()
        customer_response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "inclusive-tax@example.com",
                "full_name": "Inclusive Tax",
                "password": "SecurePass123!",
            },
        )
        self.assertEqual(customer_response.status_code, 201, customer_response.text)
        with Session(self.engine) as session:
            customer = session.exec(
                select(model.Customer).where(
                    model.Customer.user_id == customer_response.json()["id"]
                )
            ).first()

        plan = self.client.post(
            "/api/v1/plans",
            json={
                "name": "Inclusive Plan",
                "billing_interval": "monthly",
                "start_date": "2026-01-01",
                "lines": [
                    {"product_id": product_id, "quantity": 1, "unit_price": "22"}
                ],
            },
        )
        self.assertEqual(plan.status_code, 201, plan.text)
        tax = self.client.post(
            "/api/v1/taxes",
            json={
                "name": "Included Tax",
                "rate": "10",
                "calculation_type": "inclusive",
            },
        )
        self.assertEqual(tax.status_code, 201, tax.text)

        quote = self.client.post(
            "/api/v1/quotations",
            json={
                "customer_id": customer.id,
                "plan_id": plan.json()["id"],
                "valid_until": "2030-01-01",
                "tax_id": tax.json()["id"],
                "product_lines": [
                    {"product_id": product_id, "quantity": 1, "unit_price": "22"}
                ],
            },
        )
        self.assertEqual(quote.status_code, 201, quote.text)
        self.assertEqual(quote.json()["subtotal"], "20.00")
        self.assertEqual(quote.json()["tax_amount"], "2.00")
        self.assertEqual(quote.json()["total_amount"], "22.00")

    def test_plan_flags_gate_pause_close_and_renewal(self):
        product_id = self._create_product()
        customer = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "lifecycle@example.com",
                "full_name": "Lifecycle Customer",
                "password": "SecurePass123!",
            },
        )
        self.assertEqual(customer.status_code, 201, customer.text)
        with Session(self.engine) as session:
            db_customer = session.exec(
                select(model.Customer).where(
                    model.Customer.user_id == customer.json()["id"]
                )
            ).first()

        plan = self.client.post(
            "/api/v1/plans",
            json={
                "name": "Renewable Plan",
                "billing_interval": "monthly",
                "start_date": date.today().isoformat(),
                "end_date": (date.today() + timedelta(days=180)).isoformat(),
                "allow_pause": False,
                "allow_early_close": False,
                "allow_renewal": True,
                "lines": [
                    {"product_id": product_id, "quantity": 1, "unit_price": "20"}
                ],
            },
        )
        self.assertEqual(plan.status_code, 201, plan.text)
        created = self.client.post(
            "/api/v1/subscriptions",
            json={
                "customer_id": db_customer.id,
                "plan_id": plan.json()["id"],
                "start_date": date.today().isoformat(),
            },
        )
        self.assertEqual(created.status_code, 201, created.text)
        subscription_id = created.json()["id"]
        self.assertEqual(
            self.client.post(f"/api/v1/subscriptions/{subscription_id}/confirm").status_code,
            200,
        )
        self.assertEqual(
            self.client.post(f"/api/v1/subscriptions/{subscription_id}/activate").status_code,
            200,
        )
        self.assertEqual(
            self.client.post(f"/api/v1/subscriptions/{subscription_id}/pause").status_code,
            400,
        )
        self.assertEqual(
            self.client.post(f"/api/v1/subscriptions/{subscription_id}/close").status_code,
            400,
        )
        with Session(self.engine) as session:
            db_subscription = session.get(model.Subscription, subscription_id)
            db_subscription.expiry_date = date.today() - timedelta(days=1)
            session.add(db_subscription)
            session.commit()
        closed = self.client.post(f"/api/v1/subscriptions/{subscription_id}/close")
        self.assertEqual(closed.status_code, 200, closed.text)
        renewed = self.client.post(f"/api/v1/subscriptions/{subscription_id}/renew")
        self.assertEqual(renewed.status_code, 201, renewed.text)
        self.assertEqual(renewed.json()["status"], "draft")
        duplicate_renewal = self.client.post(
            f"/api/v1/subscriptions/{subscription_id}/renew"
        )
        self.assertEqual(duplicate_renewal.status_code, 409)

    def test_discount_product_links_are_returned(self):
        product_id = self._create_product()
        created = self.client.post(
            "/api/v1/discounts",
            json={
                "name": "Launch",
                "code": "launch15",
                "discount_type": "percentage",
                "value": "15",
                "start_date": "2026-01-01",
                "applicability": "product_specific",
                "applicable_products": [product_id],
            },
        )
        self.assertEqual(created.status_code, 201, created.text)
        self.assertEqual(created.json()["code"], "LAUNCH15")
        self.assertEqual(created.json()["applicable_products"], [product_id])

        listed = self.client.get("/api/v1/discounts")
        self.assertEqual(listed.status_code, 200, listed.text)
        self.assertEqual(listed.json()[0]["redemptions_count"], 0)
        self.assertEqual(listed.json()[0]["applicable_products"], [product_id])

        eligibility = self.client.post(
            "/api/v1/discounts/eligibility",
            json={
                "code": "launch15",
                "purchase_amount": "100.00",
                "quantity": 1,
                "product_id": product_id,
            },
        )
        self.assertEqual(eligibility.status_code, 200, eligibility.text)
        self.assertTrue(eligibility.json()["eligible"])
        self.assertEqual(eligibility.json()["savings"], "15.00")

        updated = self.client.patch(
            f"/api/v1/discounts/{created.json()['id']}",
            json={"value": "20"},
        )
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertEqual(updated.json()["value"], "20.00")

    def test_tax_default_is_unique_and_updateable(self):
        first = self.client.post(
            "/api/v1/taxes",
            json={
                "name": "Standard",
                "rate": "8.25",
                "is_default": True,
            },
        )
        self.assertEqual(first.status_code, 201, first.text)
        second = self.client.post(
            "/api/v1/taxes",
            json={
                "name": "Reduced",
                "rate": "5",
                "calculation_type": "inclusive",
                "is_default": True,
            },
        )
        self.assertEqual(second.status_code, 201, second.text)
        self.assertTrue(second.json()["is_default"])
        self.assertFalse(
            self.client.get(f"/api/v1/taxes/{first.json()['id']}").json()[
                "is_default"
            ]
        )
        updated = self.client.patch(
            f"/api/v1/taxes/{first.json()['id']}",
            json={"is_active": False},
        )
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertFalse(updated.json()["is_default"])

        deactivate_default = self.client.patch(
            f"/api/v1/taxes/{second.json()['id']}",
            json={"is_active": False},
        )
        self.assertEqual(deactivate_default.status_code, 200, deactivate_default.text)
        self.assertFalse(deactivate_default.json()["is_default"])

    def test_discount_validation_rejects_invalid_percentage(self):
        response = self.client.post(
            "/api/v1/discounts",
            json={
                "name": "Too much",
                "code": "TOOMUCH",
                "discount_type": "percentage",
                "value": "101",
                "start_date": "2026-01-01",
                "applicability": "subscription_wide",
            },
        )
        self.assertEqual(response.status_code, 422)

    def test_quotation_snapshots_tax_discount_and_accepts_to_draft_subscription(self):
        product_id = self._create_product()
        variant = self.client.post(
            f"/api/v1/products/{product_id}/variants",
            json={
                "attribute_name": "Edition",
                "attribute_value": "Standard",
                "price_adjustment": "5.00",
            },
        )
        self.assertEqual(variant.status_code, 201, variant.text)
        customer_response = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "quote-customer@example.com",
                "full_name": "Quote Customer",
                "password": "SecurePass123!",
            },
        )
        self.assertEqual(customer_response.status_code, 201, customer_response.text)
        with Session(self.engine) as session:
            customer = session.exec(
                select(model.Customer).where(
                    model.Customer.user_id == customer_response.json()["id"]
                )
            ).first()
            customer_id = customer.id

        plan = self.client.post(
            "/api/v1/plans",
            json={
                "name": "Quote Plan",
                "billing_interval": "monthly",
                "start_date": "2026-01-01",
                "lines": [
                    {"product_id": product_id, "quantity": 1, "unit_price": "20"}
                ],
            },
        )
        self.assertEqual(plan.status_code, 201, plan.text)

        tax = self.client.post(
            "/api/v1/taxes",
            json={"name": "GST", "rate": "10", "is_default": True},
        )
        self.assertEqual(tax.status_code, 201, tax.text)

        discount = self.client.post(
            "/api/v1/discounts",
            json={
                "name": "Quote Offer",
                "code": "QUOTE10",
                "discount_type": "percentage",
                "value": "10",
                "start_date": "2026-01-01",
                "usage_limit": 1,
            },
        )
        self.assertEqual(discount.status_code, 201, discount.text)

        quote = self.client.post(
            "/api/v1/quotations",
            json={
                "customer_id": customer_id,
                "plan_id": plan.json()["id"],
                "valid_until": "2030-01-01",
                "tax_id": tax.json()["id"],
                "discount_code": "quote10",
                "product_lines": [
                    {
                        "product_id": product_id,
                        "variant_id": variant.json()["id"],
                        "description": "Negotiated service",
                        "quantity": 2,
                        "unit_price": "25.00",
                    }
                ],
            },
        )
        self.assertEqual(quote.status_code, 201, quote.text)
        quote_data = quote.json()
        self.assertEqual(quote_data["subtotal"], "50.00")
        self.assertEqual(quote_data["discount_amount"], "5.00")
        self.assertEqual(quote_data["tax_amount"], "4.50")
        self.assertEqual(quote_data["total_amount"], "49.50")

        changed_variant = self.client.patch(
            f"/api/v1/products/{product_id}/variants/{variant.json()['id']}",
            json={"attribute_value": "Updated", "price_adjustment": "99.00"},
        )
        self.assertEqual(changed_variant.status_code, 200, changed_variant.text)

        with (
            patch("routes.quotations.email_service.is_configured", return_value=True),
            patch("routes.quotations.email_service.send_quotation"),
        ):
            sent = self.client.patch(
                f"/api/v1/quotations/{quote_data['id']}",
                json={"status": "sent"},
            )
        self.assertEqual(sent.status_code, 200, sent.text)
        accepted = self.client.patch(
            f"/api/v1/quotations/{quote_data['id']}",
            json={"status": "accepted"},
        )
        self.assertEqual(accepted.status_code, 200, accepted.text)
        self.assertEqual(accepted.json()["status"], "accepted")
        self.assertIsNotNone(accepted.json()["subscription_id"])

        subscription = self.client.get(
            f"/api/v1/subscriptions/{accepted.json()['subscription_id']}"
        )
        self.assertEqual(subscription.status_code, 200, subscription.text)
        self.assertEqual(subscription.json()["status"], "draft")
        self.assertEqual(subscription.json()["lines"][0]["unit_price"], "25.00")
        self.assertEqual(
            subscription.json()["lines"][0]["variant_id"], variant.json()["id"]
        )
        self.assertEqual(subscription.json()["lines"][0]["variant_name"], "Edition: Standard")
        cannot_delete_variant = self.client.delete(
            f"/api/v1/products/{product_id}/variants/{variant.json()['id']}"
        )
        self.assertEqual(cannot_delete_variant.status_code, 409)

        subscription_id = accepted.json()["subscription_id"]
        confirmed = self.client.post(
            f"/api/v1/subscriptions/{subscription_id}/confirm"
        )
        self.assertEqual(confirmed.status_code, 200, confirmed.text)
        activated = self.client.post(
            f"/api/v1/subscriptions/{subscription_id}/activate"
        )
        self.assertEqual(activated.status_code, 200, activated.text)

        invoice_response = self.client.post(
            "/api/v1/billing/generate",
            json={"subscription_id": subscription_id, "as_of": date.today().isoformat()},
        )
        self.assertEqual(invoice_response.status_code, 200, invoice_response.text)
        invoice = invoice_response.json()[0]
        self.assertEqual(invoice["subtotal"], "50.00")
        self.assertEqual(invoice["discount_amount"], "5.00")
        self.assertEqual(invoice["tax_amount"], "4.50")
        self.assertEqual(invoice["total_amount"], "49.50")
        self.assertEqual(invoice["lines"][0]["variant_id"], variant.json()["id"])
        self.assertEqual(invoice["lines"][0]["variant_name"], "Edition: Standard")
        self.assertIn("Edition: Standard", invoice["lines"][0]["description"])

        saved_discount = self.client.get(
            f"/api/v1/discounts/{discount.json()['id']}"
        )
        self.assertEqual(saved_discount.status_code, 200, saved_discount.text)
        self.assertEqual(saved_discount.json()["redemptions_count"], 1)

        catch_up = self.client.post(
            "/api/v1/billing/generate",
            json={"as_of": (date.today() + timedelta(days=95)).isoformat()},
        )
        self.assertEqual(catch_up.status_code, 200, catch_up.text)
        self.assertGreaterEqual(len(catch_up.json()), 2)
        self.assertTrue(
            all(item["discount_amount"] == "0.00" for item in catch_up.json())
        )
        saved_discount = self.client.get(
            f"/api/v1/discounts/{discount.json()['id']}"
        )
        self.assertEqual(saved_discount.json()["redemptions_count"], 1)

    def test_password_policy_applies_to_registration_and_reset(self):
        weak_password = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "weak@example.com",
                "full_name": "Weak Password",
                "password": "Password1",
            },
        )
        self.assertEqual(weak_password.status_code, 422)

        no_special_character = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "nospecial@example.com",
                "full_name": "No Special",
                "password": "Password123",
            },
        )
        self.assertEqual(no_special_character.status_code, 422)

        invalid_reset = self.client.post(
            "/api/v1/auth/reset-password",
            json={"token": "unused", "new_password": "password123!"},
        )
        self.assertEqual(invalid_reset.status_code, 422)

    def test_password_reset_email_sends_single_use_token_when_configured(self):
        registered = self.client.post(
            "/api/v1/auth/register",
            json={
                "email": "reset@example.com",
                "full_name": "Reset User",
                "password": "SecurePass123!",
            },
        )
        self.assertEqual(registered.status_code, 201, registered.text)

        with (
            patch("routes.auth.email_service.is_configured", return_value=True),
            patch("routes.auth.email_service.send_password_reset") as send_reset,
        ):
            requested = self.client.post(
                "/api/v1/auth/forgot-password",
                json={"email": "reset@example.com"},
            )
        self.assertEqual(requested.status_code, 202)
        send_reset.assert_called_once()
        token = send_reset.call_args.args[1]

        reset = self.client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "NewSecure123!"},
        )
        self.assertEqual(reset.status_code, 204, reset.text)
        reused = self.client.post(
            "/api/v1/auth/reset-password",
            json={"token": token, "new_password": "AnotherSecure123!"},
        )
        self.assertEqual(reused.status_code, 400)

    def test_admin_staff_directory_supports_activation_updates(self):
        created = self.client.post(
            "/api/v1/auth/staff",
            json={
                "email": "staff@example.com",
                "full_name": "Test Staff",
                "password": "SecureStaff123!",
            },
        )
        self.assertEqual(created.status_code, 201, created.text)
        staff_id = created.json()["id"]

        listed = self.client.get("/api/v1/auth/staff")
        self.assertEqual(listed.status_code, 200, listed.text)
        self.assertEqual(listed.json()[0]["id"], staff_id)
        self.assertEqual(listed.json()[0]["role"], "staff")

        detail = self.client.get(f"/api/v1/auth/staff/{staff_id}")
        self.assertEqual(detail.status_code, 200, detail.text)

        updated = self.client.patch(
            f"/api/v1/auth/staff/{staff_id}", json={"is_active": False}
        )
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertFalse(updated.json()["is_active"])

        self.assertEqual(
            self.client.get(f"/api/v1/auth/staff/{staff_id}").json()["is_active"],
            False,
        )
