from flask import Blueprint, jsonify

from core.registry import ensure_model_loaded

bp = Blueprint("metrics", __name__)


@bp.get("/metrics")
def metrics():
    model = ensure_model_loaded()
    return jsonify(
        {
            "model_metrics": model.metrics,
            "confusion_matrix": model.confusion,
            "feature_importance": model.feature_importance,
            "trained_at": model.trained_at,
        }
    )
