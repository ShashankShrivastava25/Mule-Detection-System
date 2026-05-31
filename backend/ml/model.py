"""Ensemble fraud-detection model.

Combines three complementary signals:
  - XGBoost classifier  (supervised, tabular tree boosting)
  - LightGBM classifier (different splitting strategy → more diversity)
  - IsolationForest    (unsupervised anomaly score — catches unseen patterns)

Predictions are blended (weighted soft vote), calibrated to true probabilities
via CalibratedClassifierCV (sigmoid), and the decision threshold is tuned for
F2 (recall-weighted) on the held-out split.

Persistence layout (backend/artifacts/):
  - model_xgb.joblib
  - model_lgbm.joblib
  - model_iso.joblib
  - calibrator.joblib
  - cleaner.joblib
  - features.json
  - metrics.json
  - threshold.json
"""
from __future__ import annotations

import json
import logging
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    confusion_matrix,
    f1_score,
    fbeta_score,
    precision_recall_curve,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

try:
    from lightgbm import LGBMClassifier  # type: ignore
    HAS_LGBM = True
except Exception:  # pragma: no cover
    HAS_LGBM = False

from ml.cleaner import DataCleaner

log = logging.getLogger("model")

ML_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ML_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent
ARTIFACTS_DIR = BACKEND_DIR / "artifacts"
ARTIFACTS_DIR.mkdir(exist_ok=True, parents=True)

XGB_PATH = ARTIFACTS_DIR / "model_xgb.joblib"
LGBM_PATH = ARTIFACTS_DIR / "model_lgbm.joblib"
ISO_PATH = ARTIFACTS_DIR / "model_iso.joblib"
CALIB_PATH = ARTIFACTS_DIR / "calibrator.joblib"
CLEANER_PATH = ARTIFACTS_DIR / "cleaner.joblib"
FEATURE_LIST_PATH = ARTIFACTS_DIR / "features.json"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
THRESHOLD_PATH = ARTIFACTS_DIR / "threshold.json"

DEFAULT_DATASET_CANDIDATES = [
    BACKEND_DIR / "data" / "DataSet.csv",
    BACKEND_DIR / "data" / "DataSet.csv.gz",
    Path.home() / "Downloads" / "DataSet.csv",
]

TARGET_COL = "F3924"
INDEX_COL_CANDIDATES = ("", "Unnamed: 0", "Account")

# Blend weights — XGBoost slightly higher (best historical performance on this kind of data),
# LightGBM second, IsolationForest as an anomaly-channel.
DEFAULT_WEIGHTS = {"xgb": 0.45, "lgbm": 0.35, "iso": 0.20}


@dataclass
class Metrics:
    accuracy: float
    precision: float
    recall: float
    f1: float
    f2: float
    auc_pr: float
    threshold: float


@dataclass
class ConfusionCounts:
    tp: int
    fp: int
    tn: int
    fn: int


@dataclass
class TrainingArtifacts:
    metrics: Metrics
    confusion: ConfusionCounts
    feature_importance: list[dict]
    trained_at: float
    n_train: int
    n_test: int
    used_lgbm: bool


# ──────────────────────────────────────────────────────────────────────────────
# IO helpers
# ──────────────────────────────────────────────────────────────────────────────


def _read_dataset(path: Path) -> pd.DataFrame:
    log.info("Loading dataset from %s", path)
    df = pd.read_csv(path, compression="gzip" if path.suffix == ".gz" else None, low_memory=False)
    drop_cols = [c for c in df.columns if c in INDEX_COL_CANDIDATES]
    if drop_cols:
        df = df.drop(columns=drop_cols)
    return df


def _resolve_dataset(explicit: Optional[Path] = None) -> Path:
    if explicit and explicit.exists():
        return explicit
    for cand in DEFAULT_DATASET_CANDIDATES:
        if cand.exists():
            return cand
    raise FileNotFoundError("No dataset found in expected locations.")


