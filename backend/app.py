"""Flask app factory — registers each feature blueprint.

Run with `python app.py` (development) or via a WSGI server pointed at `create_app()`.
"""

from __future__ import annotations

import logging

from flask import Flask, jsonify
from flask_cors import CORS

from core.config import settings
from core.logging_setup import configure_logging
from core.registry import MODEL
from core.db import init_db
from features.cases import bp as cases_bp
from features.explain import bp as explain_bp
from features.health import bp as health_bp
from features.metrics import bp as metrics_bp
from features.predict import bp as predict_bp
from features.retrain import bp as retrain_bp
from features.stream import bp as stream_bp
from features.stream import bp as stream_bp
from features.alerts import bp as alerts_bp

configure_logging()
log = logging.getLogger("app")


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = settings.max_upload_mb * 1024 * 1024
    CORS(app, resources={r"/*": {"origins": list(settings.cors_origins)}})

    app.register_blueprint(health_bp)
    app.register_blueprint(metrics_bp)
    app.register_blueprint(predict_bp)
    app.register_blueprint(retrain_bp)
    app.register_blueprint(explain_bp)
    app.register_blueprint(cases_bp)
    app.register_blueprint(stream_bp)
    app.register_blueprint(alerts_bp)
    try:
        init_db()
    except Exception as exc:
        log.warning("Case-management DB init failed: %s", exc)

    @app.errorhandler(413)
    def too_large(_):
        return jsonify({"error": "Uploaded file too large."}), 413

    return app


if __name__ == "__main__":
    log.info("Booting Fraud Intelligence API...")
    MODEL.load()
    app = create_app()
    app.run(host=settings.host, port=settings.port, debug=settings.debug)
