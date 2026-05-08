from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.database import get_session
from app.models import EntryType
from app.schemas import EntryTypeBase, EntryTypeRead
from app.services.entry_types import (
    create_entry_type,
    delete_entry_type,
    list_entry_types,
    update_entry_type,
)

router = APIRouter(prefix="/entry-types", tags=["entry-types"])


@router.get("", response_model=list[EntryTypeRead])
def list_entry_types_route(session: Session = Depends(get_session)) -> list[EntryType]:
    return list_entry_types(session)


@router.post("", response_model=EntryTypeRead)
def create_entry_type_route(
    payload: EntryTypeBase, session: Session = Depends(get_session)
) -> EntryType:
    return create_entry_type(payload, session)


@router.put("/{entry_type_id}", response_model=EntryTypeRead)
def update_entry_type_route(
    entry_type_id: str,
    payload: EntryTypeBase,
    session: Session = Depends(get_session),
) -> EntryType:
    return update_entry_type(entry_type_id, payload, session)


@router.delete("/{entry_type_id}")
def delete_entry_type_route(
    entry_type_id: str, session: Session = Depends(get_session)
) -> dict[str, bool]:
    return delete_entry_type(entry_type_id, session)
