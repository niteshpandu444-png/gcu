"""FastAPI application entry point.

Run: python -m uvicorn app.main:app --reload --port 8000
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401  (registers all tables on Base.metadata)
from app.api import agent_actions, auth, charter, contributions, escrow, members, milestones, projects, reviews
from app.config import get_settings
from app.database import Base, engine

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables at startup (hackathon: no migrations)."""
    Base.metadata.create_all(bind=engine)
    yield
    engine.dispose()


app = FastAPI(
    title=settings.app_name,
    description="GCU — Collaborative Research Ecosystem backend (hackathon prototype).",
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(members.router)
app.include_router(charter.router)
app.include_router(milestones.router)
app.include_router(contributions.router)
app.include_router(agent_actions.router)
app.include_router(reviews.router)
app.include_router(escrow.router)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok", "project": "GCU"}
