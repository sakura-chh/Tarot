"""为无账号的本地应用限制接口来源、请求体和频率。"""

import asyncio
import json
import math
import time
from collections import OrderedDict, deque
from threading import Lock
from urllib.parse import urlsplit

from starlette.datastructures import Headers
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

MAX_BODY_BYTES = 4096
CSP = (
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
    "img-src 'self' blob: data:; media-src 'self' blob:; font-src 'self'; "
    "connect-src 'self'; worker-src 'self'; manifest-src 'self'; "
    "object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"
)


def unique_json_object(pairs):
    # 拒绝重复键，避免校验层与业务层对同一 JSON 得出不同参数。
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate JSON key")
        result[key] = value
    return result


def invalid_json_constant(_value):
    raise ValueError("Non-finite JSON value")


class RateLimiter:
    """使用有界滑动窗口限流；调用方传来的代理头不能作为可信 IP。"""

    def __init__(self, write_limit=30, read_limit=240, window=60, max_clients=4096):
        self.limits = {"write": write_limit, "read": read_limit}
        self.window, self.max_clients = window, max_clients
        self.clients = OrderedDict()
        self.lock = Lock()

    def check(self, ip: str, kind: str) -> int:
        now = time.monotonic()
        with self.lock:
            # 按最近请求排序，先清理过期客户端，避免限流状态无限增长。
            while self.clients and next(iter(self.clients.values()))[0] <= now - self.window:
                self.clients.popitem(last=False)
            if ip not in self.clients:
                if len(self.clients) >= self.max_clients:
                    return self.window
                self.clients[ip] = (now, {"read": deque(), "write": deque()})
            _, windows = self.clients[ip]
            self.clients[ip] = (now, windows)
            self.clients.move_to_end(ip)
            events = windows[kind]
            while events and events[0] <= now - self.window:
                events.popleft()
            if len(events) >= self.limits[kind]:
                return max(1, math.ceil(self.window - (now - events[0])))
            events.append(now)
        return 0


def origin_key(value: str):
    # 来源按协议、主机和有效端口比较，不能只比较主机名。
    try:
        parsed = urlsplit(value)
        if (
            parsed.scheme not in ("http", "https")
            or not parsed.hostname
            or parsed.username is not None
            or parsed.password is not None
            or parsed.path not in ("", "/")
            or parsed.query
            or parsed.fragment
        ):
            return None
        return (
            parsed.scheme,
            parsed.hostname.lower(),
            parsed.port or (443 if parsed.scheme == "https" else 80),
        )
    except ValueError:
        return None


class SecurityMiddleware:
    def __init__(
        self, app: ASGIApp, allowed_hosts, allowed_origins=(), limiter=None, api_docs=False
    ):
        self.app = app
        self.allowed_hosts = {host.lower() for host in allowed_hosts}
        self.allowed_origins = {origin_key(origin) for origin in allowed_origins}
        self.allowed_origins.discard(None)
        self.limiter = limiter or RateLimiter()
        self.api_docs = api_docs

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        headers = Headers(scope=scope)

        async def protected_send(message):
            if message["type"] == "http.response.start":
                policy = CSP
                if self.api_docs and scope["path"] in ("/docs", "/redoc", "/docs/oauth2-redirect"):
                    # 开发文档依赖 CDN 和内联初始化脚本，仅文档路径放宽 CSP。
                    policy = (
                        CSP.replace(
                            "script-src 'self'",
                            "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'",
                        )
                        .replace("style-src 'self'", "style-src 'self' https://cdn.jsdelivr.net")
                        .replace("img-src 'self'", "img-src 'self' https://fastapi.tiangolo.com")
                    )
                response_headers = dict(message.get("headers", []))
                response_headers.update(
                    {
                        b"content-security-policy": policy.encode(),
                        b"x-content-type-options": b"nosniff",
                        b"x-frame-options": b"DENY",
                        b"referrer-policy": b"no-referrer",
                        b"cross-origin-resource-policy": b"same-origin",
                        b"permissions-policy": b"camera=(), microphone=(), geolocation=()",
                    }
                )
                if scope["path"].startswith("/api/"):
                    response_headers[b"cache-control"] = b"no-store"
                message = {**message, "headers": list(response_headers.items())}
            await send(message)

        async def reject(status, code, message, extra_headers=None):
            await JSONResponse(
                {"error": {"code": code, "message": message}},
                status_code=status,
                headers=extra_headers,
            )(scope, receive, protected_send)

        host = headers.get("host", "")
        target_origin = origin_key(f"{scope['scheme']}://{host}")
        if not target_origin or target_origin[1] not in self.allowed_hosts:
            await reject(400, "INVALID_HOST", "请求的站点地址不被允许。")
            return
        if len(scope.get("raw_path", b"")) + len(scope.get("query_string", b"")) > 2048:
            await reject(414, "URI_TOO_LONG", "请求地址过长。")
            return
        if scope["path"].startswith("/api/"):
            origin = headers.get("origin")
            if (
                origin is not None
                and origin_key(origin) not in {target_origin, *self.allowed_origins}
            ) or headers.get("sec-fetch-site") == "cross-site":
                await reject(403, "CROSS_ORIGIN_DENIED", "请从本站发起请求。")
                return
            kind = "read" if scope["method"] in ("GET", "HEAD", "OPTIONS") else "write"
            retry = self.limiter.check((scope.get("client") or ("unknown",))[0], kind)
            if retry:
                await reject(
                    429, "RATE_LIMITED", "请求过于频繁，请稍后重试。", {"Retry-After": str(retry)}
                )
                return
            if kind == "write":
                if (
                    headers.get("content-type", "").split(";", 1)[0].strip().lower()
                    != "application/json"
                    or headers.get("content-encoding", "identity").lower() != "identity"
                ):
                    await reject(415, "UNSUPPORTED_MEDIA_TYPE", "请求必须使用未压缩的 JSON。")
                    return
                try:
                    length = int(headers.get("content-length", "0"))
                    if length < 0:
                        raise ValueError
                except ValueError:
                    await reject(400, "INVALID_CONTENT_LENGTH", "请求长度不正确。")
                    return
                if length > MAX_BODY_BYTES:
                    await reject(413, "PAYLOAD_TOO_LARGE", "请求内容过大。")
                    return
                # 请求长度头可能缺失或伪造，因此还要逐块累计实际接收字节。
                body = bytearray()
                try:
                    async with asyncio.timeout(5):
                        while True:
                            chunk = await receive()
                            if chunk["type"] == "http.disconnect":
                                return
                            body.extend(chunk.get("body", b""))
                            if len(body) > MAX_BODY_BYTES:
                                await reject(413, "PAYLOAD_TOO_LARGE", "请求内容过大。")
                                return
                            if not chunk.get("more_body", False):
                                break
                except TimeoutError:
                    await reject(408, "REQUEST_TIMEOUT", "请求内容接收超时。")
                    return
                try:
                    json.loads(
                        body,
                        object_pairs_hook=unique_json_object,
                        parse_constant=invalid_json_constant,
                    )
                except (ValueError, RecursionError):
                    await reject(422, "VALIDATION_ERROR", "JSON 格式不正确或结构过深。")
                    return
                delivered = False

                async def buffered_receive():
                    nonlocal delivered
                    if not delivered:
                        delivered = True
                        return {"type": "http.request", "body": bytes(body), "more_body": False}
                    return await receive()

                await self.app(scope, buffered_receive, protected_send)
                return
        await self.app(scope, receive, protected_send)
