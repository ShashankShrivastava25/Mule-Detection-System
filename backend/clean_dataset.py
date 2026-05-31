"""CLI: fit a DataCleaner on ~/Downloads/DataSet.csv and persist the recipe.

Outputs (all under backend/artifacts/):
  - cleaner.joblib            persistable transformer (applied at training + inference)
  - cleaning_manifest.json    what was dropped + why
  - DataSet_clean.csv.gz      cleaned features + target (optional convenience)
"""
from __future__ import annotations

import json
import logging
import time
from pathlib import Path

import joblib
import pandas as pd

from ml.cleaner import DataCleaner

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] :: %(message)s")
log = logging.getLogger("clean")

BACKEND_DIR = Path(__file__).resolve().parent
ROOT = BACKEND_DIR.parent
DATA_CANDIDATES = [
    BACKEND_DIR / "data" / "DataSet.csv",
    BACKEND_DIR / "data" / "DataSet.csv.gz",
    Path.home() / "Downloads" / "DataSet.csv",
]
ARTIFACTS = BACKEND_DIR / "artifacts"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
CLEAN_OUT = BACKEND_DIR / "data" / "DataSet_clean.csv.gz"
CLEANER_PATH = ARTIFACTS / "cleaner.joblib"
MANIFEST_PATH = ARTIFACTS / "cleaning_manifest.json"

TARGET_COL = "F3924"


def main() -> None:
    t0 = time.time()
    src = next((p for p in DATA_CANDIDATES if p.exists()), None)
    if src is None:
        raise FileNotFoundError(
            "No dataset found. Expected ~/Downloads/DataSet.csv."
        )
    log.info("Loading %s", src)
    df = pd.read_csv(src, low_memory=False)

    for c in ("", "Unnamed: 0"):
        if c in df.columns:
            df = df.drop(columns=[c])

    y = df[TARGET_COL].astype(int) if TARGET_COL in df.columns else None
    X = df.drop(columns=[TARGET_COL], errors="ignore")

    log.info("Original feature matrix: %d × %d", *X.shape)

    cleaner = DataCleaner()
    X_clean = cleaner.fit_transform(X)
    log.info("Cleaned feature matrix:  %d × %d", *X_clean.shape)

    out_df = X_clean.copy()
    if y is not None:
        out_df[TARGET_COL] = y.values

    log.info("Writing cleaned dataset -> %s", CLEAN_OUT)
    out_df.to_csv(CLEAN_OUT, index=False, compression="gzip")

    joblib.dump(cleaner, CLEANER_PATH)
    log.info("Persisted cleaner -> %s", CLEANER_PATH)

    manifest = cleaner.manifest()
    manifest["source"] = str(src)
    manifest["target"] = TARGET_COL
    manifest["output"] = str(CLEAN_OUT)
    manifest["n_rows"] = len(out_df)
    manifest["runtime_sec"] = round(time.time() - t0, 1)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2))
    log.info("Manifest -> %s\n%s", MANIFEST_PATH, json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
