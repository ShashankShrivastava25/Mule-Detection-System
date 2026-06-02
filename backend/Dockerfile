FROM python:3.11-slim

WORKDIR /app

# System libs needed by XGBoost / LightGBM (OpenMP runtime)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Writable cache dirs (SHAP/numba/matplotlib write here at runtime)
ENV NUMBA_CACHE_DIR=/tmp/numba
ENV MPLCONFIGDIR=/tmp/mpl
ENV HF_HOME=/tmp/hf

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7860

CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "300", "--workers", "1", "--threads", "4", "app:create_app()"]