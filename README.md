# AI Fraud Intelligence Command Center

Hackathon submission for the **AI/ML-Based Classification of Suspicious Mule Accounts** challenge — built as a production-style fintech surveillance platform.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Vite + React + Tailwind + Framer Motion + GSAP + Three.js           │
│      ⇄ /predict /metrics /health /retrain /explain (JSON)            │
│  Flask + (XGBoost + LightGBM + IsolationForest + Calibration)        │
│      ⇄ DataCleaner transform · F2-tuned threshold                    │
└──────────────────────────────────────────────────────────────────────┘
```

## Highlights

- **Landing page** with a Three.js 3D fraud-network hero, GSAP scroll-reveals, and a four-step pipeline walkthrough.
- **Dashboard** with eleven panels: KPI cards, drag-drop upload, sortable risk table, live alert center, anomaly charts, AI-insights panel, confusion matrix, feature importance, system status, and footer.
- **Modular backend** (`core/` + `features/{health,predict,metrics,retrain,explain}/` + `ml/`) with a real ML ensemble (XGBoost + LightGBM + IsolationForest), probability calibration, and F2-optimised threshold.
- **DataCleaner pipeline** that drops ~1,500 junk columns (fully-NaN, constant, duplicate, high-missing, near-zero variance), winsorises outliers, and robust-scales the rest.
- **Explainable AI** layer — raw `F1`..`F3924` IDs are translated into "Behavioral Indicator N", "Velocity Anomaly Marker", etc.

## Project layout

> **Dataset is not bundled.** Keep `DataSet.csv` in `~/Downloads/` (its desired location);
> the backend reads it from there. `data/`, `*.csv`, `*.csv.gz` are all in `.gitignore`.

```
shashank/
├── .claude/agents/                  # frontend / backend / uiux-animator subagent skills
├── backend/
│   ├── app.py                          # Flask app factory + blueprint registration
│   ├── core/
│   │   ├── config.py                   # Settings dataclass
│   │   ├── logging_setup.py
│   │   └── registry.py                 # MODEL singleton + ensure_model_loaded()
│   ├── features/
│   │   ├── health/   (routes.py)       # GET /health  GET /ready
│   │   ├── metrics/  (routes.py)       # GET /metrics
│   │   ├── predict/  (routes.py, service.py, schemas.py)  # POST /predict
│   │   ├── explain/  (routes.py, service.py)              # explainability endpoints
│   │   └── retrain/  (routes.py)       # POST /retrain
│   ├── ml/
│   │   ├── cleaner.py                  # DataCleaner transformer (fit/transform/manifest)
│   │   └── model.py                    # FraudModel: ensemble + calibration + threshold
│   ├── profile_dataset.py              # data-quality audit CLI
│   ├── clean_dataset.py                # fits DataCleaner and writes cleaned CSV
│   └── requirements.txt
└── frontend/
    ├── package.json                    # React 18, Vite, Tailwind, Framer Motion,
    │                                   # GSAP, Three.js + R3F + drei, react-router-dom
    └── src/
        ├── App.jsx                     # router shell — / → Landing, /dashboard → Dashboard
        ├── routes/
        │   ├── Landing.jsx
        │   └── Dashboard.jsx
        ├── features/
        │   ├── landing/
        │   │   ├── components/         # Hero, FeatureGrid, HowItWorks, Stats, CTA, navbar/footer
        │   │   ├── three/Hero3D.jsx    # rotating shield + fraud-network particles + connections
        │   │   └── animations/useGsapReveal.js
        │   └── dashboard/
        │       ├── components/         # the 11 dashboard panels
        │       ├── hooks/              # (placeholder for future hooks)
        │       └── lib/                # api.js, risk.js, interpretations.js
        └── shared/
            ├── components/CountUp.jsx
            ├── hooks/useReducedMotion.js
            └── three/ParticleField.jsx # ambient particle backdrop for the dashboard
```

## Run it

### 1 · Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Optional: profile + clean the dataset before training
python profile_dataset.py
python clean_dataset.py

python app.py
```

First boot trains the ensemble (XGBoost + LightGBM + IsolationForest), calibrates probabilities, and tunes a recall-weighted (F2) threshold. Artifacts cache to `backend/artifacts/`.

Smoke tests:
```bash
curl http://127.0.0.1:5000/health
curl http://127.0.0.1:5000/ready
curl -F "file=@$HOME/Downloads/DataSet.csv" http://127.0.0.1:5000/predict | jq '.suspicious_accounts_detected, .processing_ms'
```

### 2 · Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — you land on the marketing-style landing page with the 3D fraud-network shield. Click **Launch Command Center** to enter `/dashboard` and drop your CSV.

## API contract

