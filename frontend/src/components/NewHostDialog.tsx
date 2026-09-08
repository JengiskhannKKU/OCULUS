"use client";

import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { ENGAGEMENT_ICONS, DEFAULT_ENGAGEMENT_ICON, engagementIcon } from "@/lib/engagementIcons";
import { METHODOLOGIES, DEFAULT_METHODOLOGY } from "@/lib/methodologies";
import type { Engagement } from "@/lib/types";

function IconPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  return (
    <FormControl fullWidth>
      <InputLabel id="engagement-icon-label">Icon</InputLabel>
      <Select
        labelId="engagement-icon-label"
        label="Icon"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        renderValue={(val) => {
          const meta = engagementIcon(val);
          const { Icon } = meta;
          return (
            <Stack direction="row" alignItems="center" spacing={1}>
              <Icon fontSize="small" sx={{ color: meta.color }} />
              <span>{meta.label}</span>
            </Stack>
          );
        }}
      >
        {Object.entries(ENGAGEMENT_ICONS).map(([key, meta]) => {
          const { Icon } = meta;
          return (
            <MenuItem key={key} value={key}>
              <ListItemIcon>
                <Icon fontSize="small" sx={{ color: meta.color }} />
              </ListItemIcon>
              <ListItemText>{meta.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Select>
    </FormControl>
  );
}

function MethodologyPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
        Testing strategy / methodology
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        {Object.entries(METHODOLOGIES).map(([key, meta]) => {
          const selected = key === value;
          const { Icon } = meta;
          return (
            <Paper
              key={key}
              component="button"
              type="button"
              onClick={() => onChange(key)}
              elevation={0}
              sx={{
                flex: 1,
                textAlign: "left",
                cursor: "pointer",
                p: 1.5,
                display: "flex",
                flexDirection: "column",
                gap: 0.75,
                fontFamily: "inherit",
                border: "1px solid",
                borderColor: selected ? meta.color : "divider",
                bgcolor: selected ? `${meta.color}14` : "background.paper",
                boxShadow: selected
                  ? `0 0 0 1px ${meta.color}59, 0 0 14px ${meta.color}2e`
                  : "none",
                transition: "border-color 0.15s, box-shadow 0.15s, background-color 0.15s",
                "&:hover": { borderColor: meta.color },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: 1,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: `${meta.color}22`,
                    color: meta.color,
                  }}
                >
                  <Icon fontSize="small" />
                </Box>
                <Typography variant="body2" fontWeight={700}>
                  {meta.label}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                {meta.description}
              </Typography>
            </Paper>
          );
        })}
      </Stack>
    </Box>
  );
}

// The Target/Name/Notes/Icon/Methodology form for adding a host — used
// both by the flat /engagements page (no projectId, today's exact
// behavior) and a project's own "Add host" button (projectId set, so
// the created engagement is linked to that project). Owns its own form
// state and resets it on each open; the caller decides what happens
// next (toast + redirect) via onCreated.
export function NewHostDialog({
  open,
  onClose,
  onCreated,
  projectId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (engagement: Engagement) => void;
  projectId?: string;
}) {
  const toast = useToast();
  const [target, setTarget] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ENGAGEMENT_ICON);
  const [methodology, setMethodology] = useState(DEFAULT_METHODOLOGY);
  const [creating, setCreating] = useState(false);

  function reset() {
    setTarget("");
    setName("");
    setNotes("");
    setIcon(DEFAULT_ENGAGEMENT_ICON);
    setMethodology(DEFAULT_METHODOLOGY);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!target.trim()) return;
    setCreating(true);
    try {
      const eng = await api.createEngagement(
        target.trim(), name.trim(), notes.trim(), icon, methodology, projectId
      );
      toast.success(`Host "${eng.name}" created`);
      reset();
      onCreated(eng);
    } catch {
      toast.error("Failed to create host.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <form onSubmit={handleCreate}>
        <DialogTitle>{projectId ? "Add host" : "New engagement"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              required
              autoFocus
              fullWidth
              label="Target"
              placeholder="example.com"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
            <TextField
              fullWidth
              label="Name"
              placeholder="defaults to target"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label="Scope notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <IconPicker value={icon} onChange={setIcon} />
            <MethodologyPicker value={methodology} onChange={setMethodology} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={creating}>
            {creating ? "Creating…" : projectId ? "Add host" : "Create engagement"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
