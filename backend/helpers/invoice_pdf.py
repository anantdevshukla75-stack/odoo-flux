from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


def render_invoice_pdf(invoice, customer, customer_user, line_snapshots, payments) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f"Invoice {invoice.invoice_number}",
        author="Brightloop Software",
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "InvoiceTitle", parent=styles["Title"], fontSize=22, leading=26
    )
    small = ParagraphStyle(
        "InvoiceSmall", parent=styles["BodyText"], fontSize=8, leading=11
    )
    right = ParagraphStyle(
        "InvoiceRight", parent=small, alignment=TA_RIGHT
    )
    elements = [
        Paragraph("Brightloop Software", styles["Heading1"]),
        Paragraph("Subscription and billing management", small),
        Spacer(1, 7 * mm),
        Paragraph("INVOICE", title_style),
        Paragraph(f"<b>{escape(invoice.invoice_number)}</b>", styles["Heading2"]),
        Spacer(1, 3 * mm),
    ]

    company = customer.company_name or customer_user.full_name
    customer_lines = [
        f"<b>{escape(company)}</b>",
        escape(customer_user.full_name),
        escape(customer_user.email),
    ]
    if customer.billing_address:
        customer_lines.extend(
            escape(line) for line in customer.billing_address.splitlines()
        )
    if customer.tax_number:
        customer_lines.append(f"Tax ID: {escape(customer.tax_number)}")
    metadata = [
        [Paragraph("<b>BILLED TO</b><br/>" + "<br/>".join(customer_lines), small),
         Paragraph(
             "<b>INVOICE DETAILS</b><br/>"
             f"Issue date: {invoice.issue_date}<br/>"
             f"Due date: {invoice.due_date}<br/>"
             f"Billing period: {invoice.billing_period_start} – {invoice.billing_period_end}<br/>"
             f"Status: {invoice.status.value}",
             right,
         )]
    ]
    elements.extend(
        [
            Table(metadata, colWidths=[88 * mm, 88 * mm]),
            Spacer(1, 8 * mm),
        ]
    )

    header = ["Description", "Qty", "Unit price", "Tax", "Discount", "Tax amount", "Line total"]
    rows = [header]
    for line in invoice.lines:
        snapshot = line_snapshots.get(line.id)
        tax_rate = snapshot.tax_rate if snapshot else 0
        tax_type = (
            snapshot.tax_calculation_type.value
            if snapshot
            else "exclusive"
        )
        tax_label = f"{tax_rate}% {tax_type}" if tax_rate else "—"
        rows.append(
            [
                Paragraph(escape(line.description), small),
                str(line.quantity),
                _money(line.unit_price),
                tax_label,
                _money(line.discount_amount),
                _money(line.tax_amount),
                _money(line.line_total),
            ]
        )
    table = Table(
        rows,
        repeatRows=1,
        colWidths=[54 * mm, 10 * mm, 22 * mm, 18 * mm, 20 * mm, 20 * mm, 26 * mm],
        hAlign="LEFT",
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1e293b")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 7),
                ("FONTSIZE", (0, 1), (-1, -1), 7),
                ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                ("ALIGN", (1, 0), (-1, 0), "RIGHT"),
                ("ALIGN", (0, 0), (0, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ]
        )
    )
    elements.extend([table, Spacer(1, 8 * mm)])

    totals = [
        ["Subtotal", _money(invoice.subtotal)],
        ["Discount", f"- {_money(invoice.discount_amount)}"],
        ["Tax", _money(invoice.tax_amount)],
        [Paragraph("<b>Total</b>", small), Paragraph(f"<b>{_money(invoice.total_amount)}</b>", right)],
    ]
    totals_table = Table(totals, colWidths=[35 * mm, 35 * mm], hAlign="RIGHT")
    totals_table.setStyle(
        TableStyle(
            [
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("LINEABOVE", (0, -1), (-1, -1), 0.8, colors.HexColor("#1e293b")),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    elements.extend([totals_table, Spacer(1, 8 * mm)])

    if payments:
        elements.append(Paragraph("Payment history", styles["Heading3"]))
        payment_rows = [["Date", "Method", "Reference", "Amount"]]
        for payment in payments:
            payment_rows.append(
                [
                    payment.payment_date.strftime("%Y-%m-%d"),
                    payment.payment_method.value.replace("_", " ").title(),
                    escape(payment.reference or "—"),
                    _money(payment.amount),
                ]
            )
        payment_table = Table(
            payment_rows,
            colWidths=[35 * mm, 42 * mm, 62 * mm, 35 * mm],
            repeatRows=1,
        )
        payment_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("ALIGN", (-1, 0), (-1, -1), "RIGHT"),
                    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cbd5e1")),
                ]
            )
        )
        elements.extend([payment_table, Spacer(1, 8 * mm)])

    elements.append(
        Paragraph(
            f"Payment reference: <b>{escape(invoice.invoice_number)}</b>", small
        )
    )
    doc.build(elements)
    return buffer.getvalue()


def _money(value) -> str:
    return f"${value:,.2f}"
