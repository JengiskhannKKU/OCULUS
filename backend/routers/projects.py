"""Projects — an optional grouping layer over Engagements ("hosts").

A Project has no target/methodology/checklist of its own; those all
still live on each Engagement underneath it via Engagement.project_id.
See oculus/project_store.py and oculus/models.py's Project docstring.
"""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from oculus import project_store, state
from oculus.models import Project

router = APIRouter(prefix="/api/projects", tags=["projects"])


class NewProject(BaseModel):
    name: str
    notes: str = ""


def _project_summary(proj: dict, hosts: list[dict]) -> dict:
    """A project's own summary dict, enriched with a host_count and a
    findings/critical/high roll-up summed across its hosts — the same
    three severity counts state.list_all() already computes per-host, so
    this is just a sum, not a second traversal of any engagement's own
    checklist items.
    """
    return {
        **proj,
        "host_count": len(hosts),
        "findings":   sum(h["findings"] for h in hosts),
        "critical":   sum(h["critical"] for h in hosts),
        "high":       sum(h["high"] for h in hosts),
    }


@router.get("")
def list_projects() -> list[dict]:
    all_hosts = state.list_all()
    result = []
    for proj in project_store.list_all():
        hosts = [h for h in all_hosts if h.get("project_id") == proj["id"]]
        result.append(_project_summary(proj, hosts))
    return result


@router.post("")
def create_project(body: NewProject) -> Project:
    if not body.name.strip():
        raise HTTPException(status_code=400, detail="Project name is required")
    project = Project(name=body.name.strip(), scope_notes=body.notes)
    project_store.save(project)
    return project


@router.get("/{project_id}")
def get_project(project_id: str) -> dict:
    try:
        project = project_store.load(project_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    hosts = [h for h in state.list_all() if h.get("project_id") == project_id]
    return {"project": project.model_dump(mode="json"), "hosts": hosts}


@router.delete("/{project_id}")
def delete_project(project_id: str) -> dict:
    try:
        project_store.load(project_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Project '{project_id}' not found")
    # Cascade: a host with no parent project left would be an orphaned
    # engagement the tester never explicitly chose to keep standalone —
    # confirm-dialog on the frontend spells out the host count before
    # this is ever called, same "permanently delete, cannot be undone"
    # posture the single-engagement delete already uses.
    hosts = [h for h in state.list_all() if h.get("project_id") == project_id]
    for h in hosts:
        state.delete(h["id"])
    project_store.delete(project_id)
    return {"deleted": project_id, "hosts_deleted": len(hosts)}
