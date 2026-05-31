"""SHAP-based per-account explanation service."""
from __future__ import annotations

import io
import logging

import pandas as pd

from core.registry import ensure_model_loaded
from ml.cleaner import DataCleaner  # re-export for typing only

log = logging.getLogger("explain")


def explain_account(raw_bytes: bytes, row_index: int = 0, top_k: int = 6) -> dict:
    model = ensure_model_loaded()
    df = pd.read_csv(io.BytesIO(raw_bytes), low_memory=False)
    if df.empty:
        raise ValueError("CSV has no rows.")
    if row_index < 0 or row_index >= len(df):
        raise ValueError(f"row_index {row_index} out of range (0..{len(df)-1})")

    return model.explain_row(df, row_index=row_index, top_k=top_k)