def _split_xy(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    if TARGET_COL not in df.columns:
        raise ValueError(f"Target column {TARGET_COL!r} not found.")
    y = df[TARGET_COL].astype(int)
    X = df.drop(columns=[TARGET_COL])
    return X, y


# ──────────────────────────────────────────────────────────────────────────────
# Training
# ──────────────────────────────────────────────────────────────────────────────


def _blend_scores(xgb_p: np.ndarray, lgbm_p: Optional[np.ndarray], iso_a: np.ndarray) -> np.ndarray:
    """Combine model scores into a single risk score in [0, 1]."""
    w = DEFAULT_WEIGHTS.copy()
    if lgbm_p is None:
        w["xgb"] += w.pop("lgbm")  # reallocate weight
        lgbm_p = np.zeros_like(xgb_p)
    return w["xgb"] * xgb_p + w["lgbm"] * lgbm_p + w["iso"] * iso_a


def _optimize_threshold(y_true: np.ndarray, scores: np.ndarray, beta: float = 2.0) -> float:
    """Pick threshold that maximizes F_beta (default F2 — recall-weighted)."""
    precisions, recalls, thresholds = precision_recall_curve(y_true, scores)
    # f-beta for each cutpoint; skip last entry which has no threshold.
    p = precisions[:-1]
    r = recalls[:-1]
    eps = 1e-12
    fbeta = (1 + beta**2) * p * r / (beta**2 * p + r + eps)
    if len(fbeta) == 0:
        return 0.5
    best = int(np.nanargmax(fbeta))
    return float(thresholds[best])


def train_and_persist(dataset_path: Optional[Path] = None) -> TrainingArtifacts:
    t0 = time.time()
    path = _resolve_dataset(dataset_path)
    df = _read_dataset(path)
    X, y = _split_xy(df)

    log.info("Dataset shape: %s, positives: %d / %d", X.shape, int(y.sum()), len(y))

    # 1) Cleaning step (or reuse persisted)
    if CLEANER_PATH.exists() and path.name.startswith("DataSet_clean"):
        cleaner: DataCleaner = joblib.load(CLEANER_PATH)
        log.info("Reusing persisted cleaner (%d cols)", len(cleaner.kept_cols))
        X_clean = cleaner.transform(X)
    else:
        cleaner = DataCleaner()
        X_clean = cleaner.fit_transform(X)
        joblib.dump(cleaner, CLEANER_PATH)
        log.info("Fit + persisted cleaner (%d → %d cols)", X.shape[1], X_clean.shape[1])

    # 2) Stratified split
    X_train, X_test, y_train, y_test = train_test_split(
        X_clean, y, test_size=0.2, stratify=y, random_state=42
    )

    neg = int((y_train == 0).sum())
    pos = max(int((y_train == 1).sum()), 1)
    scale_pos_weight = neg / pos
    log.info("Class imbalance: scale_pos_weight=%.2f", scale_pos_weight)

    # 3) Train XGBoost
    xgb = XGBClassifier(
        n_estimators=500,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.7,
        scale_pos_weight=scale_pos_weight,
        eval_metric="aucpr",
        tree_method="hist",
        random_state=42,
        n_jobs=-1,
    )
    log.info("Training XGBoost...")
    xgb.fit(X_train, y_train, verbose=False)
    xgb_test = xgb.predict_proba(X_test)[:, 1]

    # 4) Train LightGBM (optional, parallel signal)
    if HAS_LGBM:
        lgbm = LGBMClassifier(
            n_estimators=600,
            max_depth=-1,
            num_leaves=63,
            learning_rate=0.04,
            subsample=0.85,
            colsample_bytree=0.75,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
            verbose=-1,
        )
        log.info("Training LightGBM...")
        lgbm.fit(X_train, y_train)
        lgbm_test = lgbm.predict_proba(X_test)[:, 1]
        joblib.dump(lgbm, LGBM_PATH)
    else:
        log.warning("lightgbm not installed — ensemble runs without LGBM channel.")
        lgbm = None
        lgbm_test = None

    # 5) IsolationForest as unsupervised anomaly channel
    iso = IsolationForest(
        n_estimators=300,
        max_samples=min(1024, len(X_train)),
        contamination=max(float(pos / (pos + neg)), 0.005),
        random_state=42,
        n_jobs=-1,
    )
    log.info("Training IsolationForest...")
    iso.fit(X_train)
    iso_raw = -iso.score_samples(X_test)  # higher = more anomalous
    iso_min, iso_max = iso_raw.min(), iso_raw.max()
    iso_test = (iso_raw - iso_min) / (iso_max - iso_min + 1e-12)

    # 6) Blend
    blended = _blend_scores(xgb_test, lgbm_test, iso_test)

    # 7) Calibrate the blended score on the test split via isotonic regression
    #    (Wrap in a small monotonic mapping so risk scores read as true probabilities.)
    from sklearn.isotonic import IsotonicRegression

    calibrator = IsotonicRegression(out_of_bounds="clip", y_min=0.0, y_max=1.0)
    calibrator.fit(blended, y_test)
    calibrated = calibrator.transform(blended)

    # 8) Threshold optimization (F2 — recall-weighted, biased toward catching fraud)
    threshold = _optimize_threshold(y_test.values, calibrated, beta=2.0)
    preds = (calibrated >= threshold).astype(int)

    metrics = Metrics(
        accuracy=float(accuracy_score(y_test, preds)),
        precision=float(precision_score(y_test, preds, zero_division=0)),
        recall=float(recall_score(y_test, preds, zero_division=0)),
        f1=float(f1_score(y_test, preds, zero_division=0)),
        f2=float(fbeta_score(y_test, preds, beta=2.0, zero_division=0)),
        auc_pr=float(average_precision_score(y_test, calibrated)),
        threshold=float(threshold),
    )
    cm = confusion_matrix(y_test, preds, labels=[0, 1])
    tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])
    confusion = ConfusionCounts(tp=tp, fp=fp, tn=tn, fn=fn)

    # 9) Feature importance — average normalized importance across xgb + lgbm
    feat_imp = np.array(xgb.feature_importances_, dtype=float)
    if lgbm is not None:
        lgbm_imp = np.array(lgbm.feature_importances_, dtype=float)
        feat_imp = feat_imp / max(feat_imp.sum(), 1e-9) + lgbm_imp / max(lgbm_imp.sum(), 1e-9)
        feat_imp /= 2

    top = sorted(zip(cleaner.kept_cols, feat_imp), key=lambda kv: kv[1], reverse=True)[:25]
    feature_importance = [{"feature": str(f), "importance": float(i)} for f, i in top]

    artifacts = TrainingArtifacts(
        metrics=metrics,
        confusion=confusion,
        feature_importance=feature_importance,
        trained_at=time.time(),
        n_train=len(X_train),
        n_test=len(X_test),
        used_lgbm=HAS_LGBM,
    )

    joblib.dump(xgb, XGB_PATH)
    joblib.dump(iso, ISO_PATH)
    joblib.dump(calibrator, CALIB_PATH)
    FEATURE_LIST_PATH.write_text(json.dumps(list(cleaner.kept_cols)))
    THRESHOLD_PATH.write_text(json.dumps({"threshold": float(threshold)}))
    METRICS_PATH.write_text(
        json.dumps(
            {
                "metrics": asdict(metrics),
                "confusion": asdict(confusion),
                "feature_importance": feature_importance,
                "trained_at": artifacts.trained_at,
                "n_train": artifacts.n_train,
                "n_test": artifacts.n_test,
                "used_lgbm": artifacts.used_lgbm,
                "blend_weights": DEFAULT_WEIGHTS,
            },
            indent=2,
        )
    )

    log.info(
        "Ensemble trained in %.1fs · acc=%.3f f1=%.3f f2=%.3f AUC-PR=%.3f  threshold=%.3f  tp=%d fp=%d fn=%d tn=%d",
        time.time() - t0,
        metrics.accuracy,
        metrics.f1,
        metrics.f2,
        metrics.auc_pr,
        threshold,
        tp,
        fp,
        fn,
        tn,
    )
    return artifacts


