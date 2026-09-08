"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { ChecklistItem, Note, NoteKind } from "@/lib/types";

const KIND_LABEL: Record<NoteKind, string> = {
  text: "Text",
  list: "List",
  code: "Code",
};

const KIND_PLACEHOLDER: Record<NoteKind, string> = {
  text: "Write a note…",
  list: "One item per line…",
  code: "Paste a command, snippet, or raw output…",
};

// Renders one note's content according to its kind — a plain paragraph
// for "text", one bullet per non-blank line for "list", or a monospace
// block for "code" (same whitespace-safe pre-wrap FindingsPanel's own
// evidence block uses, so a long unbroken line wraps instead of running
// off the card).
function NoteBody({ note }: { note: Note }) {
  if (note.kind === "list") {
    const lines = note.content.split("\n").map((l) => l.trim()).filter(Boolean);
    return (
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {lines.map((line, i) => (
          <Typography key={i} component="li" variant="body2" color="text.secondary">
            {line}
          </Typography>
        ))}
      </Box>
    );
  }
  if (note.kind === "code") {
    return (
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 1.25,
          borderRadius: 1,
          bgcolor: "rgba(0,0,0,0.4)",
          fontSize: 12,
          fontFamily: "var(--font-geist-mono)",
          whiteSpace: "pre-wrap",
          overflowWrap: "anywhere",
          overflowX: "auto",
        }}
      >
        {note.content}
      </Box>
    );
  }
  return (
    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
      {note.content}
    </Typography>
  );
}

// A shared add/edit form body — kind selector + content field, the
// placeholder and multiline row count adapting to the chosen kind so
// "code"/"list" get a visibly bigger box than a one-line "text" note.
function NoteForm({
  kind,
  setKind,
  content,
  setContent,
  onSave,
  onCancel,
  saving,
  saveLabel,
  autoFocus,
}: {
  kind: NoteKind;
  setKind: (k: NoteKind) => void;
  content: string;
  setContent: (c: string) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  saveLabel: string;
  autoFocus?: boolean;
}) {
  return (
    <Stack spacing={1.5}>
      <TextField
        select
        size="small"
        label="Type"
        value={kind}
        onChange={(e) => setKind(e.target.value as NoteKind)}
        sx={{ maxWidth: 160 }}
      >
        {(Object.keys(KIND_LABEL) as NoteKind[]).map((k) => (
          <MenuItem key={k} value={k}>
            {KIND_LABEL[k]}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        autoFocus={autoFocus}
        fullWidth
        multiline
        minRows={kind === "text" ? 2 : 4}
        size="small"
        placeholder={KIND_PLACEHOLDER[kind]}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        slotProps={
          kind === "code"
            ? { input: { sx: { fontFamily: "var(--font-geist-mono)", fontSize: 13 } } }
            : undefined
        }
      />
      <Stack direction="row" spacing={1.5}>
        <Button size="small" variant="contained" disabled={saving || !content.trim()} onClick={onSave}>
          {saving ? "Saving…" : saveLabel}
        </Button>
        <Button size="small" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </Stack>
    </Stack>
  );
}

function NoteCard({
  note,
  engagementId,
  item,
  onChange,
}: {
  note: Note;
  engagementId: string;
  item: ChecklistItem;
  onChange: (item: ChecklistItem) => void;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [kind, setKind] = useState<NoteKind>(note.kind);
  const [content, setContent] = useState(note.content);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await api.updateNote(engagementId, item.id, note.id, { kind, content: content.trim() });
      onChange({ ...item, notes: item.notes.map((n) => (n.id === note.id ? updated : n)) });
      setEditing(false);
      toast.success("Note saved");
    } catch {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this note?")) return;
    try {
      await api.deleteNote(engagementId, item.id, note.id);
      onChange({ ...item, notes: item.notes.filter((n) => n.id !== note.id) });
      toast.success("Note deleted");
    } catch {
      toast.error("Failed to delete note");
    }
  }

  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, bgcolor: "rgba(255,255,255,0.02)" }}
    >
      {editing ? (
        <NoteForm
          kind={kind}
          setKind={setKind}
          content={content}
          setContent={setContent}
          onSave={handleSave}
          onCancel={() => {
            setKind(note.kind);
            setContent(note.content);
            setEditing(false);
          }}
          saving={saving}
          saveLabel="Save"
          autoFocus
        />
      ) : (
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Chip
              label={KIND_LABEL[note.kind]}
              size="small"
              variant="outlined"
              sx={{ height: 18, fontSize: 10 }}
            />
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" onClick={() => setEditing(true)} title="Edit">
                <EditIcon fontSize="inherit" />
              </IconButton>
              <IconButton size="small" onClick={handleDelete} title="Delete" sx={{ "&:hover": { color: "#ef4444" } }}>
                <DeleteOutlineIcon fontSize="inherit" />
              </IconButton>
            </Stack>
          </Stack>
          <NoteBody note={note} />
        </Stack>
      )}
    </Paper>
  );
}

// Per-item free-form notes — not one big textarea, a small list of notes
// a tester can add to independently, each its own "text"/"list"/"code"
// entry (e.g. a running bullet list of things left to check, kept
// separate from a pasted command snippet), same "small addable/editable/
// deletable entries" shape FindingsPanel/EvidencePanel already use on
// this same item.
export function NotesPanel({
  engagementId,
  item,
  onChange,
}: {
  engagementId: string;
  item: ChecklistItem;
  onChange: (item: ChecklistItem) => void;
}) {
  const toast = useToast();
  const [showForm, setShowForm] = useState(false);
  const [kind, setKind] = useState<NoteKind>("text");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    setSaving(true);
    try {
      const note = await api.addNote(engagementId, item.id, kind, content.trim());
      onChange({ ...item, notes: [...item.notes, note] });
      setContent("");
      setKind("text");
      setShowForm(false);
      toast.success("Note added");
    } catch {
      toast.error("Failed to add note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography variant="subtitle2" fontWeight={700}>
          Notes ({item.notes.length})
        </Typography>
        <Button size="small" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add note"}
        </Button>
      </Stack>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <Paper sx={{ p: 2, mb: 2 }}>
              <NoteForm
                kind={kind}
                setKind={setKind}
                content={content}
                setContent={setContent}
                onSave={handleAdd}
                onCancel={() => setShowForm(false)}
                saving={saving}
                saveLabel="Save note"
                autoFocus
              />
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {item.notes.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No notes on this item yet.
        </Typography>
      ) : (
        <Stack spacing={1}>
          {item.notes.map((note) => (
            <NoteCard key={note.id} note={note} engagementId={engagementId} item={item} onChange={onChange} />
          ))}
        </Stack>
      )}
    </Box>
  );
}
