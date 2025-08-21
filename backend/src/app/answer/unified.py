# backend/src/app/answer/unified.py
from __future__ import annotations
from typing import Any, Dict
from ..llm.recommend import recommend_with_tools
from ..rag.query import rag_search
from ..clients.openlibrary import find_title_details

def unified_answer(user_query: str, k: int = 3) -> Dict[str, Any]:
    # 1) RAG (for observability and to pass k downstream)
    candidates = rag_search(user_query, k=k)

    # 2) LLM picks ONE title and fetches full summary via tool
    rec = recommend_with_tools(user_query, k=k)
    title = rec.get("title") or ""
    summary = rec.get("summary") or ""
    message = rec.get("message") or ""
    chosen_candidates = rec.get("candidates") or []

    # 3) Enrich with Open Library
    details = find_title_details(title) if title else None

    return {
        "query": user_query,
        "title": title,
        "reason_message": message,     # conversational justification from the LLM
        "summary": summary,            # full summary from our local tool
        "details": details or {},      # authors, year, cover_url, openlibrary_url
        "rag_candidates": candidates,  # includes snippets
        "k": k,
        "source": "rag+llm+openlibrary",
    }
