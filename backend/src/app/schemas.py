from __future__ import annotations

import re
from datetime import date as Date
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

TIME_PATTERN = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


class EntryTypeBase(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    color: str = Field(default="#34699a", max_length=32)


class EntryTypeRead(EntryTypeBase):
    id: str
    created_at: datetime
    updated_at: datetime


class EntryWrite(BaseModel):
    date: Date
    time: str | None = Field(default=None, max_length=5)
    title: str = Field(min_length=1, max_length=160)
    notes: str | None = Field(default=None, max_length=6000)
    entry_type_id: str
    source: str | None = Field(default=None, max_length=80)
    gmail_message_id: str | None = Field(default=None, max_length=255)
    gmail_thread_id: str | None = Field(default=None, max_length=255)
    gmail_query: str | None = Field(default=None, max_length=500)

    @field_validator("time")
    @classmethod
    def validate_time(cls, value: str | None) -> str | None:
        if value in (None, ""):
            return None
        if not TIME_PATTERN.fullmatch(value):
            raise ValueError("time must be HH:MM")
        return value


class EntryWriteByTypeName(BaseModel):
    date: Date
    time: str | None = Field(default=None, max_length=5)
    title: str = Field(min_length=1, max_length=160)
    notes: str | None = Field(default=None, max_length=6000)
    entry_type_name: str = Field(min_length=1, max_length=80)
    source: str | None = Field(default=None, max_length=80)
    gmail_message_id: str | None = Field(default=None, max_length=255)
    gmail_thread_id: str | None = Field(default=None, max_length=255)
    gmail_query: str | None = Field(default=None, max_length=500)

    @field_validator("time")
    @classmethod
    def validate_time(cls, value: str | None) -> str | None:
        return EntryWrite.validate_time(value)


class EntryRead(BaseModel):
    id: str
    date: Date
    time: str | None
    title: str
    notes: str | None
    entry_type_id: str
    entry_type_name: str
    entry_type_color: str
    source: str | None
    gmail_message_id: str | None
    gmail_thread_id: str | None
    gmail_query: str | None
    created_at: datetime
    updated_at: datetime


class BulkEntryCreate(BaseModel):
    entries: list[EntryWrite] = Field(default_factory=list, max_length=100)


class BulkEntryCreateByTypeName(BaseModel):
    entries: list[EntryWriteByTypeName] = Field(default_factory=list, max_length=100)
