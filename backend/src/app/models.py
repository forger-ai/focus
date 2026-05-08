from __future__ import annotations

from datetime import UTC, datetime
from datetime import date as Date
from uuid import uuid4

from sqlmodel import Field, SQLModel


def utcnow() -> datetime:
    return datetime.now(UTC)


class EntryType(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str = Field(index=True, unique=True, min_length=1, max_length=80)
    color: str = Field(default="#34699a", max_length=32)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)


class CalendarEntry(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    date: Date = Field(index=True)
    time: str | None = Field(default=None, index=True, max_length=5)
    title: str = Field(index=True, min_length=1, max_length=160)
    notes: str | None = Field(default=None, max_length=6000)
    entry_type_id: str = Field(foreign_key="entrytype.id", index=True)
    source: str | None = Field(default=None, index=True, max_length=80)
    gmail_message_id: str | None = Field(default=None, index=True, max_length=255)
    gmail_thread_id: str | None = Field(default=None, index=True, max_length=255)
    gmail_query: str | None = Field(default=None, max_length=500)
    created_at: datetime = Field(default_factory=utcnow)
    updated_at: datetime = Field(default_factory=utcnow)
