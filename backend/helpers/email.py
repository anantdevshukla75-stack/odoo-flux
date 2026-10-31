import logging
import smtplib
from email.message import EmailMessage
from urllib.parse import quote

from config import settings

logger = logging.getLogger(__name__)


class EmailNotConfiguredError(Exception):
    """Raised when SMTP delivery settings are incomplete."""


def is_configured() -> bool:
    return bool(settings.SMTP_HOST and settings.SMTP_FROM_EMAIL)


def send_email(to_email: str, subject: str, body: str) -> None:
    if not is_configured():
        raise EmailNotConfiguredError("SMTP email delivery is not configured")

    message = EmailMessage()
    message["From"] = settings.SMTP_FROM_EMAIL
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
            if settings.SMTP_STARTTLS:
                smtp.starttls()
            if settings.SMTP_USERNAME:
                smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD or "")
            smtp.send_message(message)
    except Exception:
        logger.exception("Email delivery failed")
        raise


def send_password_reset(email: str, token: str) -> None:
    reset_url = (
        f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={quote(token)}"
    )
    send_email(
        email,
        "Reset your Odoo Flux password",
        "Use the following single-use link to reset your password. "
        "It expires in 30 minutes.\n\n"
        f"{reset_url}\n\n"
        "If you did not request this, you can ignore this email.",
    )


def send_quotation(
    customer_email: str,
    quotation_number: str,
    quotation_url: str,
    valid_until: str,
    total_amount: str,
) -> None:
    send_email(
        customer_email,
        f"Subscription quotation {quotation_number}",
        "Your subscription proposal is ready to review.\n\n"
        f"Valid until: {valid_until}\n"
        f"Total: {total_amount}\n\n"
        f"{quotation_url}\n",
    )


def send_invoice(customer_email: str, invoice_number: str, invoice_url: str) -> None:
    send_email(
        customer_email,
        f"Invoice {invoice_number}",
        "Your invoice is ready to view.\n\n"
        f"{invoice_url}\n\n"
        "Please contact our billing team if you have questions.",
    )
