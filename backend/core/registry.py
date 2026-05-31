"""Shared singletons (model, cleaner) — lightweight DI for the Flask app."""
from __future__ import annotations

from ml.model import FraudModel

MODEL = FraudModel()


def ensure_model_loaded() -> FraudModel:
    if not MODEL.is_loaded():
        MODEL.load()
    return MODEL
