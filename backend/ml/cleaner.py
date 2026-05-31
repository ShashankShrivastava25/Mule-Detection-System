"""DataCleaner — fits a cleaning recipe on training data and replays it on any
incoming DataFrame. Designed to be joblib-persisted alongside the XGBoost model.

Pipeline (in order):
  A. Drop fully-NaN columns
  A. Drop constant (single-unique-value) columns
  A. Drop exact-duplicate columns (keep first occurrence)
  B. Drop columns with > MAX_MISSING_PCT missing (default 80%)
  B. Drop near-zero-variance columns (≤ 2 unique non-NaN values)
  E. Median-impute remaining columns
  G. Winsorize at p1 / p99 percentiles (clip extreme outliers)
  E. RobustScaler (median / IQR) — handles the 145-billion-scale columns
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Optional

import numpy as np
import pandas as pd

log = logging.getLogger("cleaner")


@dataclass
class DataCleaner:
    max_missing_pct: float = 0.80
    nzv_unique_threshold: int = (
        2  # cols with ≤ this many unique non-NaN values get dropped
    )
    winsor_lower: float = 0.01
    winsor_upper: float = 0.99

    # Learned state
    kept_cols: list[str] = field(default_factory=list)
    drop_reasons: dict[str, str] = field(default_factory=dict)
    medians: dict[str, float] = field(default_factory=dict)
    p_low: dict[str, float] = field(default_factory=dict)
    p_high: dict[str, float] = field(default_factory=dict)
    iqr_median: dict[str, float] = field(default_factory=dict)
    iqr_scale: dict[str, float] = field(default_factory=dict)
    fitted: bool = False

    # ------------------------------------------------------------------
    def fit(self, df: pd.DataFrame) -> "DataCleaner":
        df = df.copy()
        n_rows = len(df)
        candidates = list(df.columns)

        # --- A1: fully missing ---
        miss = df.isna().mean()
        fully_missing = miss[miss == 1.0].index.tolist()
        for c in fully_missing:
            self.drop_reasons[c] = "fully_missing"

        # --- A2: constant cols ---
        nunique = df.nunique(dropna=True)
        constant = nunique[nunique <= 1].index.tolist()
        for c in constant:
            self.drop_reasons.setdefault(c, "constant")

        # --- B1: high missingness ---
        high_miss = miss[miss > self.max_missing_pct].index.tolist()
        for c in high_miss:
            self.drop_reasons.setdefault(
                c, f"missing>{int(self.max_missing_pct*100)}pct"
            )

        # --- B2: near-zero variance ---
        nzv = nunique[
            (nunique > 1) & (nunique <= self.nzv_unique_threshold)
        ].index.tolist()
        for c in nzv:
            self.drop_reasons.setdefault(c, "near_zero_variance")

        survivors = [c for c in candidates if c not in self.drop_reasons]

        # --- A3: exact duplicate columns (after dropping the obvious junk) ---
        # Hash each surviving column's content; first one wins, the rest are dropped.
        survivor_df = df[survivors]
        seen: dict[int, str] = {}
        dup_cols: list[str] = []
        for col in survivors:
            vals = survivor_df[col].fillna(-9e18).to_numpy()
            key = hash(vals.tobytes())
            if key in seen:
                dup_cols.append(col)
                self.drop_reasons[col] = f"duplicate_of:{seen[key]}"
            else:
                seen[key] = col
        survivors = [c for c in survivors if c not in self.drop_reasons]

        self.kept_cols = survivors
        log.info(
            "DataCleaner.fit: %d → %d cols (dropped %d)",
            len(candidates),
            len(survivors),
            len(self.drop_reasons),
        )

        # --- E: imputation stats (median per col) ---
        kept = df[survivors].apply(pd.to_numeric, errors="coerce")
        self.medians = kept.median(numeric_only=True).fillna(0.0).to_dict()

        # Replace NaN with median for percentile / scaling stats.
        imputed = kept.fillna(self.medians)

        # --- G: winsorization bounds ---
        p_low = imputed.quantile(self.winsor_lower)
        p_high = imputed.quantile(self.winsor_upper)
        self.p_low = p_low.to_dict()
        self.p_high = p_high.to_dict()

        clipped = imputed.clip(lower=p_low, upper=p_high, axis=1)

        # --- E: RobustScaler params (median, IQR) ---
        median = clipped.median()
        q1 = clipped.quantile(0.25)
        q3 = clipped.quantile(0.75)
        iqr = (q3 - q1).replace(0, 1.0)  # avoid divide-by-zero for tight cols
        self.iqr_median = median.to_dict()
        self.iqr_scale = iqr.to_dict()

        self.fitted = True
        return self

    # ------------------------------------------------------------------
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        if not self.fitted:
            raise RuntimeError("DataCleaner.fit must be called before transform.")

        out = pd.DataFrame(index=df.index)
        for col in self.kept_cols:
            if col in df.columns:
                s = pd.to_numeric(df[col], errors="coerce")
            else:
                s = pd.Series([np.nan] * len(df), index=df.index, dtype=float)
            s = s.fillna(self.medians.get(col, 0.0))
            lo = self.p_low.get(col, s.min())
            hi = self.p_high.get(col, s.max())
            s = s.clip(lower=lo, upper=hi)
            m = self.iqr_median.get(col, 0.0)
            sc = self.iqr_scale.get(col, 1.0) or 1.0
            s = (s - m) / sc
            out[col] = s.astype(float)
        return out

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        self.fit(df)
        return self.transform(df)

    # ------------------------------------------------------------------
    def manifest(self) -> dict:
        reasons_summary: dict[str, int] = {}
        for r in self.drop_reasons.values():
            tag = r.split(":")[0]
            reasons_summary[tag] = reasons_summary.get(tag, 0) + 1
        return {
            "n_kept": len(self.kept_cols),
            "n_dropped": len(self.drop_reasons),
            "drop_reasons_summary": reasons_summary,
            "params": {
                "max_missing_pct": self.max_missing_pct,
                "nzv_unique_threshold": self.nzv_unique_threshold,
                "winsor_lower": self.winsor_lower,
                "winsor_upper": self.winsor_upper,
            },
            "kept_cols_preview": self.kept_cols[:25],
        }
