"""Case-management / prevention / audit endpoints.
Operate only on pipeline OUTPUTS; never call the model."""

from __future__ import annotations

from flask import Blueprint, Response, jsonify, request

from core.db import SessionLocal
from features.cases.models import AnalysisRun, AuditEntry, Case
from features.cases.report import build_sar_pdf

bp = Blueprint("cases", __name__, url_prefix="/cases")

RECOMMENDED = {
    "critical": "FREEZE",
    "suspicious": "HOLD",
    "watch": "REVIEW",
    "safe": "CLEAR",
}
VALID_STATUS = {"new", "reviewing", "action_taken", "closed"}
VALID_ACTIONS = {"FREEZE", "HOLD", "REPORT_FIU", "CLEAR", "REVIEW"}


def _session():
    return SessionLocal()


@bp.post("/ingest")
def ingest():
    payload = request.get_json(silent=True) or {}
    summary = payload.get("summary", {}) or {}
    flagged = payload.get("flagged", []) or []

    db = _session()
    try:
        run = AnalysisRun(
            filename=summary.get("filename"),
            total_accounts=int(summary.get("total_accounts", 0) or 0),
            suspicious_count=int(summary.get("suspicious_count", 0) or 0),
            high_risk_count=int(summary.get("high_risk_count", 0) or 0),
            avg_risk=float(summary.get("avg_risk", 0) or 0),
        )
        db.add(run)
        db.flush()

        created, updated = 0, 0
        for row in flagged:
            account = str(row.get("account", "")).strip()
            if not account:
                continue
            score = float(row.get("risk_score", 0) or 0)
            tier = str(row.get("tier", "watch"))
            prediction = int(row.get("prediction", 0) or 0)
            rec = RECOMMENDED.get(tier, "REVIEW")

            existing = db.query(Case).filter(Case.account == account).first()
            if existing:
                existing.risk_score = score
                existing.tier = tier
                existing.prediction = prediction
                existing.recommended_action = rec
                existing.flag_count = (existing.flag_count or 1) + 1
                existing.run_id = run.id
                db.add(
                    AuditEntry(
                        case_id=existing.id,
                        account=account,
                        event_type="created",
                        detail=f"Re-flagged (score {score:.0f}, {tier}). Total flags: {existing.flag_count}.",
                        actor="system",
                    )
                )
                updated += 1
            else:
                case = Case(
                    account=account,
                    risk_score=score,
                    tier=tier,
                    prediction=prediction,
                    recommended_action=rec,
                    status="new",
                    run_id=run.id,
                )
                db.add(case)
                db.flush()
                db.add(
                    AuditEntry(
                        case_id=case.id,
                        account=account,
                        event_type="created",
                        detail=f"Case opened from analysis (score {score:.0f}, {tier}).",
                        actor="system",
                    )
                )
                created += 1

        db.commit()
        return jsonify(
            {"run_id": run.id, "cases_created": created, "cases_updated": updated}
        )
    finally:
        db.close()


@bp.get("")
@bp.get("/")
def list_cases():
    status = request.args.get("status")
    db = _session()
    try:
        q = db.query(Case)
        if status and status in VALID_STATUS:
            q = q.filter(Case.status == status)
        q = q.order_by(Case.risk_score.desc())
        return jsonify([c.to_dict() for c in q.all()])
    finally:
        db.close()


@bp.get("/<int:case_id>")
def get_case(case_id: int):
    db = _session()
    try:
        case = db.get(Case, case_id)
        if not case:
            return jsonify({"error": "Case not found"}), 404
        return jsonify(case.to_dict(include_audit=True))
    finally:
        db.close()


