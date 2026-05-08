from __future__ import annotations

from datetime import date as Date

from fastapi import HTTPException
from sqlmodel import Session, select

from app.models import CalendarEntry, EntryType, utcnow
from app.schemas import BulkEntryCreate, BulkEntryCreateByTypeName, EntryRead, EntryWrite
from app.services.entry_types import get_entry_type, get_entry_type_by_name


def entry_sort_key(entry: CalendarEntry) -> tuple[str, int, str, str]:
    return (
        entry.date.isoformat(),
        0 if entry.time is None else 1,
        entry.time or "",
        entry.created_at.isoformat(),
    )


def serialize_entry(session: Session, entry: CalendarEntry) -> EntryRead:
    entry_type = session.get(EntryType, entry.entry_type_id)
    if not entry_type:
        raise HTTPException(status_code=409, detail="Entry type missing")
    return EntryRead(
        id=entry.id,
        date=entry.date,
        time=entry.time,
        title=entry.title,
        notes=entry.notes,
        entry_type_id=entry.entry_type_id,
        entry_type_name=entry_type.name,
        entry_type_color=entry_type.color,
        source=entry.source,
        gmail_message_id=entry.gmail_message_id,
        gmail_thread_id=entry.gmail_thread_id,
        gmail_query=entry.gmail_query,
        created_at=entry.created_at,
        updated_at=entry.updated_at,
    )


def list_entries(
    session: Session,
    *,
    start: Date | None = None,
    end: Date | None = None,
    entry_type_id: str | None = None,
) -> list[EntryRead]:
    statement = select(CalendarEntry)
    if start:
        statement = statement.where(CalendarEntry.date >= start)
    if end:
        statement = statement.where(CalendarEntry.date <= end)
    if entry_type_id:
        statement = statement.where(CalendarEntry.entry_type_id == entry_type_id)
    rows = list(session.exec(statement).all())
    rows.sort(key=entry_sort_key)
    return [serialize_entry(session, row) for row in rows]


def get_entry(entry_id: str, session: Session) -> EntryRead:
    entry = session.get(CalendarEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    return serialize_entry(session, entry)


def _is_summary_type(entry_type: EntryType) -> bool:
    return entry_type.name.strip().casefold() == "summary"


def _ensure_summary_is_unique(
    session: Session,
    *,
    entry_type: EntryType,
    date: Date,
    current_entry_id: str | None = None,
) -> None:
    if not _is_summary_type(entry_type):
        return
    statement = select(CalendarEntry).where(
        CalendarEntry.entry_type_id == entry_type.id,
        CalendarEntry.date == date,
    )
    existing = session.exec(statement).first()
    if existing and existing.id != current_entry_id:
        raise HTTPException(
            status_code=409,
            detail="A Summary entry already exists for this date",
        )


def _apply(entry: CalendarEntry, payload: EntryWrite, entry_type: EntryType) -> None:
    entry.date = payload.date
    entry.time = None if _is_summary_type(entry_type) else payload.time
    entry.title = payload.title.strip()
    entry.notes = payload.notes
    entry.entry_type_id = entry_type.id
    entry.source = payload.source
    entry.gmail_message_id = payload.gmail_message_id
    entry.gmail_thread_id = payload.gmail_thread_id
    entry.gmail_query = payload.gmail_query
    entry.updated_at = utcnow()


def create_entry(payload: EntryWrite, session: Session) -> EntryRead:
    entry_type = get_entry_type(session, payload.entry_type_id)
    _ensure_summary_is_unique(session, entry_type=entry_type, date=payload.date)
    entry = CalendarEntry(
        date=payload.date,
        time=None if _is_summary_type(entry_type) else payload.time,
        title=payload.title.strip(),
        notes=payload.notes,
        entry_type_id=entry_type.id,
        source=payload.source,
        gmail_message_id=payload.gmail_message_id,
        gmail_thread_id=payload.gmail_thread_id,
        gmail_query=payload.gmail_query,
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return serialize_entry(session, entry)


def update_entry(entry_id: str, payload: EntryWrite, session: Session) -> EntryRead:
    entry_type = get_entry_type(session, payload.entry_type_id)
    entry = session.get(CalendarEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    _ensure_summary_is_unique(
        session,
        entry_type=entry_type,
        date=payload.date,
        current_entry_id=entry.id,
    )
    _apply(entry, payload, entry_type)
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return serialize_entry(session, entry)


def delete_entry(entry_id: str, session: Session) -> dict[str, bool]:
    entry = session.get(CalendarEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    session.delete(entry)
    session.commit()
    return {"success": True}


def bulk_create_entries(payload: BulkEntryCreate, session: Session) -> list[EntryRead]:
    created: list[EntryRead] = []
    for item in payload.entries:
        created.append(create_entry(item, session))
    return created


def bulk_create_entries_by_type_name(
    payload: BulkEntryCreateByTypeName, session: Session
) -> list[EntryRead]:
    created: list[EntryRead] = []
    for item in payload.entries:
        entry_type = get_entry_type_by_name(session, item.entry_type_name.strip())
        if not entry_type:
            raise HTTPException(
                status_code=404,
                detail=f"Entry type not found: {item.entry_type_name}",
            )
        created.append(
            create_entry(
                EntryWrite(
                    date=item.date,
                    time=item.time,
                    title=item.title,
                    notes=item.notes,
                    entry_type_id=entry_type.id,
                    source=item.source,
                    gmail_message_id=item.gmail_message_id,
                    gmail_thread_id=item.gmail_thread_id,
                    gmail_query=item.gmail_query,
                ),
                session,
            )
        )
    return created
