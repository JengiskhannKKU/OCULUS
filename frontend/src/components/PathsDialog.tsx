"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Collapse from "@mui/material/Collapse";
import AddIcon from "@mui/icons-material/Add";
import RestoreIcon from "@mui/icons-material/Restore";
import CloseIcon from "@mui/icons-material/Close";
import { DirectoryTree } from "@/components/DirectoryTree";
import { PathGraph } from "@/components/PathGraph";
import { buildPathTree, collectStatuses } from "@/lib/pathTree";
import { useToast } from "@/lib/toast";
import type { EngagementPathEntry } from "@/lib/engagementPaths";

export function PathsDialog({
  entries,
  removedPaths,
  onAdd,
  onRemove,
  onRestore,
  onClose,
}: {
  entries: EngagementPathEntry[];
  removedPaths: string[];
  onAdd: (path: string, status: number | null, note: string) => Promise<void>;
  onRemove: (path: string) => void;
  onRestore: (path: string) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const [view, setView] = useState<"tree" | "graph">("tree");
  const [showHidden, setShowHidden] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [editPath, setEditPath] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editNote, setEditNote] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const tree = buildPathTree(entries);
  const statuses = collectStatuses(entries);

  // Editing works for any path in the tree, auto-discovered or not: saving
  // writes a manual entry for that exact path, which collectEngagementPaths
  // lets win the collision with the tool-parsed one — so a tester can
  // correct a status a scan got wrong (a 403 they've since bypassed to
  // 200) or attach a note ("creds admin/admin", "LFI here") without the
  // next re-scan clobbering it.
  function openEdit(path: string) {
    const entry = entries.find((e) => e.path === path);
    setEditPath(path);
    setEditStatus(entry?.status != null ? String(entry.status) : "");
    setEditNote(entry?.note ?? "");
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPath) return;
    setSavingEdit(true);
    try {
      await onAdd(editPath, editStatus.trim() ? Number(editStatus.trim()) : null, editNote.trim());
      setEditPath(null);
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newPath.trim()) return;
    setAdding(true);
    try {
      await onAdd(newPath.trim(), newStatus.trim() ? Number(newStatus.trim()) : null, newNote.trim());
      setNewPath("");
      setNewStatus("");
      setNewNote("");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" slotProps={{ paper: { sx: { height: "75vh" } } }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2.5, py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Paths
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {entries.length} discovered across every tool run in this engagement — updates live as
            scans finish.
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Stack>
      <DialogContent sx={{ display: "flex", flexDirection: "column", overflow: "hidden", p: 2.5 }}>
        <Box component="form" onSubmit={handleAdd} mb={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <TextField
              size="small"
              placeholder="/new/path"
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              sx={{ width: 180 }}
            />
            <TextField
              size="small"
              placeholder="status (optional)"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value.replace(/[^0-9]/g, ""))}
              sx={{ width: 130 }}
            />
            <TextField
              size="small"
              placeholder="note (optional)"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              sx={{ flex: 1, minWidth: 140 }}
            />
            <IconButton
              type="submit"
              size="small"
              disabled={!newPath.trim() || adding}
              sx={{ border: "1px solid", borderColor: "primary.main", borderRadius: 1 }}
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Box>

        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
          {statuses.length > 0 ? (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {statuses.map((s) => {
                const count = entries.filter((e) => e.status === s).length;
                const isOpen = s === 200;
                const isAuthWalled = s === 401 || s === 403;
                const color = isOpen ? "#22c55e" : isAuthWalled ? "#f59e0b" : "#64748b";
                return (
                  <Chip
                    key={s}
                    size="small"
                    variant="outlined"
                    label={`${s} × ${count}`}
                    sx={{ color, borderColor: color, fontFamily: "var(--font-geist-mono)" }}
                  />
                );
              })}
            </Stack>
          ) : (
            <Box />
          )}
          <ToggleButtonGroup
            size="small"
            exclusive
            value={view}
            onChange={(_, v) => v && setView(v)}
            sx={{ "& .MuiToggleButton-root": { px: 1.25, py: 0.25, fontSize: 11, textTransform: "none" } }}
          >
            <ToggleButton value="tree">Tree</ToggleButton>
            <ToggleButton value="graph">Graph</ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            borderRadius: 1,
            bgcolor: "#000",
            border: "1px solid rgba(255,255,255,0.08)",
            px: 1,
            py: 0.5,
          }}
        >
          {view === "tree" ? (
            <DirectoryTree
              root={tree}
              maxHeight="100%"
              onRunHere={() =>
                toast.info(
                  "Open the checklist item that found this path, then use its own Tree view to run a tool here."
                )
              }
              onRemove={onRemove}
              onEdit={openEdit}
              emptyMessage="No paths/endpoints discovered yet — run ffuf, gobuster, katana, or add one above."
            />
          ) : (
            <PathGraph
              root={tree}
              maxHeight="100%"
              onRemove={onRemove}
              emptyMessage="No paths/endpoints discovered yet — run ffuf, gobuster, katana, or add one above."
            />
          )}
        </Box>

        {removedPaths.length > 0 && (
          <Box mt={1}>
            <Button
              size="small"
              onClick={() => setShowHidden((v) => !v)}
              sx={{ fontSize: 11, textTransform: "none", color: "text.secondary" }}
            >
              {showHidden ? "Hide" : "Show"} hidden ({removedPaths.length})
            </Button>
            <Collapse in={showHidden}>
              <Stack spacing={0.5} mt={0.5}>
                {removedPaths.map((p) => (
                  <Stack
                    key={p}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ fontFamily: "var(--font-geist-mono)", fontSize: 12, color: "text.secondary", px: 1 }}
                  >
                    <span>{p}</span>
                    <Tooltip title="Restore">
                      <IconButton size="small" onClick={() => onRestore(p)}>
                        <RestoreIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            </Collapse>
          </Box>
        )}
      </DialogContent>

      <Dialog open={editPath !== null} onClose={() => setEditPath(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 15, fontFamily: "var(--font-geist-mono)" }}>
          {editPath}
        </DialogTitle>
        <Box component="form" onSubmit={saveEdit}>
          <DialogContent sx={{ pt: 0 }}>
            <Stack spacing={2} mt={1}>
              <TextField
                size="small"
                label="Status"
                placeholder="e.g. 200 — leave blank for unknown"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value.replace(/[^0-9]/g, ""))}
                fullWidth
              />
              <TextField
                size="small"
                label="Note"
                placeholder="e.g. bypassed auth with X, LFI param `file`"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                multiline
                minRows={2}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button size="small" onClick={() => setEditPath(null)}>
              Cancel
            </Button>
            <Button size="small" type="submit" variant="contained" disabled={savingEdit}>
              Save
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Dialog>
  );
}
