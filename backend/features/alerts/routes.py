"""External fraud-alert ingestion & cross-match endpoints.

Ingests an external alert (govt cyber-fraud ticket / NCRP complaint / TMS or
fraud-monitoring alert) and cross-references it against accounts the ML
pipeline already flagged. Reads/writes only alert records and existing case
data; never calls the model and never depends on the input dataset's feature
columns. A matched alert is ATTACHED to the case's audit trail (no automatic
status change) so the analyst decides the action.
"""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from core.db import SessionLocal
from features.alerts.models import ExternalAlert
from features.cases.models import AuditEntry, Case

bp = Blueprint("alerts", __name__, url_prefix="/alerts")

VALID_SOURCES = {"NCRP", "I4C", "CFCFRMS", "TMS", "FraudMonitoring", "Manual"}


def _session():
    return SessionLocal()


@bp.post("/ingest")
def ingest_alert():
    body = request.get_json(silent=True) or {}
    account = str(body.get("account", "")).strip()
    if not account:
        return jsonify({"error": "account is required"}), 400

    complaint_id = str(body.get("complaint_id", "")).strip() or None
    source = str(body.get("source", "Manual")).strip() or "Manual"
    if source not in VALID_SOURCES:
        source = "Manual"
    description = str(body.get("description", "")).strip() or None
    raw_amount = body.get("amount")
    try:
        amount = float(raw_amount) if raw_amount not in (None, "") else None
    except (TypeError, ValueError):
        amount = None

    db = _session()
    try:
        case = db.query(Case).filter(Case.account == account).first()

        alert = ExternalAlert(
            complaint_id=complaint_id,
            account=account,
            source=source,
            amount=amount,
            description=description,
        )

        case_dict = None
        if case:
            alert.matched = True
            alert.matched_case_id = case.id
            alert.matched_risk = case.risk_score
            alert.status = "matched"
            case_dict = case.to_dict()
            label = complaint_id or "(no id)"
            amount_txt = f"; reported amount {amount}" if amount else ""
            db.add(AuditEntry(
                case_id=case.id,
                account=account,
                event_type="external_alert",
                detail=f"External {source} alert {label} cross-matched to this account{amount_txt}.",
                actor="system",
            ))
        else:
            alert.matched = False
            alert.status = "watchlist"

        db.add(alert)
        db.commit()

        result = alert.to_dict()
        result["case"] = case_dict
        return jsonify(result)
    finally:
        db.close()


@bp.get("")
@bp.get("/")
def list_alerts():
    status = request.args.get("status")
    db = _session()
    try:
        q = db.query(ExternalAlert)
        if status in {"matched", "watchlist"}:
            q = q.filter(ExternalAlert.status == status)
        q = q.order_by(ExternalAlert.created_at.desc()).limit(200)
        return jsonify([a.to_dict() for a in q.all()])
    finally:
        db.close()


@bp.get("/stats")
def alert_stats():
    db = _session()
    try:
        total = db.query(ExternalAlert).count()
        matched = db.query(ExternalAlert).filter(ExternalAlert.status == "matched").count()
        watchlist = db.query(ExternalAlert).filter(ExternalAlert.status == "watchlist").count()
        by_source = {}
        for s in VALID_SOURCES:
            c = db.query(ExternalAlert).filter(ExternalAlert.source == s).count()
            if c:
                by_source[s] = c
        return jsonify({
            "total": total,
            "matched": matched,
            "watchlist": watchlist,
            "by_source": by_source,
        })
    finally:
        db.close()