"""Live Monitoring feed.

Streams previously-scored accounts over time using Server-Sent Events (SSE),
so the dashboard *looks* like a continuously-running monitor. This does NOT
re-run the model — it replays the scored Case rows already in the database.
If the DB is empty it falls back to a small synthetic demo stream so the page
is never blank during a pitch. Nothing here touches the ML pipeline or any
existing endpoint.
"""

from __future__ import annotations

import json
import random
import time

from flask import Blueprint, Response, jsonify, request, stream_with_context

from core.db import SessionLocal
from features.cases.models import Case

bp = Blueprint("stream", __name__, url_prefix="/stream")

CHANNELS = ["UPI", "IMPS", "NEFT", "RTGS"]


def _tier_for(score: float) -> str:
    if score >= 80:
        return "critical"
    if score >= 50:
        return "suspicious"
    if score >= 20:
        return "watch"
    return "safe"


def _channel_for(account: str) -> str:
    # Deterministic per account so the same account always shows one channel.
    return CHANNELS[sum(ord(c) for c in account) % len(CHANNELS)]


def _load_events():
    """Pull scored accounts from the DB to replay. Newest, highest-risk first."""
    db = SessionLocal()
    try:
        rows = (
            db.query(Case)
            .order_by(Case.updated_at.desc(), Case.risk_score.desc())
            .limit(200)
            .all()
        )
        events = []
        for r in rows:
            events.append(
                {
                    "account": r.account,
                    "risk_score": float(r.risk_score or 0),
                    "tier": r.tier or _tier_for(float(r.risk_score or 0)),
                    "prediction": int(r.prediction or 0),
                    "channel": _channel_for(r.account),
                    "case_id": r.id,
                }
            )
        return events
    finally:
        db.close()


def _synthetic_events(n: int = 40):
    """Fallback demo data when no cases exist yet (keeps the demo alive)."""
    events = []
    for i in range(n):
        score = random.choices(
            [
                random.uniform(0, 20),
                random.uniform(20, 50),
                random.uniform(50, 80),
                random.uniform(80, 99),
            ],
            weights=[50, 25, 15, 10],
        )[0]
        acct = f"ACC{random.randint(10000, 99999)}"
        events.append(
            {
                "account": acct,
                "risk_score": round(score, 1),
                "tier": _tier_for(score),
                "prediction": 1 if score >= 50 else 0,
                "channel": _channel_for(acct),
                "case_id": None,
            }
        )
    return events


@bp.get("/feed")
def feed():
    """SSE endpoint. Emits one scored transaction per tick.

    Query params:
      interval : seconds between events (default 1.5, clamped 0.3–5)
      loop     : '1' to loop forever, '0' to stop after one pass (default 1)
    """
    try:
        interval = float(request.args.get("interval", 1.5))
    except ValueError:
        interval = 1.5
    interval = max(0.3, min(interval, 5.0))
    loop = request.args.get("loop", "1") != "0"

    events = _load_events()
    synthetic = False
    if not events:
        events = _synthetic_events()
        synthetic = True

    @stream_with_context
    def generate():
        # Tell the client up front whether this is real or demo data.
        yield f"event: meta\ndata: {json.dumps({'synthetic': synthetic, 'count': len(events)})}\n\n"
        idx = 0
        n = len(events)
        while True:
            ev = dict(events[idx % n])
            # If looping over synthetic data, vary it each pass.
            if synthetic and idx >= n:
                ev = _synthetic_events(1)[0]
            ev["ts"] = time.time()
            yield f"data: {json.dumps(ev)}\n\n"
            idx += 1
            if not loop and idx >= n:
                break
            time.sleep(interval)

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # disable proxy buffering so events flush
            "Connection": "keep-alive",
        },
    )


@bp.get("/stats")
def stream_stats():
    """Snapshot counters for the live header (not streamed)."""
    db = SessionLocal()
    try:
        total = db.query(Case).count()
        high = db.query(Case).filter(Case.risk_score >= 80).count()
        susp = db.query(Case).filter(Case.risk_score >= 50).count()
        return jsonify(
            {
                "monitored": total,
                "high_risk": high,
                "suspicious": susp,
                "channels": CHANNELS,
            }
        )
    finally:
        db.close()