| Method | Path | Notes |
|---|---|---|
| GET  | `/health`   | Liveness — does not require model |
| GET  | `/ready`    | True once ensemble + cleaner are loaded |
| GET  | `/metrics`  | Cached metrics + confusion matrix + top-25 importances |
| POST | `/predict`  | Form `file=...csv` → predictions + metrics + matrix + importances + timing |
| POST | `/retrain`  | Force retrain on the resolved dataset |
| GET  | `/explain/*`| SHAP / influence breakdowns (see `features/explain/`) |

`/predict` response shape (subset):
```json
{
  "total_accounts_analyzed": 500,
  "suspicious_accounts_detected": 81,
  "high_risk_alerts": 69,
  "average_risk_score": 14.2,
  "results": [
    { "Account": 1, "Prediction": 1, "Risk Score": 92.3, "Alert": "High-risk mule account detected" }
  ],
  "model_metrics": { "accuracy": 0.98, "precision": 0.92, "recall": 0.85, "f1": 0.88, "f2": 0.86 },
  "confusion_matrix": { "tp": 69, "fp": 6, "tn": 8995, "fn": 12 },
  "feature_importance": [ { "feature": "F123", "importance": 0.084 } ],
  "processing_ms": 1234
}
```

## ML pipeline at a glance

1. **DataCleaner.fit** on training data
   - Drop fully-NaN, constant, exact-duplicate, >80% missing, near-zero variance.
   - Median-impute survivors, winsorise at 1st/99th percentile, RobustScale.
2. **Ensemble training**
   - XGBoost (`scale_pos_weight`, depth 6, AUCPR objective)
   - LightGBM (balanced class weight, 63 leaves)
   - IsolationForest (anomaly signal blended at 20%)
3. **Probability calibration** via `CalibratedClassifierCV` (sigmoid).
4. **Threshold tuning** to maximise F2 (recall-weighted) on the held-out split.
5. **Risk Score** = calibrated probability × 100, rounded to 0.1.

## Dashboard sections

1. Top Navbar — title, online status pulse, alert bell, admin avatar
2. Hero Analytics — 5 animated KPI cards (Total, Suspicious, High-Risk, Avg Risk, Accuracy)
3. Dataset Upload — drag-drop CSV with live progress + pipeline visualisation
4. Fraud Risk Table — sortable / searchable / filterable, gradient risk bars per row
5. AI Alert Center — live-feed of suspicious accounts, severity-coloured
6. Anomaly Charts — donut + bar + line (tier mix, distribution, rolling avg)
7. AI Behavioral Insights — explainable narrative (no raw feature IDs)
8. System Status — API · Model · Engine · Dataset health
9. Confusion Matrix — TP/FP/FN/TN + accuracy/precision/recall/F1/F2
10. Feature Importance — top-10 horizontal bars with humanised labels
11. Footer — system tagline + version

## Landing-page sections

- 3D **Hero** — rotating icosahedron shield surrounded by a particle fraud network with edges between nearby nodes; ~5% of nodes pulse red ("suspicious"). GSAP reveals on copy.
- **Stats** — count-up KPIs (9,082 accounts profiled, 81 mules flagged, 98.4% accuracy, 1,500+ junk features auto-removed)
- **Capabilities** — 8-card grid with accent-coloured icons
- **How It Works** — 4-step pipeline (Upload → Clean → Score → Surface)
- **CTA** — gradient panel routing to `/dashboard`
- **Footer** — same tagline as the dashboard

## Design system

Tokens (Tailwind extensions in `tailwind.config.js`):
- `bg-0` `#05070d`, `bg-1` `#0a0e1a`, `bg-2` `#10172a`
- Accents: `neon-cyan #00e0ff`, `neon-violet #a855f7`, `neon-emerald #22c55e`, `neon-amber #facc15`, `neon-orange #f97316`, `neon-red #ef4444`
- Shadows: `shadow-glow-cyan / violet / red / emerald`
- Backgrounds: `bg-grid-faint`
- Animations: `pulse-slow`, `scan`
- Typography: Inter (sans), JetBrains Mono (numbers)

Motion (Framer Motion + GSAP):
- Apple-easing `cubic-bezier(0.22, 1, 0.36, 1)`
- 60ms stagger between sibling children
- Count-up numbers on first paint
- Recharts draw-in animations (~900ms)
- GSAP scroll-triggered `[data-reveal]` reveals on landing
- `prefers-reduced-motion` honoured globally

## Subagent skills

Three project-local subagents under `.claude/agents/`:

| Agent | Use it for |
|---|---|
| `frontend-engineer` | All `frontend/` work — components, Tailwind, motion, charts |
| `backend-engineer`  | Flask, XGBoost / LightGBM / IsoForest, preprocessing, metrics |
| `uiux-animator`     | Tokens, micro-interactions, accessibility, choreography |
