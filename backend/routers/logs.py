from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Query

from ..run_logs import list_logs

router = APIRouter(prefix="/api/logs", tags=["logs"])


@router.get("/tool-runs")
def tool_run_logs(limit: int = Query(100, ge=1, le=500), eng_id: Optional[str] = None) -> list[dict]:
    return list_logs(limit=limit, eng_id=eng_id)