@bp.post("/<int:case_id>/status")
def change_status(case_id: int):
    body = request.get_json(silent=True) or {}
    new_status = str(body.get("status", "")).strip()
    actor = str(body.get("actor", "analyst")).strip() or "analyst"
    if new_status not in VALID_STATUS:
        return (
            jsonify({"error": f"Invalid status. Use one of {sorted(VALID_STATUS)}"}),
            400,
        )
    db = _session()
    try:
        case = db.get(Case, case_id)
        if not case:
            return jsonify({"error": "Case not found"}), 404
        old = case.status
        case.status = new_status
        db.add(
            AuditEntry(
                case_id=case.id,
                account=case.account,
                event_type="status",
                detail=f"Status: {old} -> {new_status}",
                actor=actor,
            )
        )
        db.commit()
        return jsonify(case.to_dict(include_audit=True))
    finally:
        db.close()


@bp.post("/<int:case_id>/action")
def take_action(case_id: int):
    body = request.get_json(silent=True) or {}
    action = str(body.get("action", "")).strip().upper()
    actor = str(body.get("actor", "analyst")).strip() or "analyst"
    note = str(body.get("note", "")).strip()
    if action not in VALID_ACTIONS:
        return (
            jsonify({"error": f"Invalid action. Use one of {sorted(VALID_ACTIONS)}"}),
            400,
        )
    db = _session()
    try:
        case = db.get(Case, case_id)
        if not case:
            return jsonify({"error": "Case not found"}), 404
        case.last_action = action
        if action in {"FREEZE", "HOLD", "REPORT_FIU"}:
            case.status = "action_taken"
        elif action == "CLEAR":
            case.status = "closed"
        detail = f"Action: {action}" + (f" — {note}" if note else "")
        db.add(
            AuditEntry(
                case_id=case.id,
                account=case.account,
                event_type="action",
                detail=detail,
                actor=actor,
            )
        )
        db.commit()
        return jsonify(case.to_dict(include_audit=True))
    finally:
        db.close()


@bp.post("/<int:case_id>/note")
def add_note(case_id: int):
    body = request.get_json(silent=True) or {}
    note = str(body.get("note", "")).strip()
    actor = str(body.get("actor", "analyst")).strip() or "analyst"
    if not note:
        return jsonify({"error": "Note cannot be empty"}), 400
    db = _session()
    try:
        case = db.get(Case, case_id)
        if not case:
            return jsonify({"error": "Case not found"}), 404
        db.add(
            AuditEntry(
                case_id=case.id,
                account=case.account,
                event_type="note",
                detail=note,
                actor=actor,
            )
        )
        db.commit()
        return jsonify(case.to_dict(include_audit=True))
    finally:
        db.close()


@bp.get("/audit/recent")
def recent_audit():
    db = _session()
    try:
        rows = (
            db.query(AuditEntry).order_by(AuditEntry.created_at.desc()).limit(100).all()
        )
        return jsonify([r.to_dict() for r in rows])
    finally:
        db.close()


@bp.get("/history")
def history():
    db = _session()
    try:
        rows = (
            db.query(AnalysisRun)
            .order_by(AnalysisRun.created_at.desc())
            .limit(50)
            .all()
        )
        return jsonify([r.to_dict() for r in rows])
    finally:
        db.close()


@bp.get("/stats")
def stats():
    db = _session()
    try:
        total = db.query(Case).count()
        by_status = {
            s: db.query(Case).filter(Case.status == s).count() for s in VALID_STATUS
        }
        runs = db.query(AnalysisRun).count()
        return jsonify(
            {"total_cases": total, "by_status": by_status, "total_runs": runs}
        )
    finally:
        db.close()


@bp.get("/<int:case_id>/report")
def case_report(case_id: int):
    """Generate a Suspicious Activity Report (SAR) PDF for a case."""
    db = _session()
    try:
        case = db.get(Case, case_id)
        if not case:
            return jsonify({"error": "Case not found"}), 404
        audit = (
            db.query(AuditEntry)
            .filter(AuditEntry.case_id == case_id)
            .order_by(AuditEntry.created_at)
            .all()
        )
        pdf_bytes = build_sar_pdf(case, audit)
        filename = f"SAR_{case.account}_{case_id}.pdf"
        return Response(
            pdf_bytes,
            mimetype="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    finally:
        db.close()
