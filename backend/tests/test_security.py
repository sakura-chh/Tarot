"""Attack regression cases use isolated SQLite databases, never personal data."""

import json
import sqlite3
import time
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.repository import ApiError, Repository
from app.schemas import DrawRequest
from app.security import MAX_BODY_BYTES, RateLimiter, SecurityMiddleware
from app.settings import ROOT

DATASET = json.loads((ROOT / "backend/content/cards.json").read_text())


def body(**changes):
    return {
        "request_id": str(uuid4()),
        "deck_id": DATASET["deck_id"],
        "dataset_version": DATASET["dataset_version"],
        "mode": "free",
        "count": 1,
        "reversed_enabled": True,
        "reversed_probability": 50,
        **changes,
    }


@pytest.fixture
def client(tmp_path):
    with TestClient(
        create_app(tmp_path / "security.sqlite3"), base_url="http://127.0.0.1"
    ) as value:
        yield value


@pytest.mark.parametrize(
    "headers",
    [
        {"Origin": "https://evil.example"},
        {"Origin": "null"},
        {"Origin": "http://127.0.0.1:9999"},
        {"Origin": "http://127.0.0.1.evil.example:8000"},
        {"Origin": "http://evil.example@127.0.0.1"},
        {"Sec-Fetch-Site": "cross-site"},
    ],
)
def test_foreign_requests_do_not_create_sessions(client, headers):
    assert client.post("/api/v1/draw-sessions", json=body(), headers=headers).status_code == 403
    with client.app.state.repo.connect() as connection:
        assert connection.execute("SELECT COUNT(*) FROM draw_sessions").fetchone()[0] == 0
    assert client.get("/api/v1/cards", headers=headers).status_code == 403


def test_same_origin_and_nonbrowser_clients_work(client):
    assert (
        client.post(
            "/api/v1/draw-sessions", json=body(), headers={"Origin": "http://127.0.0.1"}
        ).status_code
        == 201
    )
    assert client.post("/api/v1/draw-sessions", json=body()).status_code == 201


@pytest.mark.parametrize(
    "host",
    [
        "evil.example",
        "127.0.0.1.evil.example",
        "evil@127.0.0.1",
        "127.0.0.1/evil",
        "localhost:invalid",
    ],
)
def test_dns_rebinding_and_malformed_hosts(client, host):
    result = client.get("/api/v1/meta", headers={"Host": host})
    assert result.status_code == 400
    assert result.json()["error"]["code"] == "INVALID_HOST"


def test_deployment_allowlists_are_explicit(tmp_path):
    with TestClient(
        create_app(
            tmp_path / "custom.sqlite3",
            allowed_hosts=("tarot.example",),
            allowed_origins=("http://localhost:5173",),
        ),
        base_url="https://tarot.example",
    ) as c:
        assert c.get("/").status_code == 200
        assert (
            c.post(
                "/api/v1/draw-sessions", json=body(), headers={"Origin": "https://tarot.example"}
            ).status_code
            == 201
        )
        assert (
            c.post(
                "/api/v1/draw-sessions",
                json=body(),
                headers={"Origin": "http://localhost:5173", "Sec-Fetch-Site": "same-site"},
            ).status_code
            == 201
        )
        assert c.get("/health", headers={"Host": "attacker.example"}).status_code == 400


@pytest.mark.parametrize(
    "headers",
    [
        {"Content-Type": "text/plain"},
        {"Content-Type": "application/x-www-form-urlencoded"},
        {"Content-Type": "application/json", "Content-Encoding": "gzip"},
    ],
)
def test_json_content_type_required(client, headers):
    assert (
        client.post(
            "/api/v1/draw-sessions", content=json.dumps(body()), headers=headers
        ).status_code
        == 415
    )


def test_large_body_rejected_before_validation(client):
    result = client.post(
        "/api/v1/draw-sessions",
        content=" " * (MAX_BODY_BYTES + 1) + json.dumps(body()),
        headers={"Content-Type": "application/json"},
    )
    assert result.status_code == 413
    assert result.headers["x-content-type-options"] == "nosniff"


