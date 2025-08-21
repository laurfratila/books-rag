# backend/src/app/clients/openlibrary.py
from __future__ import annotations
import time
from typing import Any, Dict, List, Optional, TypedDict
import requests

BASE_URL = "https://openlibrary.org"
SESSION = requests.Session()
DEFAULT_TIMEOUT = 15

class BookHit(TypedDict, total=False):
    key: str
    title: str
    author_name: List[str]
    first_publish_year: Optional[int]
    isbn: List[str]
    language: List[str]
    cover_i: Optional[int]  # NEW: cover id if available

def _get(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    backoffs = [0.3, 0.7, 1.2]
    for i, pause in enumerate(backoffs + [0]):
        try:
            resp = SESSION.get(url, params=params, timeout=DEFAULT_TIMEOUT)
            resp.raise_for_status()
            return resp.json()
        except requests.RequestException:
            if i < len(backoffs):
                time.sleep(pause)
            else:
                raise

def search_books(query: str, *, limit: int = 10, page: int = 1) -> List[BookHit]:
    data = _get(f"{BASE_URL}/search.json", {"q": query, "limit": limit, "page": page})
    docs = data.get("docs", [])
    results: List[BookHit] = []
    for d in docs:
        results.append(
            BookHit(
                key=d.get("key", ""),
                title=d.get("title", ""),
                author_name=d.get("author_name", []) or [],
                first_publish_year=d.get("first_publish_year"),
                isbn=d.get("isbn", []) or [],
                language=d.get("language", []) or [],
                cover_i=d.get("cover_i"),
            )
        )
    return results

def find_title_details(title: str) -> Optional[Dict[str, Any]]:
    """
    Look up a title in Open Library and return best-effort metadata:
    authors, year, cover_url, openlibrary_url.
    """
    title = (title or "").strip()
    if not title:
        return None

    # Prefer "title=" param to bias towards exact title matches
    data = _get(f"{BASE_URL}/search.json", {"title": title, "limit": 5})
    docs: List[Dict[str, Any]] = data.get("docs", []) or []

    best = None
    # 1) exact (case-insensitive) title match if possible
    for d in docs:
        if (d.get("title") or "").strip().lower() == title.lower():
            best = d
            break
    # 2) fallback: first doc
    if best is None and docs:
        best = docs[0]
    if best is None:
        return None

    authors = best.get("author_name", []) or []
    year = best.get("first_publish_year")
    key = best.get("key") or ""
    cover_i = best.get("cover_i")
    isbns = (best.get("isbn") or [])
    openlibrary_url = f"{BASE_URL}{key}" if key else None

    cover_url = None
    if cover_i:
        cover_url = f"https://covers.openlibrary.org/b/id/{cover_i}-M.jpg"
    elif isbns:
        cover_url = f"https://covers.openlibrary.org/b/isbn/{isbns[0]}-M.jpg"

    return {
        "title": best.get("title") or title,
        "authors": authors,
        "year": year,
        "openlibrary_url": openlibrary_url,
        "cover_url": cover_url,
    }
