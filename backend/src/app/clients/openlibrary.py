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
            )
        )
    return results