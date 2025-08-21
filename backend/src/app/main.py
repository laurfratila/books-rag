from __future__ import annotations
from typing import List
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .clients.openlibrary import search_books, BookHit
from fastapi import HTTPException
from .rag.query import rag_search, get_summary_by_title
from .llm.recommend import recommend_with_tools
from fastapi import Query
from .answer.unified import unified_answer
from .safety.guard import ensure_clean_or_raise

app = FastAPI(title="Books RAG API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/api/search", response_model=List[BookHit])
def api_search(
    q: str = Query(min_length=1, description="Free‑text book query"),
    limit: int = Query(10, ge=1, le=50),
    page: int = Query(1, ge=1, le=20),
):
    try:
        return search_books(q, limit=limit, page=page)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upstream error: {e}")
    
@app.get("/api/rag/search")
def api_rag_search(q: str, k: int = 3):
    if not q.strip():
        raise HTTPException(status_code=400, detail="Empty query")
    return rag_search(q.strip(), k=k)

@app.get("/api/summary")
def api_summary(title: str):
    s = get_summary_by_title(title)
    if not s:
        raise HTTPException(status_code=404, detail="Title not found")
    return {"title": title, "summary": s}

@app.get("/api/recommend_chat")
def api_recommend_chat(q: str = Query(min_length=1), k: int = 3):
    try:
        ensure_clean_or_raise(q)
    except ValueError as e:
        # Polite block; do not call the LLM.
        raise HTTPException(status_code=400, detail=str(e))
    result = recommend_with_tools(q.strip(), k=k)
    if not result.get("title"):
        raise HTTPException(status_code=404, detail="No recommendation available")
    return result


@app.get("/api/answer")
def api_answer(q: str = Query(min_length=1), k: int = 3):
    try:
        ensure_clean_or_raise(q)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    result = unified_answer(q.strip(), k=k)
    if not result.get("title"):
        raise HTTPException(status_code=404, detail="No recommendation available")
    return result