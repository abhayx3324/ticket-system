# Support Ticket System

A full-stack support ticket system with AI-powered triage, built with Django, React, PostgreSQL, and Google Gemini.

## Quick Start

```bash
# 1. Set your Gemini API key (get one free at https://aistudio.google.com)
export LLM_API_KEY=your_google_api_key_here

# 2. Run the full stack
cd ticket-system
docker-compose up --build
```

- **Frontend:** http://localhost:3000  
- **Backend API:** http://localhost:8000/api/  
- **Django Admin:** http://localhost:8000/admin/

No other setup is required. Migrations run automatically on startup.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.2 + Django REST Framework + PostgreSQL |
| Frontend | React 18 + Vite |
| LLM | Google Gemini (`gemini-3.5-flash`) via `google-genai` SDK |
| Infrastructure | Docker + Docker Compose + Nginx |

## LLM Choice — Google Gemini

I chose **Google Gemini** (`gemini-3.5-flash`) for the following reasons:

1. **Structured output mode** — Gemini's `response_schema` + `response_mime_type="application/json"` forces the model to return a JSON object that exactly matches a Pydantic schema (`TicketClassification`). This eliminates the need for brittle post-hoc parsing and guarantees the values are valid enum members.
2. **Speed & cost** — Gemini Flash models are among the fastest and cheapest available, ideal for a latency-sensitive classify-on-blur UX.
3. **Free tier** — The Google AI Studio API key is free, making the LLM feature accessible without a credit card.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/tickets/` | Create a ticket (201) |
| `GET` | `/api/tickets/` | List tickets (supports `?category`, `?priority`, `?status`, `?search`) |
| `PATCH` | `/api/tickets/<id>/` | Partial update (status, category, priority) |
| `GET` | `/api/tickets/stats/` | Aggregated dashboard stats |
| `POST` | `/api/tickets/classify/` | LLM-powered category + priority suggestion |

## Design Decisions

- **`refreshKey` pattern** — A single integer in `App.jsx` state increments when a ticket is submitted, causing both the ticket list and stats dashboard to re-fetch. This avoids prop-drilling or a global state library for a simple use case.
- **Classify on blur** — The LLM classify call fires when the user leaves the description field, not on every keystroke. This avoids hammering the API while still feeling responsive.
- **Nginx reverse proxy** — In Docker, Nginx serves the built React app and proxies `/api/` to the backend container. This means the browser only talks to one origin, eliminating CORS issues in production while keeping the backend unreachable directly.
- **DB-level aggregation** — The `/api/tickets/stats/` endpoint uses a single `aggregate()` query for scalars and `annotate()` for breakdowns. No Python-level iteration over rows.
- **Graceful LLM degradation** — If the classify call fails (bad API key, timeout, network error, etc.), the form still works normally — the dropdowns just won't be pre-filled.

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_API_KEY` | Yes | — | Google AI Studio API key |
| `LLM_MODEL` | No | `gemini-3.5-flash` | Gemini model name |
| `POSTGRES_DB` | No | `ticketdb` | Database name |
| `POSTGRES_USER` | No | `postgres` | DB user |
| `POSTGRES_PASSWORD` | No | `password` | DB password |
