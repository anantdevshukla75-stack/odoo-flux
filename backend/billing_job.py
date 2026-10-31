"""Run due recurring billing once; schedule this command with the OS scheduler."""

import logging
from datetime import date

from sqlmodel import Session

from database import db, invoices, model

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)


def main() -> int:
    db.create_tables()
    try:
        with Session(db.engine) as session:
            created = invoices.generate_due_invoices(session, as_of=date.today())
            logger.info("Created %s due invoice(s)", len(created))
            return 0
    except Exception:
        logger.exception("Recurring billing run failed")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
