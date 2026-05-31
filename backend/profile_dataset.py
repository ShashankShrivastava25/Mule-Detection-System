"""Dataset profiler — senior-ML-engineer audit of data quality issues.

Runs in <30s on the full 9,082 × 3,924 dataset. Prints a structured report and
writes a machine-readable JSON for downstream cleaning decisions.
"""
from __future__ import annotations

import json
import time
from pathlib import Path

import numpy as np
import pandas as pd

BACKEND_DIR = Path(__file__).resolve().parent
ROOT = BACKEND_DIR.parent
DATA_CANDIDATES = [
    BACKEND_DIR / "data" / "DataSet.csv",
    BACKEND_DIR / "data" / "DataSet.csv.gz",
    Path.home() / "Downloads" / "DataSet.csv",
]
OUT = BACKEND_DIR / "artifacts" / "dataset_profile.json"
OUT.parent.mkdir(exist_ok=True, parents=True)


def find_dataset() -> Path:
    for p in DATA_CANDIDATES:
        if p.exists():
            return p
    raise FileNotFoundError("No dataset found.")


def main() -> None:
    t0 = time.time()
    path = find_dataset()
    print(f"[profile] reading {path} ...")
    df = pd.read_csv(path, low_memory=False)

    # Drop unnamed index column.
    for c in ("", "Unnamed: 0"):
        if c in df.columns:
            df = df.drop(columns=[c])

    n_rows, n_cols = df.shape
    print(f"[profile] shape: {n_rows} rows × {n_cols} cols  ({time.time()-t0:.1f}s)")

    target = "F3924"
    has_target = target in df.columns
    feats = df.drop(columns=[target]) if has_target else df

    # --- Missing values ---
    miss_count = feats.isna().sum()
    miss_pct = miss_count / n_rows
    miss_buckets = {
        "0%":           int((miss_pct == 0).sum()),
        "1-20%":        int(((miss_pct > 0) & (miss_pct <= 0.20)).sum()),
        "20-50%":       int(((miss_pct > 0.20) & (miss_pct <= 0.50)).sum()),
        "50-80%":       int(((miss_pct > 0.50) & (miss_pct <= 0.80)).sum()),
        "80-99%":       int(((miss_pct > 0.80) & (miss_pct < 1.0)).sum()),
        "100% missing": int((miss_pct == 1.0).sum()),
    }
    high_missing_cols = miss_pct[miss_pct > 0.50].index.tolist()
    fully_missing = miss_pct[miss_pct == 1.0].index.tolist()

    # --- Constant / near-zero variance ---
    numeric = feats.select_dtypes(include=[np.number])
    nunique = numeric.nunique(dropna=True)
    constant_cols = nunique[nunique <= 1].index.tolist()
    near_zero_var = nunique[(nunique > 1) & (nunique < 3)].index.tolist()

    # --- Duplicate columns (by content) ---
    # Cheap approach: hash the column values (handle NaN) and group.
    print("[profile] checking duplicate columns ...")
    dup_groups: dict[str, list[str]] = {}
    seen: dict[bytes, str] = {}
    # Convert NaN to a sentinel for hashing.
    for col in numeric.columns:
        vals = numeric[col].fillna(-9e18).values.tobytes()
        h = vals
        # Memory-friendly hash via builtin hash on bytes
        key = hash(h)
        if key in seen:
            dup_groups.setdefault(seen[key], []).append(col)
        else:
            seen[key] = col
    duplicate_cols = [c for grp in dup_groups.values() for c in grp]

    # --- Duplicate rows ---
    print("[profile] checking duplicate rows ...")
    dup_rows = int(df.duplicated().sum())

    # --- Scale / outliers (on a sample) ---
    print("[profile] computing scale stats ...")
    sample = numeric.sample(min(2000, len(numeric)), random_state=0)
    desc = sample.describe(percentiles=[0.01, 0.99]).T
    out_of_unit_interval = int(((desc["min"] < -0.01) | (desc["max"] > 1.01)).sum())

    # --- Correlation (cheap: only on first ~400 non-constant cols, costlier on full) ---
    print("[profile] computing correlations on top-non-constant block ...")
    pool = numeric.drop(columns=constant_cols + fully_missing, errors="ignore")
    cor_block = pool.iloc[:, :400]
    cor_block = cor_block.fillna(cor_block.median(numeric_only=True))
    if cor_block.shape[1] > 1:
        corr = cor_block.corr().abs()
        np.fill_diagonal(corr.values, 0)
        high_corr_pairs = (corr >= 0.95).sum().sum() // 2
    else:
        high_corr_pairs = 0

    # --- Target balance ---
    target_balance = (
        df[target].value_counts(dropna=False).to_dict() if has_target else {}
    )

    # --- Summary ---
    profile = {
        "path": str(path),
        "shape": {"rows": n_rows, "cols": n_cols},
        "target": {"column": target, "balance": {str(k): int(v) for k, v in target_balance.items()}},
        "missing": {
            "by_bucket": miss_buckets,
            "cols_over_50pct_missing": len(high_missing_cols),
            "fully_missing_cols": len(fully_missing),
            "fully_missing_examples": fully_missing[:10],
            "worst_offenders": miss_pct.sort_values(ascending=False).head(10).round(3).to_dict(),
        },
        "low_variance": {
            "constant_cols": len(constant_cols),
            "constant_examples": constant_cols[:10],
            "near_zero_variance_cols": len(near_zero_var),
        },
        "duplicates": {
            "duplicate_columns": len(duplicate_cols),
            "duplicate_column_examples": duplicate_cols[:10],
            "duplicate_rows": dup_rows,
        },
        "scale": {
            "cols_outside_unit_interval": out_of_unit_interval,
            "global_min": float(desc["min"].min()),
            "global_max": float(desc["max"].max()),
        },
        "correlation": {
            "high_corr_pairs_in_first_400_cols_>=0.95": int(high_corr_pairs),
        },
        "runtime_sec": round(time.time() - t0, 1),
    }

    print(json.dumps(profile, indent=2, default=str))
    OUT.write_text(json.dumps(profile, indent=2, default=str))
    print(f"[profile] wrote {OUT}  ({time.time()-t0:.1f}s total)")


if __name__ == "__main__":
    main()
