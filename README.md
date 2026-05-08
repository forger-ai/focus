# Focus

Focus is a local Forger app for calendar notes. It stores entries and entry
types in a private SQLite database, shows a monthly calendar, and supports a
Personal Agent plus Gmail-assisted entry creation.

## Development

Focus uses the `vite-fastapi-sqlite` stack:

- FastAPI backend
- SQLite local data
- Vite + React frontend
- MUI UI components
- `uv` for backend tooling

Dev ports:

- backend: `8006`
- frontend: `5186`

## Local Dev Catalog

Focus is available to Forger Desktop development through:

- `FORGER_LOCAL_APPS` including this app path
- `.version.dev` using the current timestamped dev version

The app is published to the local dev catalog as `focus-dev`.
