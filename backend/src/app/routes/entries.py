from __future__ import annotations

from datetime import date as Date

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.database import get_session
from app.schemas import BulkEntryCreate, EntryRead, EntryWrite
from app.services.entries import (
    bulk_create_entries,
    create_entry,
    delete_entry,
    get_entry,
    list_entries,
    update_entry,
)

router = APIRouter(prefix="/entries", tags=["entries"])


@router.get("", response_model=list[EntryRead])
def list_entries_route(
    start: Date | None = Query(default=None),
    end: Date | None = Query(default=None),
    entry_type_id: str | None = Query(default=None),
    session: Session = Depends(get_session),
) -> list[EntryRead]:
    return list_entries(
        session,
        start=start,
        end=end,
        entry_type_id=entry_type_id,
    )


@router.post("", response_model=EntryRead)
def create_entry_route(payload: EntryWrite, session: Session = Depends(get_session)) -> EntryRead:
    return create_entry(payload, session)


@router.post("/bulk", response_model=list[EntryRead])
def bulk_create_entries_route(
    payload: BulkEntryCreate, session: Session = Depends(get_session)
) -> list[EntryRead]:
    return bulk_create_entries(payload, session)


@router.get("/{entry_id}", response_model=EntryRead)
def get_entry_route(entry_id: str, session: Session = Depends(get_session)) -> EntryRead:
    return get_entry(entry_id, session)


@router.put("/{entry_id}", response_model=EntryRead)
def update_entry_route(
    entry_id: str, payload: EntryWrite, session: Session = Depends(get_session)
) -> EntryRead:
    return update_entry(entry_id, payload, session)


@router.delete("/{entry_id}")
def delete_entry_route(entry_id: str, session: Session = Depends(get_session)) -> dict[str, bool]:
    return delete_entry(entry_id, session)
