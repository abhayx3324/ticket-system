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

No other setup is required — Docker handles everything (see [What Docker Compose Does](#what-docker-compose-does)).

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 4.2 + Django REST Framework |
| Database | PostgreSQL 15 |
| Frontend | React 18 + Vite |
| LLM | Google Gemini (`gemini-2.5-flash-lite`) via `google-genai` SDK |
| Infrastructure | Docker + Docker Compose + Nginx |

## What Docker Compose Does

Running `docker-compose up --build` handles the entire setup automatically:

| Step | How |
|---|---|
| **Python dependencies** | Backend Dockerfile runs `pip install -r requirements.txt` |
| **Node modules** | Frontend Dockerfile runs `npm ci` |
| **Frontend build** | Frontend Dockerfile runs `npm run build`, output served by Nginx |
| **Database** | Pulls `postgres:15`, creates the DB from environment variables |
| **Migrations** | Backend entrypoint runs `python manage.py migrate` before starting |

You do **not** need to run `pip install`, `npm install`, or `python manage.py migrate` manually.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/tickets/` | Create a ticket (201) |
| `GET` | `/api/tickets/` | List tickets (supports `?category`, `?priority`, `?status`, `?search`) |
| `GET` | `/api/tickets/<id>/` | Retrieve a single ticket |
| `PATCH` | `/api/tickets/<id>/` | Partial update (any field: title, description, category, priority, status) |
| `DELETE` | `/api/tickets/<id>/` | Delete a ticket (204) |
| `GET` | `/api/tickets/stats/` | Aggregated dashboard stats |
| `POST` | `/api/tickets/classify/` | LLM-powered category + priority suggestion |

## LLM Choice — Google Gemini

I chose **Google Gemini** (`gemini-2.5-flash-lite`) for the following reasons:

1. **Structured output mode** — Gemini's `response_schema` + `response_mime_type="application/json"` forces the model to return a JSON object that exactly matches a Pydantic schema (`TicketClassification`). This eliminates brittle post-hoc parsing and guarantees valid enum values.
2. **Speed & cost** — Gemini Flash models are among the fastest and cheapest available, ideal for a latency-sensitive UX.
3. **Free tier** — The Google AI Studio API key is free, making the LLM feature accessible without a credit card.

## Backend Design Decisions

- **ModelViewSet** — `TicketViewSet` extends DRF's `ModelViewSet`, providing full CRUD (create, retrieve, update, partial_update, delete) with minimal code. Custom logic is only added where needed (filtering, search).
- **Server-side filtering & search** — The `get_queryset()` method supports `?category`, `?priority`, `?status`, and `?search` query params. Search uses `icontains` on both `title` and `description` via Django `Q` objects.
- **DB-level aggregation** — The `/api/tickets/stats/` endpoint uses a single `aggregate()` call for scalar stats (total, open count) and `annotate()` for breakdowns (by priority, by category). No Python-level iteration over rows.
- **Status transition validation** — The serializer's `validate_status` method enforces a strict flow: open → in_progress → resolved → closed. Attempts to skip steps or go backwards are rejected with a 400 error.
- **LLM error hierarchy** — Three custom exceptions (`LLMConfigError`, `LLMResponseError`, `LLMError`) map to appropriate HTTP status codes (503, 502) so the frontend can display meaningful error messages.
- **Graceful LLM degradation** — If the classify call fails (bad API key, timeout, network error), the form still works normally — the category/priority dropdowns just won't be pre-filled.

## Frontend Design Decisions

- **Unified `TicketFormModal`** — A single modal component handles both creating and editing tickets. When `ticket` prop is `null` it renders in create mode (blank form); otherwise it shows view/edit mode with pre-filled fields. This eliminates code duplication and ensures a consistent UX.
- **Reusable `AiClassifyButton`** — The AI classification UI (button, loading spinner, error state, suggestion callout) is extracted into a shared component. It takes `title`, `description`, and an `onApply` callback, and is used identically in both create and edit flows.
- **`refreshKey` pattern** — A single integer in `App.jsx` state increments whenever a ticket is created, updated, or deleted. This causes both the ticket list and stats dashboard to re-fetch without prop-drilling or a global state library.
- **Explicit AI classify button** — The user clicks "Analyse with AI" to request suggestions, rather than auto-classifying on blur. This gives full control over when the API call fires and avoids unnecessary requests.
- **Delete with confirmation** — Ticket deletion shows a native `window.confirm` dialog before sending the DELETE request, preventing accidental data loss.
- **Nginx reverse proxy** — In Docker, Nginx serves the built React bundle and proxies `/api/` requests to the backend container. The browser only talks to one origin, eliminating CORS issues in production.

## Project Structure

```
ticket-system/
├── docker-compose.yml
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── ticket_system/          # Django project settings
│   │   ├── settings.py
│   │   └── urls.py
│   └── tickets/                # Main app
│       ├── models.py           # Ticket model with choices
│       ├── serializers.py      # DRF serializer with status validation
│       ├── views.py            # ViewSet, Stats API, Classify API
│       ├── urls.py             # Router + custom endpoints
│       └── utils.py            # Gemini LLM integration
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    └── src/
        ├── App.jsx             # Root layout with tab navigation
        ├── index.css           # Full design system
        ├── services/api.js     # API client (fetch wrapper)
        └── components/
            ├── TicketFormModal.jsx   # Unified create/edit modal
            ├── TicketCard.jsx       # Compact ticket summary card
            ├── TicketList.jsx       # List with filters + search
            ├── StatsDashboard.jsx   # KPI cards + breakdown bars
            ├── AiClassifyButton.jsx # Reusable AI classify widget
            └── Spinner.jsx          # Loading spinner
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `LLM_API_KEY` | Yes | — | Google AI Studio API key |
| `LLM_MODEL` | No | `gemini-2.5-flash-lite` | Gemini model name |
| `POSTGRES_DB` | No | `ticketdb` | Database name |
| `POSTGRES_USER` | No | `postgres` | DB user |
| `POSTGRES_PASSWORD` | No | `password` | DB password |
