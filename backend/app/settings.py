import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DB_PATH = Path(os.environ.get("TAROT_DB_PATH", ROOT / "var/tarot.sqlite3"))
MEDIA_PATH = ROOT / "media"
FRONTEND_PATH = ROOT / "frontend/dist"
ALLOWED_HOSTS = tuple(
    host.strip()
    for host in os.environ.get("TAROT_ALLOWED_HOSTS", "127.0.0.1,localhost,::1").split(",")
    if host.strip()
)
ALLOWED_ORIGINS = tuple(
    origin.strip()
    for origin in os.environ.get("TAROT_ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
)
API_DOCS = os.environ.get("TAROT_ENABLE_API_DOCS") == "1"
