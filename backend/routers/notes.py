from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from oculus import state
from oculus.models import Note, NoteKind

from ..deps import get_item, load_engagement

router = APIRouter(prefix="/api/engagements/{eng_id}/items/{item_id}/notes", tags=["notes"])


class NewNote(BaseModel):
    kind: NoteKind = NoteKind.TEXT
    content: str = ""


class NoteUpdate(BaseModel):
    kind: NoteKind | None = None
    content: str | None = None


@router.post("")
def add_note(eng_id: str, item_id: str, body: NewNote) -> Note:
    engagement = load_engagement(eng_id)
    item = get_item(engagement, item_id)
    note = Note(kind=body.kind, content=body.content)
    item.notes.append(note)
    state.save(engagement)
    return note


@router.patch("/{note_id}")
def update_note(eng_id: str, item_id: str, note_id: str, body: NoteUpdate) -> Note:
    engagement = load_engagement(eng_id)
    item = get_item(engagement, item_id)
    note = next((n for n in item.notes if n.id == note_id), None)
    if note is None:
        raise HTTPException(status_code=404, detail=f"Note '{note_id}' not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(note, field, value)

    state.save(engagement)
    return note


@router.delete("/{note_id}")
def delete_note(eng_id: str, item_id: str, note_id: str) -> dict:
    engagement = load_engagement(eng_id)
    item = get_item(engagement, item_id)
    before = len(item.notes)
    item.notes = [n for n in item.notes if n.id != note_id]
    if len(item.notes) == before:
        raise HTTPException(status_code=404, detail=f"Note '{note_id}' not found")
    state.save(engagement)
    return {"deleted": note_id}
