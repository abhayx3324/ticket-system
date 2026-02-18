import os
import requests
import json

def classify_ticket(description):
    api_key = os.environ.get("LLM_API_KEY")
    if not api_key:
        print("LLM_API_KEY not found.")
        return None

    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    prompt = f"""
    Analyze the following support ticket description. 
    Classify it into one of these categories: billing, technical, account, general.
    Assign a priority: low, medium, high, critical.
    
    Description: "{description}"
    
    Return ONLY a JSON object: {{"suggested_category": "...", "suggested_priority": "..."}}
    """

    payload = {
        "model": "gpt-3.5-turbo",\
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        data = response.json()
        content = data['choices'][0]['message']['content']
        return json.loads(content)
    except Exception as e:
        print(f"LLM Error: {e}")
        return None