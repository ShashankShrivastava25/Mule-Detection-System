"""Suspicious Activity Report (SAR) PDF generator.

Renders an existing Case and its append-only audit trail into a clean,
compliance-style PDF — the kind of artifact a bank's fraud-ops team would
file with the Financial Intelligence Unit (FIU-IND). Reads only data already
stored; never calls the model. All human-readable times are shown in IST.
"""

from __future__ import annotations

import datetime as dt
import io

from fpdf import FPDF

IST = dt.timezone(dt.timedelta(hours=5, minutes=30))

BRAND = (79, 70, 229)
INK = (17, 24, 39)
MUTED = (107, 114, 128)
LINE = (229, 231, 235)

TIER_COLOR = {
    "critical": (220, 38, 38),
    "suspicious": (234, 88, 12),
    "watch": (202, 138, 4),
    "safe": (22, 163, 74),
}


def _ist(value) -> str:
    """Format a stored timestamp (UTC or naive) as IST text."""
    if not value:
        return "—"
    if isinstance(value, str):
        try:
            value = dt.datetime.fromisoformat(value)
        except ValueError:
            return value
    if value.tzinfo is None:
        value = value.replace(tzinfo=dt.timezone.utc)
    return value.astimezone(IST).strftime("%d %b %Y, %I:%M:%S %p IST")


def _ref_number(case) -> str:
    created = case.created_at or dt.datetime.now(dt.timezone.utc)
    if created.tzinfo is None:
        created = created.replace(tzinfo=dt.timezone.utc)
    stamp = created.astimezone(IST).strftime("%Y%m%d")
    return f"SAR-{stamp}-{case.id:05d}"


class _SARDoc(FPDF):
    def header(self):
        self.set_fill_color(*BRAND)
        self.rect(0, 0, self.w, 22, style="F")
        self.set_xy(12, 6)
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 15)
        self.cell(0, 6, "Muleguard  -  Suspicious Activity Report", ln=1)
        self.set_x(12)
        self.set_font("Helvetica", "", 8)
        self.cell(
            0,
            4,
            "AI Fraud Intelligence  -  Confidential / For internal & regulatory use",
            ln=1,
        )
        self.ln(10)

    def footer(self):
        self.set_y(-14)
        self.set_draw_color(*LINE)
        self.line(12, self.get_y(), self.w - 12, self.get_y())
        self.set_y(-11)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(*MUTED)
        gen = (
            dt.datetime.now(dt.timezone.utc)
            .astimezone(IST)
            .strftime("%d %b %Y, %I:%M %p IST")
        )
        self.cell(0, 5, f"Generated {gen}", align="L")
        self.cell(0, 5, f"Page {self.page_no()}", align="R")


def _section(pdf: _SARDoc, title: str):
    pdf.ln(3)
    pdf.set_text_color(*BRAND)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(0, 6, title.upper(), ln=1)
    pdf.set_draw_color(*LINE)
    pdf.line(12, pdf.get_y(), pdf.w - 12, pdf.get_y())
    pdf.ln(2)


def _row(pdf: _SARDoc, label: str, value: str, value_color=INK):
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*MUTED)
    pdf.cell(50, 6, label)
    pdf.set_text_color(*value_color)
    pdf.set_font("Helvetica", "B", 9)
    pdf.multi_cell(0, 6, value if value is not None else "—", ln=1)


def build_sar_pdf(case, audit_entries) -> bytes:
    """Return PDF bytes for a case and its audit entries."""
    pdf = _SARDoc(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.add_page()
    pdf.set_left_margin(12)
    pdf.set_right_margin(12)

    pdf.set_text_color(*INK)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 6, f"Report reference: {_ref_number(case)}", ln=1)
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(*MUTED)
    pdf.cell(0, 5, f"Generated at: {_ist(dt.datetime.now(dt.timezone.utc))}", ln=1)

    _section(pdf, "Subject account")
    tier = (case.tier or "watch").lower()
    _row(pdf, "Account identifier", case.account)
    _row(pdf, "Risk score", f"{round(case.risk_score or 0)} / 100")
    _row(pdf, "Risk tier", tier.capitalize(), TIER_COLOR.get(tier, INK))
    _row(
        pdf,
        "Model classification",
        "Mule (flagged)" if case.prediction == 1 else "Not flagged",
    )
    _row(pdf, "Times flagged", str(case.flag_count or 1))

    _section(pdf, "Assessment & disposition")
    _row(pdf, "Recommended action", case.recommended_action or "—")
    _row(pdf, "Action taken", case.last_action or "None recorded")
    _row(pdf, "Current status", (case.status or "new").replace("_", " ").title())
    _row(pdf, "Case opened", _ist(case.created_at))
    _row(pdf, "Last updated", _ist(case.updated_at))

    _section(pdf, "Investigation audit trail")
    if not audit_entries:
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(*MUTED)
        pdf.cell(0, 6, "No audit entries recorded.", ln=1)
    else:
        for a in audit_entries:
            pdf.set_font("Helvetica", "B", 8.5)
            pdf.set_text_color(*BRAND)
            etype = (a.event_type or "event").upper()
            pdf.cell(0, 5, f"{etype}  -  {_ist(a.created_at)}", ln=1)
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(*INK)
            pdf.multi_cell(
                0, 5, f"{a.detail or ''}   (by {a.actor or 'analyst'})", ln=1
            )
            pdf.ln(1)

    _section(pdf, "Attestation")
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(*MUTED)
    pdf.multi_cell(
        0,
        4.5,
        "This report was generated by the Muleguard fraud-intelligence platform from "
        "model outputs and the recorded investigation history for the subject account. "
        "Risk scores are produced by an automated ensemble model and are decision-support "
        "indicators, not a determination of guilt. All timestamps are in Indian Standard "
        "Time (IST).",
    )

    out = pdf.output(dest="S")
    if isinstance(out, str):
        return out.encode("latin-1")
    return bytes(out)
