# Backend (FastAPI)
## Setup
python -m venv .venv
.\.venv\Scripts\activate
pip install -U pip
pip install -r requirements.txt

## Run (dev)
# from backend/
python -m uvicorn src.app.main:app --reload

## Test
# new terminal:
curl "http://127.0.0.1:8000/health"
curl "http://127.0.0.1:8000/api/search?q=harry%20potter&limit=5"