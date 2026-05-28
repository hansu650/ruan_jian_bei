from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.core.config import get_settings
from app.db.database import engine, init_db
from app.db.seed import seed_default_data
from app.routers import (
    agent_runs,
    courses,
    documents,
    generated_resources,
    health,
    knowledge_points,
    learning_paths,
    llm,
    meta,
    profile_drafts,
    profiles,
    resource_items,
    students,
    tutor,
)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    with Session(engine) as session:
        seed_default_data(session)
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=f"{settings.app_display_name} API",
        description="EduForge 智学工坊后端基础服务",
        version="0.9.0",
        lifespan=lifespan,
    )

    allowed_origins = {
        settings.frontend_origin,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    }
    app.add_middleware(
        CORSMiddleware,
        allow_origins=sorted(allowed_origins),
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(meta.router)
    app.include_router(llm.router)
    app.include_router(students.router)
    app.include_router(courses.router)
    app.include_router(documents.router)
    app.include_router(profiles.router)
    app.include_router(learning_paths.router)
    app.include_router(generated_resources.router)
    app.include_router(tutor.router)
    app.include_router(agent_runs.router)
    app.include_router(knowledge_points.router)
    app.include_router(profile_drafts.router)
    app.include_router(resource_items.router)
    return app


app = create_app()
