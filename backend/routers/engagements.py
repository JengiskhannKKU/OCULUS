from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from oculus import project_store, state
from oculus.checklist import build_checklist, build_oscp_checklist
from oculus.models import Engagement

from ..deps import load_engagement

router = APIRouter(prefix="/api/engagements", tags=["engagements"])

# Methodology tag -> checklist builder. "other" intentionally falls back to
# the WSTG checklist as a starting point (see frontend/src/lib/
# methodologies.ts's own description of that option) rather than having a
# third checklist shape with nothing to actually distinguish it.
_CHECKLIST_BUILDERS = {
    "wstg": build_checklist,
    "oscp": build_oscp_checklist,
}


class NewEngagement(BaseModel):
    target: str
    name: str = ""
    notes: str = ""
    icon: str = "web"
    methodology: str = "wstg"
    # Parent Project this host belongs to — omitted/None creates a
    # standalone engagement, exactly today's behavior.
    project_id: Optional[str] = None


@router.get("")
def list_engagements(project_id: Optional[str] = None) -> list[dict]:
    engagements = state.list_all()
    if project_id is not None:
        engagements = [e for e in engagements if e.get("project_id") == project_id]
    return engagements


@router.post("")
def create_engagement(body: NewEngagement) -> Engagement:
    methodology = body.methodology or "wstg"
    build = _CHECKLIST_BUILDERS.get(methodology, build_checklist)
    engagement = Engagement(
        target=body.target,
        name=body.name or body.target,
        icon=body.icon or "web",
        methodology=methodology,
        scope_notes=body.notes,
        project_id=body.project_id,
        checklist_items=build(),
    )
    state.save(engagement)
    return engagement


@router.get("/{eng_id}")
def get_engagement(eng_id: str) -> dict:
    engagement = load_engagement(eng_id)
    payload = engagement.model_dump(mode="json")
    # Embed the parent project's name directly so the frontend's
    # breadcrumb on the engagement detail page doesn't need a second
    # fetch — None for a standalone engagement, or if the project was
    # since deleted (cascade-delete already removes its hosts too, so
    # this only matters for the brief window between the two, but stay
    # honest either way rather than 500ing on a stale project_id).
    payload["project_name"] = None
    if engagement.project_id:
        try:
            payload["project_name"] = project_store.load(engagement.project_id).name
        except FileNotFoundError:
            pass
    return payload


@router.delete("/{eng_id}")
def delete_engagement(eng_id: str) -> dict:
    if not state.delete(eng_id):
        raise HTTPException(status_code=404, detail=f"Engagement '{eng_id}' not found")
    return {"deleted": eng_id}
