# from fastapi import APIRouter, Depends
# from sqlalchemy.orm import Session

# from db.session import SessionLocal
# from db.models import ScanResult

# router = APIRouter()


# # Dependency
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


# # =========================
# # SUBMIT REPORT
# # =========================
# @router.post("/report/submit")
# def submit_report(
#     media_type: str,
#     verdict: str,
#     confidence: float,
#     source_domain: str = None,
#     db: Session = Depends(get_db)
# ):
#     new_entry = ScanResult(
#         media_type=media_type,
#         verdict=verdict,
#         confidence=confidence,
#         source_domain=source_domain
#     )

#     db.add(new_entry)
#     db.commit()

#     return {"message": "Report saved"}


# # =========================
# # GET FEED
# # =========================
# @router.get("/reports/feed")
# def get_feed(db: Session = Depends(get_db)):
#     results = db.query(ScanResult)\
#         .order_by(ScanResult.created_at.desc())\
#         .limit(50)\
#         .all()

#     return results

"""
Community feed routes
──────────────────────
POST /report/submit   Save an anonymous scan result
GET  /reports/feed    Return last 50 results (newest first)
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db.deps import get_db
from db.models import ScanResult

router = APIRouter(tags=["reports"])


# ── Pydantic schemas ─────────────────────────────────────────────────

class ReportSubmit(BaseModel):
    media_type: str          # "image" | "video" | "audio"
    verdict: str             # "fake" | "real" | "uncertain"
    confidence: float
    source_domain: Optional[str] = None


class ReportOut(BaseModel):
    id: str
    media_type: str
    verdict: str
    confidence: float
    source_domain: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True   # Pydantic v2 (replaces orm_mode)


class FeedResponse(BaseModel):
    reports: List[ReportOut]
    total: int


# ── Routes ───────────────────────────────────────────────────────────

@router.post("/report/submit", response_model=ReportOut, status_code=201)
def submit_report(
    body: ReportSubmit,
    db: Session = Depends(get_db),
):
    """
    Manually submit a scan result to the community feed.
    (The /detect/* endpoints also call this automatically.)
    """
    if body.media_type not in ("image", "video", "audio"):
        raise HTTPException(status_code=422, detail="media_type must be image, video, or audio")
    if body.verdict not in ("fake", "real", "uncertain"):
        raise HTTPException(status_code=422, detail="verdict must be fake, real, or uncertain")
    if not (0.0 <= body.confidence <= 1.0):
        raise HTTPException(status_code=422, detail="confidence must be between 0.0 and 1.0")

    entry = ScanResult(
        media_type=body.media_type,
        verdict=body.verdict,
        confidence=body.confidence,
        source_domain=body.source_domain,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/reports/feed", response_model=FeedResponse)
def get_feed(
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Return the most recent scan results (default: 50)."""
    limit = min(limit, 200)   # hard cap
    results = (
        db.query(ScanResult)
        .order_by(ScanResult.created_at.desc())
        .limit(limit)
        .all()
    )
    total = db.query(ScanResult).count()
    return {"reports": results, "total": total}


@router.get("/reports/stats")
def get_stats(db: Session = Depends(get_db)):
    """Quick summary stats for the community feed dashboard."""
    total = db.query(ScanResult).count()
    fake_count = db.query(ScanResult).filter(ScanResult.verdict == "fake").count()
    real_count = db.query(ScanResult).filter(ScanResult.verdict == "real").count()
    by_type = {}
    for media_type in ("image", "video", "audio"):
        by_type[media_type] = (
            db.query(ScanResult)
            .filter(ScanResult.media_type == media_type)
            .count()
        )
    return {
        "total_scans": total,
        "fake_count": fake_count,
        "real_count": real_count,
        "by_media_type": by_type,
    }
