"""Durable, bounded structured logs for tool executions."""
from __future__ import annotations

import json
import threading
import traceback
import uuid
from datetime import datetime, timezone
from pathlib import Path

from oculus._home import ensure_home

_LOG_FILE = Path.home() / ".oculus" / "logs" / "tool-runs.jsonl"
_LOCK = threading.Lock()
_MAX_OUTPUT = 50_000


def record(**fields) -> dict:
    entry = {
        "id": uuid.uuid4().hex[:12],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **fields,
    }
    entry["output"] = str(entry.get("output", ""))[-_MAX_OUTPUT:]
    _LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with _LOCK, _LOG_FILE.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry, ensure_ascii=False) + "\n")
    return entry


def exception_text(exc: BaseException) -> str:
    return "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))


def list_logs(limit: int = 100, eng_id: str | None = None) -> list[dict]:
    if not _LOG_FILE.exists():
        return []
    result = []
    for line in reversed(_LOG_FILE.read_text(encoding="utf-8").splitlines()):
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if eng_id and entry.get("engagement_id") != eng_id:
            continue
        result.append(entry)
        if len(result) >= max(1, min(limit, 500)):
            break
    return result