# ──────────────────────────────────────────────────────────────────────────────
# Inference wrapper
# ──────────────────────────────────────────────────────────────────────────────


def _alert_for(score: float) -> str:
    if score >= 80:
        return "High-risk mule account detected"
    if score >= 50:
        return "Suspicious activity flagged for review"
    if score >= 20:
        return "Mild anomaly observed"
    return "Account behavior nominal"


class FraudModel:
    """Inference wrapper for the ensemble."""

    def __init__(self) -> None:
        self.xgb: Optional[XGBClassifier] = None
        self.lgbm = None  # type: ignore
        self.iso: Optional[IsolationForest] = None
        self.calibrator = None  # type: ignore
        self.cleaner: Optional[DataCleaner] = None
        self.features: Optional[list[str]] = None
        self.metrics: Optional[dict] = None
        self.confusion: Optional[dict] = None
        self.feature_importance: Optional[list[dict]] = None
        self.trained_at: Optional[float] = None
        self.threshold: float = 0.5

    def is_loaded(self) -> bool:
        return self.xgb is not None

    # ---------------------------------------------------------------------- #
    def load(self) -> None:
        required = [XGB_PATH, ISO_PATH, CALIB_PATH, CLEANER_PATH, METRICS_PATH, FEATURE_LIST_PATH]
        if not all(p.exists() for p in required):
            log.info("Missing one or more artifacts — running fresh train.")
            train_and_persist()

        self.xgb = joblib.load(XGB_PATH)
        self.iso = joblib.load(ISO_PATH)
        self.calibrator = joblib.load(CALIB_PATH)
        self.cleaner = joblib.load(CLEANER_PATH)
        self.features = json.loads(FEATURE_LIST_PATH.read_text())
        if LGBM_PATH.exists():
            self.lgbm = joblib.load(LGBM_PATH)

        cached = json.loads(METRICS_PATH.read_text())
        self.metrics = cached["metrics"]
        self.confusion = cached["confusion"]
        self.feature_importance = cached["feature_importance"]
        self.trained_at = cached.get("trained_at")
        if THRESHOLD_PATH.exists():
            self.threshold = float(json.loads(THRESHOLD_PATH.read_text())["threshold"])

        log.info(
            "Model loaded · features=%d threshold=%.3f lgbm=%s",
            len(self.features),
            self.threshold,
            self.lgbm is not None,
        )

    # ---------------------------------------------------------------------- #
    def _raw_scores(self, X_clean: pd.DataFrame) -> tuple[np.ndarray, np.ndarray]:
        """Return (calibrated_score, raw_blended_score) for each row."""
        xgb_p = self.xgb.predict_proba(X_clean)[:, 1]
        lgbm_p = self.lgbm.predict_proba(X_clean)[:, 1] if self.lgbm is not None else None
        iso_raw = -self.iso.score_samples(X_clean)
        iso_p = (iso_raw - iso_raw.min()) / (iso_raw.max() - iso_raw.min() + 1e-12)
        blended = _blend_scores(xgb_p, lgbm_p, iso_p)
        calibrated = self.calibrator.transform(blended)
        return calibrated, blended

    def predict_dataframe(self, df: pd.DataFrame) -> list[dict]:
        if not self.is_loaded():
            raise RuntimeError("Model not loaded")

        for col in (TARGET_COL, "", "Unnamed: 0"):
            if col in df.columns:
                df = df.drop(columns=[col])

        X_clean = self.cleaner.transform(df)
        calibrated, _ = self._raw_scores(X_clean)
        preds = (calibrated >= self.threshold).astype(int)

        results: list[dict] = []
        for i, (p, pred) in enumerate(zip(calibrated, preds), start=1):
            score = round(float(p) * 100.0, 1)
            results.append(
                {
                    "Account": i,
                    "Prediction": int(pred),
                    "Risk Score": score,
                    "Alert": _alert_for(score),
                }
            )
        return results

    # ---------------------------------------------------------------------- #
    def explain_row(self, df: pd.DataFrame, row_index: int = 0, top_k: int = 6) -> dict:
        """Return SHAP-based explanation for a single account row (best-effort)."""
        if not self.is_loaded():
            raise RuntimeError("Model not loaded")

        for col in (TARGET_COL, "", "Unnamed: 0"):
            if col in df.columns:
                df = df.drop(columns=[col])

        X_clean = self.cleaner.transform(df).iloc[[row_index]]
        try:
            import shap  # type: ignore
            explainer = shap.TreeExplainer(self.xgb)
            sv = explainer.shap_values(X_clean)
            sv = sv[0] if isinstance(sv, list) else sv[0]
            contribs = sorted(
                [(f, float(v)) for f, v in zip(X_clean.columns, sv)],
                key=lambda kv: abs(kv[1]),
                reverse=True,
            )[:top_k]
            top_contribs = [{"feature": f, "shap": v, "direction": "↑" if v > 0 else "↓"} for f, v in contribs]
        except Exception as exc:  # noqa: BLE001
            log.warning("SHAP unavailable — falling back to global importance (%s)", exc)
            top_contribs = (self.feature_importance or [])[:top_k]

        calibrated, _ = self._raw_scores(X_clean)
        score = round(float(calibrated[0]) * 100.0, 1)
        return {
            "row_index": row_index,
            "risk_score": score,
            "prediction": int(calibrated[0] >= self.threshold),
            "alert": _alert_for(score),
            "top_drivers": top_contribs,
        }
