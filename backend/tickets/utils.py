"""
LLM utility for ticket classification.

Uses the Google Gen AI SDK (google-genai) to suggest a category and
priority for a support ticket based on its description.

Configuration (environment variables):
    LLM_API_KEY  — your Google AI Studio / Gemini API key (required)
    LLM_MODEL    — Gemini model name (default: gemini-2.0-flash-lite)

Failure policy: all exceptions are caught and None is returned so that
callers can degrade gracefully without blocking ticket submission.
"""

import os
import json
import enum

from google import genai
from google.genai import types
from pydantic import BaseModel, Field


SYSTEM_PROMPT = """You are a support ticket triage assistant.
Your job is to read a support ticket description and classify it into exactly
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

USER_PROMPT_TEMPLATE = 'Ticket description: """{description}"""'


class Category(str, enum.Enum):
    billing  = "billing"
    technical = "technical"
    account  = "account"
    general  = "general"


class Priority(str, enum.Enum):
    low      = "low"
    medium   = "medium"
    high     = "high"
    critical = "critical"


class TicketClassification(BaseModel):
    suggested_category: Category = Field(...)
    suggested_priority: Priority = Field(...)


def classify_ticket(description: str) -> dict | None:
    api_key = os.environ.get("LLM_API_KEY")
    if not api_key:
        print("[classify_ticket] LLM_API_KEY is not set — skipping classification.")
        return None

    model_name = os.environ.get("LLM_MODEL", "gemini-3.5-flash")

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model = model_name,
            contents = USER_PROMPT_TEMPLATE.format(description=description),
            config = {
                "system_instruction": SYSTEM_PROMPT,
                "response_mime_type": "application/json",
                "response_schema": TicketClassification,
                "temperature": 0.2
            }
        )

        result = json.loads(response.text)

        return result

    except json.JSONDecodeError as e:
        print(f"[classify_ticket] Failed to parse Gemini JSON response: {e}")
    except Exception as e:
        print(f"[classify_ticket] Gemini error ({type(e).__name__}): {e}")

    return None