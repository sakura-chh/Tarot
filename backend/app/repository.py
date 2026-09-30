import hashlib
import json
import sqlite3
import time
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from .rules import shuffled_slots
from .settings import ROOT


class ApiError(Exception):
    def __init__(self, status: int, code: str, message: str):
        self.status, self.code, self.message = status, code, message


class Repository:
    def __init__(self, db_path: Path, dataset: dict):
        self.db_path, self.dataset = db_path, dataset
        db_path.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as connection:
            connection.executescript((ROOT / "backend/migrations/001_init.sql").read_text())
            connection.executemany(
                "INSERT OR REPLACE INTO cards VALUES(?, ?)",
                [(card["id"], json.dumps(card, ensure_ascii=False)) for card in dataset["cards"]],
            )

    def connect(self):
        return sqlite3.connect(self.db_path, timeout=10)

    def cards(self):
        with self.connect() as connection:
            return sorted(
                [json.loads(row[0]) for row in connection.execute("SELECT payload FROM cards")],
                key=lambda card: card["sort_order"],
            )

    def check_version(self, version: str | None):
        if version and version != self.dataset["dataset_version"]:
            raise ApiError(409, "DATASET_VERSION_UNAVAILABLE", "数据版本已更新，请更新资源。")

    def create_session(self, request):
        self.check_version(request.dataset_version)
        if request.deck_id != self.dataset["deck_id"]:
            raise ApiError(404, "DECK_NOT_FOUND", "找不到这套牌。")
        parameters = request.model_dump(mode="json")
        request_id = parameters.pop("request_id")
        digest = hashlib.sha256(json.dumps(parameters, sort_keys=True).encode()).hexdigest()
        with self.connect() as connection:
            # A database lock and unique request key keep concurrent retries on the same deck.
            connection.execute("BEGIN IMMEDIATE")
            connection.execute("DELETE FROM draw_sessions WHERE expires_at < ?", (time.time(),))
            existing = connection.execute(
                "SELECT parameter_hash, response_json FROM draw_sessions WHERE request_id = ?",
                (request_id,),
            ).fetchone()
            if existing:
                if existing[0] != digest:
                    raise ApiError(409, "IDEMPOTENCY_CONFLICT", "同一请求不能更改抽牌参数。")
                return json.loads(existing[1]), False
            now = datetime.now(UTC)
            result = {
                **parameters,
                "session_id": f"server-{uuid4()}",
                "request_id": request_id,
                "source": "server",
                "schema_version": "1",
                "rules_version": "1",
                "created_at": now.isoformat(),
                "expires_at": (now + timedelta(days=1)).isoformat(),
                "settings_snapshot": {
                    "reversed_enabled": request.reversed_enabled,
                    "reversed_probability": request.reversed_probability,
                },
                "slots": shuffled_slots(
                    self.dataset["cards"], request.reversed_enabled, request.reversed_probability
                ),
            }
            connection.execute(
                "INSERT INTO draw_sessions VALUES(?, ?, ?, ?)",
                (request_id, digest, json.dumps(result), time.time() + 86400),
            )
            return result, True
