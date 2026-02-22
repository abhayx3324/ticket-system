"""
LLM utility for ticket classification.

Uses the Google Gen AI SDK (google-genai) to suggest a category and
priority for a support ticket based on its title and description.

Configuration (environment variables):
    LLM_API_KEY  — your Google AI Studio / Gemini API key (required)
    LLM_MODEL    — Gemini model name (default: gemini-2.0-flash-lite)

Exceptions (let callers map these to HTTP responses):
    LLMConfigError   — LLM_API_KEY is not set
    LLMResponseError — Gemini returned an unparseable / invalid response
    LLMError         — any other error from the Gemini SDK
"""

import os
import json
import enum

from google import genai
from pydantic import BaseModel, Field


# ── Custom exceptions ────────────────────────────────────────────

class LLMConfigError(Exception):
    """LLM_API_KEY environment variable is not configured."""

class LLMResponseError(Exception):
    """Gemini returned a response that could not be parsed or is invalid."""

class LLMError(Exception):
    """Unexpected error from the Gemini SDK."""


# ── Prompts ───────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a support ticket triage assistant.
Your job is to read a support ticket and classify it into exactly
one category and one priority level from the lists below.

Categories:
  - billing    → payment issues, invoices, charges, subscription, refunds
  - technical  → bugs, errors, crashes, performance, integrations, API issues
  - account    → login, password, access, permissions, profile changes
  - general    → everything else that doesn't fit the above

Priority levels:
  - low       → non-urgent, cosmetic, minor inconvenience
  - medium    → affects workflow but has a workaround
  - high      → significant impact, no workaround, production affected
  - critical  → complete outage, data loss, security breach, urgent emergency

Rules:
  1. Reply ONLY with a JSON object
  2. Use exactly this shape: {"suggested_category": "<category>", "suggested_priority": "<priority>"}
  3. Values must be lowercase and from the lists above.
"""

USER_PROMPT_TEMPLATE = 'Ticket title: """{title}"""\nTicket description: """{description}"""'


# ── Pydantic schema for structured output ─────────────────────────

class Category(str, enum.Enum):
    billing   = "billing"
    technical = "technical"
    account   = "account"
    general   = "general"


class Priority(str, enum.Enum):
    low      = "low"
    medium   = "medium"
    high     = "high"
    critical = "critical"


class TicketClassification(BaseModel):
    suggested_category: Category = Field(...)
    suggested_priority: Priority = Field(...)


# ── Main function ─────────────────────────────────────────────────

def classify_ticket(title: str, description: str) -> dict:
    """
    Classify a support ticket using the configured LLM.

    Returns a dict with keys 'suggested_category' and 'suggested_priority'.

    Raises:
        LLMConfigError   — if LLM_API_KEY is not set
        LLMResponseError — if the LLM response cannot be parsed
        LLMError         — for any other SDK / network error
    """
    api_key = os.environ.get("LLM_API_KEY")
    if not api_key:
        raise LLMConfigError(
            "LLM_API_KEY environment variable is not set. "
            "AI classification is unavailable."
        )

    model_name = os.environ.get("LLM_MODEL", "gemini-3.5-flash")
    if not model_name:
        raise LLMConfigError(
            "LLM_MODEL environment variable is not set. "
            "Set it to your Gemini model name in docker-compose.yml or .env."
        )

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=USER_PROMPT_TEMPLATE.format(title=title, description=description),
            config={
                "system_instruction": SYSTEM_PROMPT,
                "response_mime_type": "application/json",
                "response_schema": TicketClassification,
                "temperature": 0.2,
            },
        )
    except Exception as exc:
        raise LLMError(f"Gemini SDK error ({type(exc).__name__}): {exc}") from exc

    try:
        result = json.loads(response.text)
    except (json.JSONDecodeError, TypeError) as exc:
        raise LLMResponseError(
            f"Could not parse the LLM response as JSON: {exc}"
        ) from exc

    return result