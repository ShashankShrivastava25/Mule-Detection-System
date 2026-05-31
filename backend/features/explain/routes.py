"""SHAP-based per-account explanation endpoint.

POST /explain
  multipart CSV upload + form field `row` (0-indexed row in the CSV).
  Returns the top contributing features for that account, with humanised labels.
"""
from __future__ import annotations

import io
import logging

import pandas as pd
from flask import Blueprint, jsonify, request

from core.registry import ensure_model_loaded

log = logging.getLogger("explain")
bp = Blueprint("explain", __name__)


@bp.post("/explain")
def explain():
    model = ensure_model_loaded()

    if "file" not in request.files:
        return jsonify({"error": "Upload a CSV under form field 'file'."}), 400
    f = request.files["file"]
    try:
        row_index = int(request.form.get("row", "0"))
        top_k = int(request.form.get("top_k", "6"))
    except ValueError:
        return jsonify({"error": "row and top_k must be integers."}), 400

    try:
        df = pd.read_csv(io.BytesIO(f.read()), low_memory=False)
    except Exception as exc:  # noqa: BLE001
        return jsonify({"error": f"Could not parse CSV: {exc}"}), 400

    if row_index < 0 or row_index >= len(df):
        return jsonify({"error": f"row {row_index} out of bounds (0..{len(df)-1})."}), 400

    try:
        payload = model.explain_row(df, row_index=row_index, top_k=top_k)
    except Exception as exc:  # noqa: BLE001
        log.exception("Explain failed")
        return jsonify({"error": f"Explain failed: {exc}"}), 500

    return jsonify(payload)
