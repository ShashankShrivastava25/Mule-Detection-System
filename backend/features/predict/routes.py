import logging

from flask import Blueprint, jsonify, request

from core.registry import ensure_model_loaded

from .service import PredictionError, parse_csv, run_prediction

log = logging.getLogger("predict")
bp = Blueprint("predict", __name__)


@bp.post("/predict")
def predict():
    model = ensure_model_loaded()

    if "file" not in request.files:
        return jsonify({"error": "Upload a CSV under form field 'file'."}), 400
    f = request.files["file"]
    if not f.filename:
        return jsonify({"error": "Empty filename."}), 400

    try:
        df = parse_csv(f.read())
        payload = run_prediction(model, df)
    except PredictionError as err:
        log.warning("/predict %d :: %s", err.status, err)
        return jsonify({"error": str(err)}), err.status

    log.info(
        "/predict ok rows=%d suspicious=%d %dms",
        payload["total_accounts_analyzed"],
        payload["suspicious_accounts_detected"],
        payload["processing_ms"],
    )
    return jsonify(payload)