@pytest.mark.parametrize(
    "payload",
    [
        "[[" * 1000 + "0" + "]]" * 1000,
        '{"count":1,"count":2}',
        '{"count":NaN}',
        '{"count":Infinity}',
        "{",
        '{"nested":{"x":1,"x":2}}',
    ],
)
def test_malformed_deep_duplicate_and_nonfinite_json(client, payload):
    result = client.post(
        "/api/v1/draw-sessions", content=payload, headers={"Content-Type": "application/json"}
    )
    assert result.status_code == 422
    assert "Traceback" not in result.text


@pytest.mark.parametrize(
    "change",
    [
        {"dataset_version": ""},
        {"deck_id": ""},
        {"deck_id": "a" * 65},
        {"dataset_version": "a" * 65},
        {"deck_id": "' OR 1=1--"},
        {"dataset_version": "../../.env"},
        {"count": True},
        {"reversed_probability": "50"},
        {"request_id": "' OR 1=1--"},
    ],
)
def test_input_abuse_rejected(client, change):
    assert client.post("/api/v1/draw-sessions", json=body(**change)).status_code == 422
    assert client.get("/api/v1/cards").json()["total"] == 78


def test_read_sql_injection_is_literal_search(client):
    assert client.get("/api/v1/cards", params={"q": "' OR 1=1 --"}).json()["total"] == 0
    assert client.get("/api/v1/cards", params={"q": "x" * 101}).status_code == 422
    assert client.get("/api/v1/cards", params={"dataset_version": ""}).status_code == 422
    assert client.get("/api/v1/cards", params={"q": "x" * 3000}).status_code == 414


def test_rate_limits_apply_to_threads_and_ignore_forged_ip(tmp_path):
    limiter = RateLimiter(write_limit=4, read_limit=3)
    with TestClient(
        create_app(tmp_path / "limits.sqlite3", limiter=limiter), base_url="http://127.0.0.1"
    ) as c:
        with ThreadPoolExecutor(max_workers=8) as pool:
            replies = list(
                pool.map(
                    lambda _: c.post(
                        "/api/v1/draw-sessions",
                        json=body(),
                        headers={"X-Forwarded-For": str(uuid4())},
                    ),
                    range(8),
                )
            )
        assert sum(r.status_code == 201 for r in replies) == 4
        assert sum(r.status_code == 429 for r in replies) == 4
        for response in replies:
            if response.status_code == 429:
                assert 0 < int(response.headers["retry-after"]) <= 60
        assert [c.get("/api/v1/meta").status_code for _ in range(4)] == [200, 200, 200, 429]
        assert c.get("/health").status_code == 200


def test_limiter_recovery_and_bounded_memory(monkeypatch):
    now = [100.0]
    monkeypatch.setattr("app.security.time.monotonic", lambda: now[0])
    limiter = RateLimiter(write_limit=1, max_clients=2)
    assert limiter.check("a", "write") == 0
    assert limiter.check("a", "write") == 60
    assert limiter.check("b", "write") == 0
    assert limiter.check("c", "write") == 60
    assert len(limiter.clients) == 2
    now[0] += 61
    assert limiter.check("c", "write") == 0
    assert len(limiter.clients) == 1


def test_session_storage_bound_preserves_idempotency(tmp_path):
    repo = Repository(tmp_path / "capacity.sqlite3", DATASET, max_sessions=2)
    first = DrawRequest(**body())
    initial, _ = repo.create_session(first)
    repo.create_session(DrawRequest(**body()))
    with pytest.raises(ApiError) as error:
        repo.create_session(DrawRequest(**body()))
    assert error.value.code == "SESSION_CAPACITY"
    again, created = repo.create_session(first)
    assert not created and again == initial
    with repo.connect() as connection:
        connection.execute(
            "UPDATE draw_sessions SET expires_at=? WHERE request_id!=?",
            (time.time() - 1, str(first.request_id)),
        )
    assert repo.create_session(DrawRequest(**body()))[1]


