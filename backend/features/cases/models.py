"""SQLAlchemy models: analysis runs, cases, append-only audit log.
All store OUTPUTS of the existing pipeline — never model internals."""
from __future__ import annotations

import datetime as dt

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from core.db import Base


def _utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class AnalysisRun(Base):
    __tablename__ = "analysis_runs"

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, default=_utcnow)
    filename = Column(String(255), nullable=True)
    total_accounts = Column(Integer, default=0)
    suspicious_count = Column(Integer, default=0)
    high_risk_count = Column(Integer, default=0)
    avg_risk = Column(Float, default=0.0)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "filename": self.filename,
            "total_accounts": self.total_accounts,
            "suspicious_count": self.suspicious_count,
            "high_risk_count": self.high_risk_count,
            "avg_risk": self.avg_risk,
        }


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True)
    account = Column(String(128), index=True, nullable=False, unique=True)
    risk_score = Column(Float, default=0.0)
    tier = Column(String(32), default="watch")
    prediction = Column(Integer, default=0)
    status = Column(String(32), default="new")
    assignee = Column(String(128), nullable=True)
    recommended_action = Column(String(64), nullable=True)
    last_action = Column(String(64), nullable=True)
    flag_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
    run_id = Column(Integer, ForeignKey("analysis_runs.id"), nullable=True)

    audit = relationship(
        "AuditEntry",
        back_populates="case",
        cascade="all, delete-orphan",
        order_by="AuditEntry.created_at",
    )

    def to_dict(self, include_audit: bool = False) -> dict:
        data = {
            "id": self.id,
            "account": self.account,
            "risk_score": self.risk_score,
            "tier": self.tier,
            "prediction": self.prediction,
            "status": self.status,
            "assignee": self.assignee,
            "recommended_action": self.recommended_action,
            "last_action": self.last_action,
            "flag_count": self.flag_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_audit:
            data["audit"] = [a.to_dict() for a in self.audit]
        return data


class AuditEntry(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True, index=True)
    account = Column(String(128), index=True, nullable=True)
    event_type = Column(String(32))
    detail = Column(Text)
    actor = Column(String(128), default="analyst")
    created_at = Column(DateTime, default=_utcnow)

    case = relationship("Case", back_populates="audit")

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "case_id": self.case_id,
            "account": self.account,
            "event_type": self.event_type,
            "detail": self.detail,
            "actor": self.actor,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }