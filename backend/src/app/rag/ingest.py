from __future__ import annotations
import json, os
from typing import List, Dict, Any
import chromadb
from chromadb.utils import embedding_functions
from ..config import CHROMA_DIR, BOOK_SUMMARIES_PATH, OPENAI_API_KEY, EMBED_MODEL

def load_summaries() -> List[Dict[str, Any]]:
    with open(BOOK_SUMMARIES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def get_collection():
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    ef = embedding_functions.OpenAIEmbeddingFunction(
        api_key=OPENAI_API_KEY, model_name=EMBED_MODEL
    )
    return client.get_or_create_collection(name="book_summaries", embedding_function=ef)

def main():
    data = load_summaries()
    col = get_collection()

    ids = []
    docs = []
    metas = []
    for i, item in enumerate(data):
        ids.append(f"book-{i:03d}")
        docs.append(f"{item['title']}\n\n{item['summary']}")
        metas.append({"title": item["title"], "themes": ", ".join(item.get("themes", []))})

    # upsert behavior: delete existing then add to avoid dup ids
    try:
        col.delete(ids=ids)
    except Exception:
        pass

    col.add(ids=ids, documents=docs, metadatas=metas)
    print(f"Ingested {len(ids)} items into Chroma at {CHROMA_DIR}")

if __name__ == "__main__":
    if not OPENAI_API_KEY:
        raise SystemExit("OPENAI_API_KEY not set")
    os.makedirs(CHROMA_DIR, exist_ok=True)
    main()
