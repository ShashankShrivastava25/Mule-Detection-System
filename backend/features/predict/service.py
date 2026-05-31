"""Predict-feature business logic — keeps routes thin."""
from __future__ import annotations

import io
import time

import pandas as pd

from ml.model import FraudModel


class PredictionError(Exception):
    """Surface a friendly message + HTTP status to the caller."""

    def __init__(self, message: str, status: int = 400):
        super().__init__(message)
        self.status = status


def parse_csv(raw: bytes) -> pd.DataFrame:
    try:
        df = pd.read_csv(io.BytesIO(raw), low_memory=False)
    except Exception as exc:
        raise PredictionError(f"Could not parse CSV: {exc}", status=400) from exc
    if df.empty:
        raise PredictionError("CSV has no rows.", status=400)
    return df


def run_prediction(model: FraudModel, df: pd.DataFrame) -> dict:
    t0 = time.time()
    try:
        results = model.predict_dataframe(df)
    except Exception as exc:
        raise PredictionError(f"Prediction failed: {exc}", status=500) from exc

    suspicious = sum(1 for r in results if r["Prediction"] == 1)
    high_risk = sum(1 for r in results if r["Risk Score"] >= 80)
    avg_risk = round(sum(r["Risk Score"] for r in results) / max(len(results), 1), 1)

    return {
        "total_accounts_analyzed": len(results),
        "suspicious_accounts_detected": suspicious,
        "high_risk_alerts": high_risk,
        "average_risk_score": avg_risk,
        "results": results,
        "model_metrics": model.metrics,
        "confusion_matrix": model.confusion,
        "feature_importance": model.feature_importance,
        "processing_ms": int((time.time() - t0) * 1000),
    }
