"""External fraud-alert ingestion model.

Stores regulatory / cyber-fraud / TMS alerts ingested into the platform and
records whether each matched an already-detected mule account. Operates only
on account identifiers and existing case data — independent of the ML pipeline
and of any specific input-dataset feature columns, so it works on any scored
dataset.
"""
from __future__ import annotations

import datetime as dt

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text

from core.db import Base


def _utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class ExternalAlert(Base):
    __tablename__ = "external_alerts"

    id = Column(Integer, primary_key=True)
    complaint_id = Column(String(128), nullable=True)
    account = Column(String(128), index=True, nullable=False)
    source = Column(String(64), default="Manual")
    amount = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    matched = Column(Boolean, default=False)
    matched_case_id = Column(Integer, nullable=True)   # soft reference to cases.id
    matched_risk = Column(Float, nullable=True)
    status = Column(String(32), default="watchlist")   # "matched" | "watchlist"
    created_at = Column(DateTime, default=_utcnow)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "complaint_id": self.complaint_id,
            "account": self.account,
            "source": self.source,
            "amount": self.amount,
            "description": self.description,
            "matched": self.matched,
            "matched_case_id": self.matched_case_id,
            "matched_risk": self.matched_risk,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }