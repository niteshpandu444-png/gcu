"""SQLAlchemy engine, session factory and declarative base."""

from datetime import UTC, datetime

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings

settings = get_settings()

connect_args: dict[str, object] = (
    {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}
)

engine = create_engine(settings.database_url, connect_args=connect_args)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


class Base(DeclarativeBase):
    """Base class for all ORM models."""


def get_db():
    """FastAPI dependency that yields a scoped database session."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def utcnow() -> datetime:
    """Naive UTC timestamp (SQLite stores datetimes without timezone info)."""
    return datetime.now(UTC).replace(tzinfo=None)


def ensure_columns() -> None:
    """Hackathon-grade schema patching: add columns that exist in the models
    but are missing from an already-created SQLite database (no Alembic).
    """
    inspector = inspect(engine)
    if "projects" not in inspector.get_table_names():
        return
    existing = {column["name"] for column in inspector.get_columns("projects")}
    with engine.begin() as connection:
        if "code" not in existing:
            connection.execute(text("ALTER TABLE projects ADD COLUMN code VARCHAR(50)"))
