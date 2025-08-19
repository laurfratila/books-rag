from __future__ import annotations
import json
from typing import List, Dict, Any
import chromadb
from chromadb.utils import embedding_functions
from ..config import CHROMA_DIR, BOOK_SUMMARIES_PATH, OPENAI_API_KEY, EMBED_MODEL

def _collection():
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    ef = embedding_functions.OpenAIEmbeddingFunction(
        api_key=OPENAI_API_KEY, model_name=EMBED_MODEL
    )
    return client.get_or_create_collection(name="book_summaries", embedding_function=ef)

def rag_search(query: str, k: int = 3) -> List[Dict[str, Any]]:
    col = _collection()
    res = col.query(query_texts=[query], n_results=k)
    out = []
    for i in range(len(res["ids"][0])):
        meta = res["metadatas"][0][i] or {}
        doc = res["documents"][0][i] or ""
        out.append({
            "title": meta.get("title", ""),
            "score": float(res["distances"][0][i]) if "distances" in res else None,
            "snippet": doc[:300]
        })
    return out

def get_summary_by_title(title: str) -> str | None:
    with open(BOOK_SUMMARIES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    for item in data:
        if item["title"].lower() == title.lower():
            return item["summary"]
    return None
