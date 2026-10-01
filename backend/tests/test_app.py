import hashlib
import json
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.rules import shuffled_slots
from app.settings import ROOT

DATASET = json.loads((ROOT / "backend/content/cards.json").read_text())


@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(tmp_path / "test.sqlite3"), base_url="http://127.0.0.1") as value:
        yield value


def request_body(**changes):
    return {
        "request_id": str(uuid4()),
        "deck_id": "provided-deck-v1",
        "dataset_version": DATASET["dataset_version"],
        "mode": "free",
        "count": 10,
        "reversed_enabled": True,
        "reversed_probability": 50,
        **changes,
    }


def test_catalog_integrity_and_sources(client):
    response = client.get("/api/v1/cards").json()
    assert response["total"] == 78
    cards = response["items"]
    assert len({c["id"] for c in cards}) == 78
    assert sum(c["arcana"] == "major" for c in cards) == 22
    for suit in ["wands", "cups", "swords", "pentacles"]:
        assert sum(c["suit"] == suit for c in cards) == 14
    assert client.get("/api/v1/cards/major_justice").json()["display_number"] == 8
    assert client.get("/api/v1/cards/major_strength").json()["display_number"] == 11
    assert client.get("/api/v1/cards/wands_08").json()["name_zh"] == "权杖八"


def test_complete_meanings_reach_api_and_offline_dataset(client):
    cards = client.get("/api/v1/cards").json()["items"]
    for card in cards:
        assert card["meaning_version"] == "2"
        assert card["meaning_upright"].strip() and card["meaning_reversed"].strip()
        details = card["meaning_details"]
        assert details["overview"].strip() and details["symbolism"].strip()
        for direction in ("upright", "reversed"):
            assert all(
                details[direction][topic].strip()
                for topic in ("general", "love", "career", "advice")
            )
        assert card["meaning_source"]["name"] == "神婆网"
        assert card["meaning_source"]["url"].startswith("https://www.shenpowang.com/taluopai/")
    source_by_id = {card["id"]: card["meaning_source"]["url"] for card in cards}
    assert source_by_id["major_justice"].endswith("/d23145.html")
    assert source_by_id["major_strength"].endswith("/d23122.html")
    manifest = client.get("/api/v1/resources/manifest").json()
    offline = client.get(manifest["dataset_url"]).json()
    assert offline == DATASET
    assert offline["cards"] == cards


def test_queries_intersect_filters(client):
    assert (
        client.get("/api/v1/cards", params={"q": "THE FOOL"}).json()["items"][0]["id"]
        == "major_fool"
    )
    assert (
        client.get("/api/v1/cards", params={"q": "女教皇"}).json()["items"][0]["id"]
        == "major_high_priestess"
    )
    assert (
        client.get("/api/v1/cards", params={"arcana": "major", "suit": "cups"}).json()["total"] == 0
    )
    assert client.get("/api/v1/cards", params={"q": "不存在的词"}).json()["total"] == 0
    assert client.get("/api/v1/cards/no-card").status_code == 404
    assert client.get("/api/v1/cards", params={"suit": "invalid"}).status_code == 422


@pytest.mark.parametrize(
    "enabled,probability,expected", [(False, 100, False), (True, 0, False), (True, 100, True)]
)
def test_reversal_boundaries_and_uniqueness(client, enabled, probability, expected):
    response = client.post(
        "/api/v1/draw-sessions",
        json=request_body(reversed_enabled=enabled, reversed_probability=probability),
    )
    assert response.status_code == 201
    slots = response.json()["slots"]
    assert len(slots) == len({s["card_id"] for s in slots}) == 78
    assert all(s["is_reversed"] is expected for s in slots)


@pytest.mark.parametrize(
    "change",
    [
        {"count": 0},
        {"count": 11},
        {"count": 1.2},
        {"reversed_probability": 101},
        {"mode": "daily", "count": 3},
        {"mode": "past_present_future", "count": 1},
        {"question": "private content"},
        {"reversed_enabled": "false"},
    ],
)
def test_invalid_requests(client, change):
    assert client.post("/api/v1/draw-sessions", json=request_body(**change)).status_code == 422


def test_idempotency_and_conflict(client):
    body = request_body()
    first = client.post("/api/v1/draw-sessions", json=body)
    again = client.post("/api/v1/draw-sessions", json=body)
    assert first.status_code == 201 and again.status_code == 200
    assert first.json() == again.json()
    assert client.post("/api/v1/draw-sessions", json={**body, "count": 3}).status_code == 409


def test_concurrent_retries_same_result(client):
    body = request_body()
    with ThreadPoolExecutor(max_workers=4) as pool:
        responses = list(
            pool.map(lambda _: client.post("/api/v1/draw-sessions", json=body), range(4))
        )
    assert sorted(r.status_code for r in responses) == [200, 200, 200, 201]
    assert len({r.json()["session_id"] for r in responses}) == 1


def test_version_error_not_html(client):
    assert client.get("/api/v1/datasets/old").status_code == 409
    assert client.get("/api/v1/not-an-api").status_code == 404
    assert client.get("/health").json() == {"status": "ok"}


def test_shared_random_vector():
    vector = json.loads((ROOT / "shared-contracts/draw-vectors.json").read_text())
    values = iter(vector["random_values"])
    slots = shuffled_slots(
        [{"id": name} for name in vector["cards"]],
        True,
        vector["probability"],
        lambda _: next(values),
    )
    assert [s["card_id"] for s in slots] == vector["expected_ids"]
    assert [s["is_reversed"] for s in slots] == vector["expected_reversed"]


def test_resource_manifest_hashes(client):
    manifest = client.get("/api/v1/resources/manifest").json()
    assert manifest["total_bytes"] == sum(item["bytes"] for item in manifest["items"])
    for item in manifest["items"]:
        path = ROOT / item["url"].lstrip("/")
        data = path.read_bytes()
        assert len(data) == item["bytes"]
        assert hashlib.sha256(data).hexdigest() == item["sha256"]


def test_supplied_music_is_downloadable_audio_with_range_support(client):
    manifest = client.get("/api/v1/resources/manifest").json()
    music = DATASET["audio"]["music"]
    assert "/music-" in music
    resource = next(item for item in manifest["items"] if item["url"] == music)
    assert resource["group"] == "audio" and not resource["required"]
    response = client.get(music, headers={"Range": "bytes=0-63"})
    assert response.status_code == 206
    assert len(response.content) == 64
    assert b"ftyp" in response.content
