"""Health + readiness blueprint."""
from flask import Blueprint, jsonify

from core.registry import MODEL

bp = Blueprint("health", __name__)


@bp.get("/health")
def health():
    """Liveness — does NOT require the model to be loaded."""
    return jsonify({"status": "ok", "service": "fraud-intelligence-api"})


@bp.get("/ready")
def ready():
    """Readiness — true once the model is loaded and warm."""
    loaded = MODEL.is_loaded()
    return jsonify(
        {
            "status": "ok" if loaded else "warming",
            "model_loaded": loaded,
            "trained_at": MODEL.trained_at if loaded else None,
            "threshold": MODEL.threshold if loaded else None,
        }
    )
