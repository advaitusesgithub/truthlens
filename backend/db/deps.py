from typing import Generator

from db.session import SessionLocal


def get_db() -> Generator:
    """FastAPI dependency that yields a SQLAlchemy session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
