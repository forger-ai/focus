from __future__ import annotations

from fastapi import HTTPException
from sqlmodel import Session, select

from app.models import CalendarEntry, EntryType, utcnow
from app.schemas import EntryTypeBase

DEFAULT_ENTRY_TYPES: tuple[tuple[str, str], ...] = (
    ("Summary", "#34699a"),
    ("Appointment", "#2f7d5f"),
    ("Deadline", "#b75d46"),
    ("Important", "#805a9b"),
)


def seed_default_entry_types(session: Session) -> None:
    existing = {row.name for row in session.exec(select(EntryType)).all()}
    changed = False
    for name, color in DEFAULT_ENTRY_TYPES:
        if name in existing:
            continue
        session.add(EntryType(name=name, color=color))
        changed = True
    if changed:
        session.commit()


def list_entry_types(session: Session) -> list[EntryType]:
    return list(session.exec(select(EntryType).order_by(EntryType.name)).all())


def get_entry_type(session: Session, entry_type_id: str) -> EntryType:
    entry_type = session.get(EntryType, entry_type_id)
    if not entry_type:
        raise HTTPException(status_code=404, detail="Entry type not found")
    return entry_type


def get_entry_type_by_name(session: Session, name: str) -> EntryType | None:
    return session.exec(select(EntryType).where(EntryType.name == name)).first()


def create_entry_type(payload: EntryTypeBase, session: Session) -> EntryType:
    name = payload.name.strip()
    if get_entry_type_by_name(session, name):
        raise HTTPException(status_code=409, detail="Entry type already exists")
    entry_type = EntryType(name=name, color=payload.color)
    session.add(entry_type)
    session.commit()
    session.refresh(entry_type)
    return entry_type


def update_entry_type(entry_type_id: str, payload: EntryTypeBase, session: Session) -> EntryType:
    entry_type = get_entry_type(session, entry_type_id)
    name = payload.name.strip()
    existing = get_entry_type_by_name(session, name)
    if existing and existing.id != entry_type.id:
        raise HTTPException(status_code=409, detail="Entry type already exists")
    entry_type.name = name
    entry_type.color = payload.color
    entry_type.updated_at = utcnow()
    session.add(entry_type)
    session.commit()
    session.refresh(entry_type)
    return entry_type


def delete_entry_type(entry_type_id: str, session: Session) -> dict[str, bool]:
    entry_type = get_entry_type(session, entry_type_id)
    remaining = [row for row in list_entry_types(session) if row.id != entry_type.id]
    if not remaining:
        raise HTTPException(status_code=409, detail="At least one entry type is required")
    summary = get_entry_type_by_name(session, "Summary")
    replacement = summary if summary and summary.id != entry_type.id else remaining[0]
    entries = session.exec(
        select(CalendarEntry).where(CalendarEntry.entry_type_id == entry_type.id)
    ).all()
    for entry in entries:
        entry.entry_type_id = replacement.id
        entry.updated_at = utcnow()
        session.add(entry)
    session.delete(entry_type)
    session.commit()
    return {"success": True}
