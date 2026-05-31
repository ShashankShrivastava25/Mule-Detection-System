import time

from flask import Blueprint, jsonify

from core.registry import MODEL
from ml.model import train_and_persist

bp = Blueprint("retrain", __name__)


@bp.post("/retrain")
def retrain():
    t0 = time.time()
    train_and_persist()
    MODEL.load()
    return jsonify({"status": "retrained", "took_ms": int((time.time() - t0) * 1000)})
