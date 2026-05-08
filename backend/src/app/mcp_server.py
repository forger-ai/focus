from __future__ import annotations

from datetime import date as Date
from typing import Any

from fastapi import HTTPException
from sqlmodel import Session

from app.database import engine
from app.database_ext import init_app_db
from app.mcp_runtime import ToolError, ToolRegistry, main
from app.schemas import BulkEntryCreate, BulkEntryCreateByTypeName, EntryTypeBase, EntryWrite
from app.services.entries import (
    bulk_create_entries as bulk_create_entries_service,
)
from app.services.entries import (
    bulk_create_entries_by_type_name as bulk_create_entries_by_type_name_service,
)
from app.services.entries import (
    create_entry as create_entry_service,
)
from app.services.entries import (
    delete_entry as delete_entry_service,
)
from app.services.entries import (
    get_entry as get_entry_service,
)
from app.services.entries import (
    list_entries as list_entries_service,
)
from app.services.entries import (
    update_entry as update_entry_service,
)
from app.services.entry_types import (
    create_entry_type as create_entry_type_service,
)
from app.services.entry_types import (
    delete_entry_type as delete_entry_type_service,
)
from app.services.entry_types import (
    list_entry_types as list_entry_types_service,
)
from app.services.entry_types import (
    update_entry_type as update_entry_type_service,
)

registry = ToolRegistry()


def _dump(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    return value


def _tool_error(exc: HTTPException) -> ToolError:
    code = "not_found" if exc.status_code == 404 else "invalid_input"
    if exc.status_code == 409:
        code = "conflict"
    return ToolError(str(exc.detail), code=code)


def _parse_date(value: object, name: str) -> Date:
    if not isinstance(value, str):
        raise ToolError(f"{name} must be an ISO date", code="invalid_input")
    try:
        return Date.fromisoformat(value)
    except ValueError as exc:
        raise ToolError(f"{name} must be an ISO date", code="invalid_input") from exc


@registry.tool(
    "list_entries",
    "List Focus calendar entries, optionally filtered by date range and entry type.",
    {
        "type": "object",
        "properties": {
            "start": {"type": "string"},
            "end": {"type": "string"},
            "entry_type_id": {"type": "string"},
        },
        "additionalProperties": False,
    },
)
def list_entries(args: dict[str, Any]) -> dict[str, Any]:
    init_app_db()
    start = _parse_date(args["start"], "start") if "start" in args else None
    end = _parse_date(args["end"], "end") if "end" in args else None
    entry_type_id = (
        args.get("entry_type_id") if isinstance(args.get("entry_type_id"), str) else None
    )
    with Session(engine) as session:
        entries = list_entries_service(
            session,
            start=start,
            end=end,
            entry_type_id=entry_type_id,
        )
        return {"success": True, "entries": [_dump(entry) for entry in entries]}


@registry.tool(
    "get_entry",
    "Get one Focus calendar entry.",
    {
        "type": "object",
        "properties": {"entry_id": {"type": "string"}},
        "required": ["entry_id"],
        "additionalProperties": False,
    },
)
def get_entry(args: dict[str, Any]) -> dict[str, Any]:
    init_app_db()
    with Session(engine) as session:
        try:
            entry = get_entry_service(str(args["entry_id"]), session)
        except HTTPException as exc:
            raise _tool_error(exc) from exc
        return {"success": True, "entry": _dump(entry)}


@registry.tool(
    "create_entry",
    "Create one Focus calendar entry.",
    {
        "type": "object",
        "properties": {
            "date": {"type": "string"},
            "time": {"type": ["string", "null"]},
            "title": {"type": "string"},
            "notes": {"type": ["string", "null"]},
            "entry_type_id": {"type": "string"},
            "source": {"type": ["string", "null"]},
            "gmail_message_id": {"type": ["string", "null"]},
            "gmail_thread_id": {"type": ["string", "null"]},
            "gmail_query": {"type": ["string", "null"]},
        },
        "required": ["date", "title", "entry_type_id"],
        "additionalProperties": False,
    },
)
def create_entry(args: dict[str, Any]) -> dict[str, Any]:
    init_app_db()
    payload = EntryWrite(**args)
    with Session(engine) as session:
        try:
            entry = create_entry_service(payload, session)
        except HTTPException as exc:
            raise _tool_error(exc) from exc
        return {"success": True, "entry": _dump(entry)}


@registry.tool(
    "update_entry",
    "Update one Focus calendar entry. Send the full entry payload.",
    {
        "type": "object",
        "properties": {
            "entry_id": {"type": "string"},
            "date": {"type": "string"},
            "time": {"type": ["string", "null"]},
            "title": {"type": "string"},
            "notes": {"type": ["string", "null"]},
            "entry_type_id": {"type": "string"},
            "source": {"type": ["string", "null"]},
            "gmail_message_id": {"type": ["string", "null"]},
            "gmail_thread_id": {"type": ["string", "null"]},
            "gmail_query": {"type": ["string", "null"]},
        },
        "required": ["entry_id", "date", "title", "entry_type_id"],
        "additionalProperties": False,
    },
)
def update_entry(args: dict[str, Any]) -> dict[str, Any]:
    init_app_db()
    entry_id = str(args.pop("entry_id"))
    payload = EntryWrite(**args)
    with Session(engine) as session:
        try:
            entry = update_entry_service(entry_id, payload, session)
        except HTTPException as exc:
            raise _tool_error(exc) from exc
        return {"success": True, "entry": _dump(entry)}


@registry.tool(
    "delete_entry",
    "Delete one Focus calendar entry.",
    {
        "type": "object",
        "properties": {"entry_id": {"type": "string"}},
        "required": ["entry_id"],
        "additionalProperties": False,
    },
)
def delete_entry(args: dict[str, Any]) -> dict[str, Any]:
    init_app_db()
    with Session(engine) as session:
        try:
            return {"success": True, **delete_entry_service(str(args["entry_id"]), session)}
        except HTTPException as exc:
            raise _tool_error(exc) from exc


@registry.tool(
    "bulk_create_entries",
    "Create multiple Focus entries from a structured list of findings.",
    {
        "type": "object",
        "properties": {"entries": {"type": "array", "items": {"type": "object"}}},
        "required": ["entries"],
        "additionalProperties": False,
    },
)
def bulk_create_entries(args: dict[str, Any]) -> dict[str, Any]:
    init_app_db()
    payload = BulkEntryCreate(**args)
    with Session(engine) as session:
        try:
            entries = bulk_create_entries_service(payload, session)
        except HTTPException as exc:
            raise _tool_error(exc) from exc
        return {"success": True, "entries": [_dump(entry) for entry in entries]}


@registry.tool(
    "bulk_create_entries_by_type_name",
    "Create multiple Focus entries using entry type names such as Summary, Appointment, "
    "Deadline, or Important.",
    {
        "type": "object",
        "properties": {
            "entries": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "date": {"type": "string"},
                        "time": {"type": ["string", "null"]},
                        "title": {"type": "string"},
                        "notes": {"type": ["string", "null"]},
                        "entry_type_name": {"type": "string"},
                        "source": {"type": ["string", "null"]},
                        "gmail_message_id": {"type": ["string", "null"]},
                        "gmail_thread_id": {"type": ["string", "null"]},
                        "gmail_query": {"type": ["string", "null"]},
                    },
                    "required": ["date", "title", "entry_type_name"],
                    "additionalProperties": False,
                },
            }
        },
        "required": ["entries"],
        "additionalProperties": False,
    },
)
def bulk_create_entries_by_type_name(args: dict[str, Any]) -> dict[str, Any]:
    init_app_db()
    payload = BulkEntryCreateByTypeName(**args)
    with Session(engine) as session:
        try:
            entries = bulk_create_entries_by_type_name_service(payload, session)
        except HTTPException as exc:
            raise _tool_error(exc) from exc
        return {"success": True, "entries": [_dump(entry) for entry in entries]}


