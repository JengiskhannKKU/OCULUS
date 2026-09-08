"""Project persistence (JSON flat-file backend) — mirrors oculus/state.py's
own pattern exactly, kept as a separate store/file since a Project and an
Engagement are different top-level entities with their own id namespace."""
from __future__ import annotations

from datetime import datetime
from pathlib import Path

from ._home import ensure_home
from .models import Project


_STORE = Path.home() / ".oculus" / "projects"


def _ensure_store() -> None:
    ensure_home()
    _STORE.mkdir(parents=True, exist_ok=True)


def save(project: Project) -> Path:
    _ensure_store()
    project.updated_at = datetime.now()
    path = _STORE / f"{project.id}.json"
    path.write_text(project.model_dump_json(indent=2))
    return path


def load(project_id: str) -> Project:
    path = _STORE / f"{project_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"Project '{project_id}' not found in {_STORE}")
    return Project.model_validate_json(path.read_text())


def list_all() -> list[dict]:
    """Return lightweight summary dicts for all saved projects."""
    _ensure_store()
    summaries: list[dict] = []
    for path in sorted(_STORE.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            proj = Project.model_validate_json(path.read_text())
            summaries.append({
                "id":          proj.id,
                "name":        proj.name,
                "scope_notes": proj.scope_notes,
                "created_at":  proj.created_at.strftime("%Y-%m-%d %H:%M"),
                "updated_at":  proj.updated_at.strftime("%Y-%m-%d %H:%M"),
            })
        except Exception:
            pass
    return summaries


def delete(project_id: str) -> bool:
    path = _STORE / f"{project_id}.json"
    if path.exists():
        path.unlink()
        return True
    return False
