"""FastAPI entry point: `uvicorn backend.main:app --reload`."""
from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from .auth import verify_token
from .routers import auth, config, engagements, evidence, findings, items, logs, notes, paths, ports, projects, reports, tools
from .ws import router as ws_router

app = FastAPI(title="oculus web", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    # A fixed allow_origins=[":3000"] used to be here — broke the moment
    # the frontend ran on any other port, which run-frontend.sh/run.sh
    # both explicitly support as their whole point (`./run-frontend.sh
    # 3001 8000`, confirmed via a real report: the browser's preflight
    # OPTIONS request got a 400 back for exactly this reason, port
    # mismatch). Regex instead — any port on localhost/127.0.0.1, still
    # scoped to local dev only, not opened to the wider internet.
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def authentication_middleware(request: Request, call_next):
    if request.method == "OPTIONS" or request.url.path in {"/api/health", "/api/auth/login", "/api/auth/register"}:
        return await call_next(request)
    if request.url.path.startswith("/api/"):
        token = request.headers.get("authorization", "").removeprefix("Bearer ").strip()
        # Browser download links cannot attach an Authorization header.
        token = token or request.query_params.get("token")
        if not verify_token(token):
            return JSONResponse(status_code=401, content={"detail": "Authentication required"})
    return await call_next(request)

app.include_router(auth.router)
app.include_router(config.router)
app.include_router(engagements.router)
app.include_router(projects.router)
app.include_router(items.router)
app.include_router(evidence.router)
app.include_router(paths.router)
app.include_router(ports.router)
app.include_router(findings.router)
app.include_router(notes.router)
app.include_router(tools.router)
app.include_router(reports.router)
app.include_router(logs.router)
app.include_router(ws_router)


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
