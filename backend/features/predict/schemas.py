"""Pydantic response schemas for /predict."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class AccountResult(BaseModel):
    Account: int
    Prediction: int
    Risk_Score: float
    Alert: str

    class Config:
        populate_by_name = True
        fields = {"Risk_Score": "Risk Score"}


class ModelMetricsOut(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1: float
    f2: Optional[float] = None
    auc_pr: Optional[float] = None
    threshold: Optional[float] = None


class ConfusionOut(BaseModel):
    tp: int
    fp: int
    tn: int
    fn: int


class FeatureImportanceItem(BaseModel):
    feature: str
    importance: float


class PredictResponse(BaseModel):
    total_accounts_analyzed: int
    suspicious_accounts_detected: int
    high_risk_alerts: int
    average_risk_score: float
    results: list[dict]
    model_metrics: Optional[ModelMetricsOut] = None
    confusion_matrix: Optional[ConfusionOut] = None
    feature_importance: list[FeatureImportanceItem] = []
    processing_ms: int
