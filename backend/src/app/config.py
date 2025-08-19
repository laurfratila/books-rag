from __future__ import annotations
import os, pathlib
from dotenv import load_dotenv

BACKEND_ROOT = pathlib.Path(__file__).resolve().parents[2]  # …/backend
# Load .env from backend folder explicitly
load_dotenv(dotenv_path=BACKEND_ROOT / ".env")

CHROMA_DIR = BACKEND_ROOT / ".chroma"
DATA_DIR = BACKEND_ROOT / "data"
BOOK_SUMMARIES_PATH = DATA_DIR / "book_summaries.json"

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small")
CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4o-mini")