def test_storage_errors_are_generic_and_connections_close(tmp_path):
    repo = Repository(tmp_path / "failure.sqlite3", DATASET)
    with repo.connect() as connection:
        connection.execute("SELECT 1")
    with pytest.raises(sqlite3.ProgrammingError):
        connection.execute("SELECT 1")
    with pytest.raises(ApiError) as error:
        with repo.connect() as connection:
            connection.execute("SELECT * FROM missing_table")
    assert error.value.status == 503
    assert "missing_table" not in error.value.message


@pytest.mark.parametrize(
    "path",
    [
        "/.env",
        "/.git/config",
        "/backend/app/main.py",
        "/assets/missing.js",
        "/%2e%2e%2f.env",
        "/media/%2e%2e/.env",
        "/media/v1/%2e%2e/%2e%2e/README.md",
    ],
)
def test_sensitive_paths_and_missing_assets_are_not_html(client, path):
    response = client.get(path)
    assert response.status_code == 404
    assert "text/html" not in response.headers.get("content-type", "")
    assert "Traceback" not in response.text


def test_security_headers_api_cache_and_routes(client):
    for path in [
        "/",
        "/draw",
        "/cards",
        "/history",
        "/settings",
        "/health",
        "/api/v1/cards",
        "/no-resource",
    ]:
        result = client.get(path)
        assert result.headers["x-content-type-options"] == "nosniff"
        assert result.headers["x-frame-options"] == "DENY"
        assert "script-src 'self'" in result.headers["content-security-policy"]
        assert "frame-ancestors 'none'" in result.headers["content-security-policy"]
        assert "connect-src 'self'" in result.headers["content-security-policy"]
    response = client.post("/api/v1/draw-sessions", json=body())
    assert response.headers["cache-control"] == "no-store"
    assert "access-control-allow-origin" not in response.headers
    assert client.get("/openapi.json").status_code == 404
    assert client.get("/docs").status_code == 404


def test_docs_only_when_explicitly_enabled(tmp_path):
    with TestClient(
        create_app(tmp_path / "docs.sqlite3", api_docs=True), base_url="http://127.0.0.1"
    ) as c:
        assert c.get("/docs").status_code == 200
        assert c.get("/openapi.json").json()["openapi"]
        assert "cdn.jsdelivr.net" in c.get("/docs").headers["content-security-policy"]
        assert "cdn.jsdelivr.net" not in c.get("/").headers["content-security-policy"]


@pytest.mark.anyio
@pytest.mark.parametrize("declared_length", [None, "1"])
async def test_chunked_and_forged_length_cannot_bypass_limit(declared_length):
    called = False

    async def app(scope, receive, send):
        nonlocal called
        called = True

    middleware = SecurityMiddleware(app, allowed_hosts=("127.0.0.1",))
    headers = [(b"host", b"127.0.0.1"), (b"content-type", b"application/json")]
    if declared_length:
        headers.append((b"content-length", declared_length.encode()))
    scope = {
        "type": "http",
        "path": "/api/v1/draw-sessions",
        "raw_path": b"/api/v1/draw-sessions",
        "query_string": b"",
        "scheme": "http",
        "method": "POST",
        "headers": headers,
        "client": ("127.0.0.1", 100),
    }
    chunks = iter(
        [
            {"type": "http.request", "body": b" " * 2000, "more_body": True},
            {"type": "http.request", "body": b" " * 3000, "more_body": False},
        ]
    )

    async def receive():
        return next(chunks)

    sent = []

    async def send(message):
        sent.append(message)

    await middleware(scope, receive, send)
    assert not called
    assert sent[0]["status"] == 413


@pytest.fixture
def anyio_backend():
    return "asyncio"
