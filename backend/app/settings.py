import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = Path(os.environ.get("TAROT_DB_PATH", ROOT / "var/tarot.sqlite3"))
MEDIA_PATH = ROOT / "media"
FRONTEND_PATH = ROOT / "frontend/dist"
