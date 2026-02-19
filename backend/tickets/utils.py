"""
LLM utility for ticket classification.

Calls the configured LLM API to suggest a category and priority for a support
ticket based on its description. The API key is read from the LLM_API_KEY
environment variable — never hardcoded.

Supported models: OpenAI-compatible (gpt-3.5-turbo, gpt-4o, etc.)

Failure policy: all exceptions are caught and None is returned so that callers
can degrade gracefully without blocking ticket submission.
"""

import os
import json
import requests


# ---------------------------------------------------------------------------
# Prompt engineering
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are a support ticket triage assistant.
Your job is to read a support ticket description and classify it into exactly
one category and one priority level from the lists below.

Categories:
  - billing   → payment issues, invoices, charges, subscription, refunds
  - technical  → bugs, errors, crashes, performance, integrations, API issues
  - account    → login, password, access, permissions, profile changes
  - general    → everything else that doesn't fit the above

Priority levels:
  - low       → non-urgent, cosmetic, minor inconvenience
  - medium    → affects workflow but has a workaround
  - high      → significant impact, no workaround, production affected
  - critical  → complete outage, data loss, security breach, urgent emergency

Rules:
  1. Reply ONLY with a JSON object — no markdown fences, no extra text.
  2. Use exactly this shape: {"suggested_category": "<category>", "suggested_priority": "<priority>"}
  3. Values must be lowercase and from the lists above.
"""

USER_PROMPT_TEMPLATE = 'Ticket description: """{description}"""'

def classify_ticket(description: str) -> dict | None:
    """
    Send *description* to the LLM and return a dict with keys:
        suggested_category (str)
        suggested_priority (str)

    Returns None on any error (network failure, bad JSON, missing key, etc.)
    so the caller can degrade gracefully.
    """
    api_key = os.environ.get("LLM_API_KEY")
    if not api_key:
        print("[classify_ticket] LLM_API_KEY is not set — skipping classification.")
        return None

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }

    payload = {
        "model": os.environ.get("LLM_MODEL", "gpt-3.5-turbo"),
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": USER_PROMPT_TEMPLATE.format(description=description)},
        ],
        "temperature": 0.2,   # low temperature → deterministic, consistent output
        "max_tokens": 60,     # response is always a tiny JSON object
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        raw_content = data["choices"][0]["message"]["content"].strip()

        # Strip accidental markdown code fences if the model wraps the JSON
        if raw_content.startswith("```"):
            raw_content = raw_content.split("```")[1]
            if raw_content.startswith("json"):
                raw_content = raw_content[4:]
            raw_content = raw_content.strip()

        result = json.loads(raw_content)

        # Validate the expected keys are present
        if "suggested_category" not in result or "suggested_priority" not in result:
            print(f"[classify_ticket] LLM response missing required keys: {result}")
            return None

        return {
            "suggested_category": str(result["suggested_category"]).lower(),
            "suggested_priority": str(result["suggested_priority"]).lower(),
        }

    except requests.exceptions.Timeout:
        print("[classify_ticket] LLM API request timed out.")
    except requests.exceptions.HTTPError as e:
        print(f"[classify_ticket] LLM API HTTP error: {e.response.status_code} — {e.response.text[:200]}")
    except requests.exceptions.RequestException as e:
        print(f"[classify_ticket] LLM network error: {e}")
    except (json.JSONDecodeError, KeyError, IndexError) as e:
        print(f"[classify_ticket] Failed to parse LLM response: {e}")
    except Exception as e:
        print(f"[classify_ticket] Unexpected error: {e}")

    return None