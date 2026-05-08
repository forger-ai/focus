from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.cors import allowed_origins
from app.database_ext import init_app_db
from app.health import router as health_router
from app.routes.entries import router as entries_router
from app.routes.entry_types import router as entry_types_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="Focus API",
        version="0.1.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix="/api")
    app.include_router(entry_types_router, prefix="/api")
    app.include_router(entries_router, prefix="/api")

    @app.on_event("startup")
    def on_startup() -> None:
        init_app_db()

    return app


app = create_app()
