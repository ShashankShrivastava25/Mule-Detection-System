"""Centralised runtime configuration."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    backend_dir: Path = Path(__file__).resolve().parent.parent
    project_root: Path = Path(__file__).resolve().parent.parent.parent
    artifacts_dir: Path = Path(__file__).resolve().parent.parent / "artifacts"

    host: str = os.getenv("API_HOST", "0.0.0.0")
    port: int = int(os.getenv("API_PORT", "5000"))
    debug: bool = os.getenv("API_DEBUG", "0") == "1"
    max_upload_mb: int = int(os.getenv("API_MAX_UPLOAD_MB", "200"))

    cors_origins: tuple[str, ...] = ("*",)

    target_col: str = "F3924"


settings = Settings()
settings.artifacts_dir.mkdir(parents=True, exist_ok=True)