@registry.tool("list_entry_types", "List Focus entry types and colors.")
def list_entry_types(_args: dict[str, Any]) -> dict[str, Any]:
    init_app_db()
    with Session(engine) as session:
        rows = list_entry_types_service(session)
        return {"success": True, "entry_types": [_dump(row) for row in rows]}


@registry.tool(
    "create_entry_type",
    "Create one Focus entry type with a calendar color.",
    {
        "type": "object",
        "properties": {"name": {"type": "string"}, "color": {"type": "string"}},
        "required": ["name"],
        "additionalProperties": False,
    },
)
def create_entry_type(args: dict[str, Any]) -> dict[str, Any]:
    init_app_db()
    payload = EntryTypeBase(**args)
    with Session(engine) as session:
        try:
            entry_type = create_entry_type_service(payload, session)
        except HTTPException as exc:
            raise _tool_error(exc) from exc
        return {"success": True, "entry_type": _dump(entry_type)}


@registry.tool(
    "update_entry_type",
    "Update one Focus entry type name and color.",
    {
        "type": "object",
        "properties": {
            "entry_type_id": {"type": "string"},
            "name": {"type": "string"},
            "color": {"type": "string"},
        },
        "required": ["entry_type_id", "name", "color"],
        "additionalProperties": False,
    },
)
def update_entry_type(args: dict[str, Any]) -> dict[str, Any]:
    init_app_db()
    payload = EntryTypeBase(name=str(args["name"]), color=str(args["color"]))
    with Session(engine) as session:
        try:
            entry_type = update_entry_type_service(str(args["entry_type_id"]), payload, session)
        except HTTPException as exc:
            raise _tool_error(exc) from exc
        return {"success": True, "entry_type": _dump(entry_type)}


@registry.tool(
    "delete_entry_type",
    "Delete one Focus entry type and move existing entries to another type.",
    {
        "type": "object",
        "properties": {"entry_type_id": {"type": "string"}},
        "required": ["entry_type_id"],
        "additionalProperties": False,
    },
)
def delete_entry_type(args: dict[str, Any]) -> dict[str, Any]:
    init_app_db()
    with Session(engine) as session:
        try:
            return {
                "success": True,
                **delete_entry_type_service(str(args["entry_type_id"]), session),
            }
        except HTTPException as exc:
            raise _tool_error(exc) from exc


if __name__ == "__main__":
    main(registry, server_name="focus")
