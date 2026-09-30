import json
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from fastapi import FastAPI, Query, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from .repository import ApiError, Repository
from .rules import search_cards
from .schemas import DrawRequest
from .settings import DB_PATH, FRONTEND_PATH, MEDIA_PATH, ROOT


def create_app(db_path: Path = DB_PATH):
    @asynccontextmanager
    async def lifespan(application: FastAPI):
        dataset = json.loads((ROOT / "backend/content/cards.json").read_text())
        application.state.repo = Repository(db_path, dataset)
        yield

    application = FastAPI(title="纸境 · Tarot API", version="0.1.0", lifespan=lifespan)

    @application.exception_handler(ApiError)
    async def api_error(_request: Request, error: ApiError):
        return JSONResponse(
            {"error": {"code": error.code, "message": error.message}}, status_code=error.status
        )

    @application.exception_handler(RequestValidationError)
    async def validation_error(_request: Request, _error: RequestValidationError):
        return JSONResponse(
            {"error": {"code": "VALIDATION_ERROR", "message": "参数格式或范围不正确。"}},
            status_code=422,
        )

    @application.get("/health")
    def health():
        return {"status": "ok"}

    @application.get("/api/v1/meta")
    def meta():
        data = application.state.repo.dataset
        return {
            "app_version": "0.1.0",
            "dataset_version": data["dataset_version"],
            "schema_version": "1",
            "card_count": 78,
            "deck_id": data["deck_id"],
        }

    @application.get("/api/v1/cards")
    def cards(
        q: str = Query("", max_length=100),
        arcana: Literal["major", "minor"] | None = None,
        suit: Literal["swords", "wands", "pentacles", "cups"] | None = None,
        dataset_version: str | None = None,
    ):
        repo = application.state.repo
        repo.check_version(dataset_version)
        items = search_cards(repo.cards(), q, arcana, suit)
        return {
            "dataset_version": repo.dataset["dataset_version"],
            "total": len(items),
            "items": items,
        }

    @application.get("/api/v1/cards/{card_id}")
    def card(card_id: str, dataset_version: str | None = None):
        repo = application.state.repo
        repo.check_version(dataset_version)
        result = next((c for c in repo.cards() if c["id"] == card_id), None)
        if not result:
            raise ApiError(404, "CARD_NOT_FOUND", "找不到这张牌。")
        return result

    @application.get("/api/v1/spreads")
    def spreads(dataset_version: str | None = None):
        application.state.repo.check_version(dataset_version)
        return application.state.repo.dataset["spreads"]

    @application.post("/api/v1/draw-sessions")
    def session(body: DrawRequest):
        result, created = application.state.repo.create_session(body)
        return JSONResponse(result, status_code=201 if created else 200)

    @application.get("/api/v1/resources/manifest")
    def manifest():
        return FileResponse(MEDIA_PATH / "manifest.json", headers={"Cache-Control": "no-cache"})

    @application.get("/api/v1/datasets/{version}")
    def dataset(version: str):
        application.state.repo.check_version(version)
        manifest_data = json.loads((MEDIA_PATH / "manifest.json").read_text())
        return FileResponse(ROOT / manifest_data["dataset_url"].lstrip("/"))

    if MEDIA_PATH.exists():
        application.mount("/media", StaticFiles(directory=MEDIA_PATH), name="media")

    @application.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        if path.startswith(("api/", "media/")):
            return JSONResponse({"error": {"code": "NOT_FOUND", "message": "接口不存在。"}}, 404)
        target = (FRONTEND_PATH / path).resolve()
        if target.is_relative_to(FRONTEND_PATH.resolve()) and target.is_file():
            headers = {"Cache-Control": "no-cache"} if path in ("sw.js", "index.html") else {}
            return FileResponse(target, headers=headers)
        if (FRONTEND_PATH / "index.html").exists():
            return FileResponse(FRONTEND_PATH / "index.html", headers={"Cache-Control": "no-cache"})
        return JSONResponse({"message": "请先运行 npm --prefix frontend run build"}, 503)

    return application


app = create_app()
