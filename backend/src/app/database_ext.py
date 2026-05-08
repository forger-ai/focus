from __future__ import annotations

from sqlmodel import Session

from app import models as _models  # noqa: F401 - register SQLModel metadata
from app.database import engine, init_db
from app.services.entry_types import seed_default_entry_types


def init_app_db() -> None:
    init_db()
    with Session(engine) as session:
        seed_default_entry_types(session)
