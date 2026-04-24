# # backend/db/models.py

# from sqlalchemy import Column, String, Float, DateTime
# from datetime import datetime
# import uuid

# from db.session import Base


# class ScanResult(Base):
#     __tablename__ = "scan_results"

#     id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
#     media_type = Column(String)
#     verdict = Column(String)
#     confidence = Column(Float)
#     source_domain = Column(String, nullable=True)
#     created_at = Column(DateTime, default=datetime.utcnow)

import uuid
from datetime import datetime

from sqlalchemy import Column, String, Float, DateTime

from db.session import Base


class ScanResult(Base):
    __tablename__ = "scan_results"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    media_type = Column(String, nullable=False)       # "image" | "video" | "audio"
    verdict = Column(String, nullable=False)           # "fake" | "real" | "uncertain"
    confidence = Column(Float, nullable=False)
    source_domain = Column(String, nullable=True)      # optional, from extension
    created_at = Column(DateTime, default=datetime.utcnow)
