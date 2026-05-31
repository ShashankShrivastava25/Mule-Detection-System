---
title: Mule Detection System API
emoji: 🛡️
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
---

# Mule Detection System — Backend API

Flask + ensemble ML backend (XGBoost, LightGBM, IsolationForest) for mule-account
fraud detection. Frontend is hosted separately on Vercel.

# Backend — Fraud Intelligence API

Flask + XGBoost service that powers the dashboard.

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET  | `/health`  | Liveness + model status |
| GET  | `/metrics` | Last training metrics + confusion matrix + feature importance |
| POST | `/predict` | Accepts a CSV (`file=...`), returns predictions |

## Run

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

First boot trains on `~/Downloads/DataSet.csv` and writes artifacts to `backend/artifacts/`. Subsequent boots just load.

To force a retrain: delete `backend/artifacts/` and restart.

## Smoke test
```bash
curl -F "file=@$HOME/Downloads/DataSet.csv" http://127.0.0.1:5000/predict | jq '.suspicious_accounts_detected, .processing_ms'
```
