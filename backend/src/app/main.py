from __future__ import annotations
from typing import List
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .clients.openlibrary import search_books, BookHit

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