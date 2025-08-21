from __future__ import annotations
import re
from typing import Iterable

# Minimal demo list; extend with company policy as needed.
# We match whole words, case-insensitive.
_BAD_WORDS = (
    "fuck", "shit", "bastard", "asshole", "retard",
    # RO examples (tune as needed)
    "prost", "idiot", "dobitoc"
)

_PATTERNS = [re.compile(rf"\b{re.escape(w)}\b", re.IGNORECASE) for w in _BAD_WORDS]

def is_offensive(text: str, extra_words: Iterable[str] | None = None) -> bool:
    s = (text or "").strip()
    if not s:
        return False
    for p in _PATTERNS:
        if p.search(s):
            return True
    if extra_words:
        for w in extra_words:
            if re.search(rf"\b{re.escape(w)}\b", s, flags=re.IGNORECASE):
                return True
    return False

def ensure_clean_or_raise(text: str):
    """Raise ValueError with a polite message if the text is offensive."""
    if is_offensive(text):
        raise ValueError(
            "Let’s keep it respectful. Please rephrase your request without offensive language."
        )
