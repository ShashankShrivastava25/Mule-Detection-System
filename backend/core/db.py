"""Database layer for the case-management feature. Independent of the ML pipeline.
Reads DATABASE_URL (Neon in production); falls back to local SQLite if absent."""
from __future__ import annotations

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


def _normalise_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url


DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if DATABASE_URL:
    ENGINE = create_engine(
        _normalise_url(DATABASE_URL),
        pool_pre_ping=True,
        pool_recycle=300,
    )
else:
    ENGINE = create_engine(
        "sqlite:///muleguard_cases.db",
        connect_args={"check_same_thread": False},
    )

SessionLocal = sessionmaker(bind=ENGINE, autoflush=False, autocommit=False)
Base = declarative_base()


def init_db() -> None:
    """Create tables if they don't exist. Idempotent."""
    from features.cases import models  # noqa: F401
    Base.metadata.create_all(bind=ENGINE)