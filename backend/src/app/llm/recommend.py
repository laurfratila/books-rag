from __future__ import annotations
import json
from typing import Dict, Any, List
from openai import OpenAI
from ..config import OPENAI_API_KEY, CHAT_MODEL
from ..rag.query import rag_search, get_summary_by_title

client = OpenAI(api_key=OPENAI_API_KEY)

SYSTEM = (
    "You are a helpful book recommender. "
    "From the provided candidates, pick exactly ONE title that best matches the user's request. "
    "Then call the tool get_summary_by_title with that exact title. Keep responses concise."
)

# OpenAI tool schema: the 'function' will be executed by our backend when the model requests it.
TOOLS = [{
    "type": "function",
    "function": {
        "name": "get_summary_by_title",
        "description": "Return the full summary for the exact book title.",
        "parameters": {
            "type": "object",
            "properties": {"title": {"type": "string"}},
            "required": ["title"]
        }
    }
}]

def _as_user_payload(query: str, candidates: List[Dict[str, Any]]) -> str:
    # Compact JSON the model can reason over
    return json.dumps({
        "query": query,
        "candidates": [{"title": c["title"], "snippet": c["snippet"]} for c in candidates]
    }, ensure_ascii=False)

def recommend_with_tools(user_query: str, k: int = 3) -> Dict[str, Any]:
    # 1) Retrieve semantic candidates from Chroma
    candidates = rag_search(user_query, k=k)
    titles = [c["title"] for c in candidates if c.get("title")]

    # 2) Ask model to choose and to call our tool
    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": _as_user_payload(user_query, candidates)},
    ]
    first = client.chat.completions.create(
        model=CHAT_MODEL,
        messages=messages,
        tools=TOOLS,
        tool_choice="auto",
        temperature=0.2,
    )
    msg = first.choices[0].message

    chosen_title = ""
    chosen_summary = ""

    # 3) Execute tool calls (if any), then finalize assistant reply
    if getattr(msg, "tool_calls", None):
        messages.append({"role": "assistant", "tool_calls": msg.tool_calls, "content": msg.content})

        for call in msg.tool_calls:
            if call.function.name == "get_summary_by_title":
                args = json.loads(call.function.arguments or "{}")
                chosen_title = (args.get("title") or "").strip()
                # Safety: must be one of provided titles
                if chosen_title not in titles and titles:
                    chosen_title = titles[0]
                chosen_summary = get_summary_by_title(chosen_title) or ""
                # Send tool result back to the model
                messages.append({
                    "role": "tool",
                    "tool_call_id": call.id,
                    "content": chosen_summary
                })

        final = client.chat.completions.create(
            model=CHAT_MODEL,
            messages=messages,
            temperature=0.2,
        )
        assistant_msg = final.choices[0].message.content or ""
    else:
        # Fallback: no tool call → pick first candidate & fetch summary locally
        chosen_title = titles[0] if titles else ""
        chosen_summary = get_summary_by_title(chosen_title) or ""
        assistant_msg = f"My pick: {chosen_title}\n\n{chosen_summary}" if chosen_title else "No recommendation available."

    return {
        "title": chosen_title,
        "summary": chosen_summary,
        "message": assistant_msg,
        "candidates": titles
    }
