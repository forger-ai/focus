# AGENTS

## Source of Truth

This file is the main functional and operational context source for Focus.

`manifest.json` describes installation, services, tools, agents, prompt
templates, scripts, and catalog metadata. It is not the complete list of
user-visible capabilities.

The agent must distinguish between user-visible capabilities and internal agent
tools. Internal tools can complete tasks, but they must not be presented as
manual user steps.

## Product Identity

- id: `focus`
- visible name: `Focus`
- stack: `vite-fastapi-sqlite`
- status: beta local Forger app

## Functional Goal

Focus helps one person keep simple local calendar notes. Each entry belongs to
one date, can optionally have a time, and uses a configurable entry type color in
the calendar.

Focus also includes a Personal Agent and one-shot Gmail import prompt. The agent
can use official Forger Gmail search/read tools when the user asks to review
email and can create Focus entries from the findings.

## Semantic Data Model

### EntryType

An entry type is a user-facing label with a color. The color paints entry pills
in the calendar. Entry type names are configurable.

Default entry types are:

- `Summary`
- `Appointment`
- `Deadline`
- `Important`

`Summary` is reserved for the day summary. A date can have at most one
`Summary` entry. `Summary` entries are all-day entries and hold the compact
summary of what matters for that date. When the agent needs to add summary
information for a date, it must first check whether a `Summary` entry already
exists for that date and update that entry instead of creating another one.

### CalendarEntry

A calendar entry is a note attached to a date. Its title appears in the calendar
pill. Its notes hold the detail. Its entry type controls the visual color.

`time` is optional. When `time` is absent, the entry is an all-day entry for its
date. When `time` is present, it must use `HH:MM` and appears in the calendar
pill.

Entries sort within a day as:

1. all-day entries;
2. timed entries ordered by time;
3. creation order fallback within ties.

Gmail-created entries can store source metadata such as message id, thread id,
and the search query used.

## User-Visible Capabilities

The user can:

- view entries in a monthly calendar;
- move to previous and next months;
- create entries from the header or a calendar day;
- open, edit, and delete entries;
- drag entries to another date;
- configure entry type names and colors;
- use a Personal Agent to review or update the Focus calendar;
- run a Gmail import prompt that analyzes recent email and creates entries.

## Gmail Behavior

Focus declares the official Forger Gmail tool with these actions:

- `gmail.search_messages`
- `gmail.read_thread`

Focus does not declare Gmail send.

The agent must use only official Forger Gmail tools through the Forger MCP
server. It must not use Codex-local Gmail connectors, browser mail sessions, or
personal Codex plugins for Gmail inside Focus.

The Gmail import prompt defaults to the last three days of email. It creates one
entry per distinct finding, extracts a date and time when clear, and creates an
all-day entry when the time is not clear.

## Capabilities You Must Not Assume

Do not claim Focus supports these functions unless they are explicitly added:

- external calendar sync;
- reminders or notifications;
- recurring entries;
- sending emails;
- cloud sync;
- multi-user collaboration;
- reading files outside the app workspace.

## Internal Agent Tools

Focus MCP tools are internal agent tools:

- `list_entries`
- `get_entry`
- `create_entry`
- `update_entry`
- `delete_entry`
- `bulk_create_entries`
- `list_entry_types`
- `create_entry_type`
- `update_entry_type`
- `delete_entry_type`

The agent should report functional impact:

- what entries were created or changed;
- which dates and entry types were affected;
- which email findings were skipped because they were ambiguous;
- whether a proposed change was applied or only drafted.

## Stack Contract

The app uses the shared `vite-fastapi-sqlite` commons submodule. Docker Compose
mounts shared helpers over local fallbacks:

- `backend/src/app/database.py`
- `backend/src/app/health.py`
- `backend/src/app/cors.py`
- `frontend/src/api/client.ts`

App-specific models and initialization live in local backend modules. Database
initialization must call `app.database_ext.init_app_db()`.

## Verification

Internal checks:

```bash
cd backend && uv run pytest
cd ../frontend && npm run verify
```

These commands are internal agent tools. Do not present them as normal user
steps unless the user explicitly asks for technical details.
