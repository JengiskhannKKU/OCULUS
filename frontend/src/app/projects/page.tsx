"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import InputAdornment from "@mui/material/InputAdornment";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { ProjectSummary } from "@/lib/types";

function StatCard({ label, value, color, delay }: { label: string; value: string | number; color?: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      style={{ flex: 1, minWidth: 130 }}
    >
      <Paper sx={{ px: 2.5, py: 2 }}>
        <Typography variant="h4" fontWeight={700} sx={{ color: color ?? "text.primary" }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
      </Paper>
    </motion.div>
  );
}

function ProjectCard({
  project,
  onDelete,
  delay,
}: {
  project: ProjectSummary;
  onDelete: () => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      style={{ height: "100%" }}
    >
      <Paper
        component={Link}
        href={`/projects/${project.id}`}
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: 2.5,
          textDecoration: "none",
          color: "inherit",
          transition: "border-color 0.15s, box-shadow 0.15s, transform 0.15s",
          "&:hover": {
            borderColor: "primary.main",
            boxShadow: "0 0 0 1px rgba(94,234,212,0.35), 0 0 20px rgba(94,234,212,0.13)",
            transform: "translateY(-2px)",
          },
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1.5} spacing={1}>
          <Stack direction="row" spacing={1.25} alignItems="center" minWidth={0}>
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(94,234,212,0.1)",
                color: "primary.main",
              }}
            >
              <AccountTreeOutlinedIcon fontSize="small" />
            </Box>
            <Box minWidth={0}>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {project.name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {project.id}
              </Typography>
            </Box>
          </Stack>
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete();
            }}
            sx={{ color: "text.secondary", flexShrink: 0, "&:hover": { color: "#ef4444" } }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>

        {project.scope_notes && (
          <Typography
            variant="body2"
            color="text.secondary"
            mb={2}
            sx={{
              flex: 1,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {project.scope_notes}
          </Typography>
        )}

        <Stack direction="row" justifyContent="space-between" alignItems="center" mt="auto">
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              label={`${project.host_count} host${project.host_count === 1 ? "" : "s"}`}
              variant="outlined"
              sx={{ height: 20, fontSize: 11 }}
            />
            <Typography variant="body2">
              {project.findings} finding{project.findings === 1 ? "" : "s"}
            </Typography>
            {project.critical > 0 && (
              <Chip
                size="small"
                label={`${project.critical} crit`}
                sx={{ bgcolor: "#dc2626", color: "#fff", height: 20, fontSize: 11 }}
              />
            )}
            {project.high > 0 && (
              <Chip
                size="small"
                label={`${project.high} high`}
                sx={{ bgcolor: "#f97316", color: "#fff", height: 20, fontSize: 11 }}
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.disabled" flexShrink={0}>
            {project.created_at}
          </Typography>
        </Stack>
      </Paper>
    </motion.div>
  );
}

export default function ProjectsPage() {
  const router = useRouter();
  const toast = useToast();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; hostCount: number } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    try {
      setProjects(await api.listProjects());
      setError("");
    } catch {
      setError("Could not reach the backend API. Is it running?");
      setProjects([]);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    refresh();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const proj = await api.createProject(name.trim(), notes.trim());
      toast.success(`Project "${proj.name}" created`);
      router.push(`/projects/${proj.id}`);
    } catch {
      toast.error("Failed to create project.");
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteProject(deleteTarget.id);
      toast.success(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
      refresh();
    } catch {
      toast.error("Failed to delete project.");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = useMemo(() => {
    if (!projects) return [];
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(q));
  }, [projects, query]);

  const totals = useMemo(() => {
    if (!projects) return { count: 0, hosts: 0, findings: 0, critical: 0 };
    return projects.reduce(
      (acc, p) => ({
        count: acc.count + 1,
        hosts: acc.hosts + p.host_count,
        findings: acc.findings + p.findings,
        critical: acc.critical + p.critical,
      }),
      { count: 0, hosts: 0, findings: 0, critical: 0 }
    );
  }, [projects]);

  const loading = projects === null;

  return (
    <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box>
          <Typography
            component={Link}
            href="/"
            variant="caption"
            sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "text.primary" } }}
          >
            ← oculus
          </Typography>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              component="img"
              src="/logo.svg"
              alt=""
              width={26}
              height={26}
              sx={{ filter: "drop-shadow(0 0 4px rgba(94,234,212,0.5))" }}
            />
            <Typography variant="h5" fontWeight={700}>
              Projects
            </Typography>
          </Stack>
          <Typography
            component={Link}
            href="/engagements"
            variant="caption"
            sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "primary.main" } }}
          >
            All hosts (flat list) →
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
          New Project
        </Button>
      </Stack>

      {!loading && projects.length > 0 && (
        <Stack direction="row" spacing={2} mb={4} flexWrap="wrap" useFlexGap>
          <StatCard label="Projects" value={totals.count} delay={0} />
          <StatCard label="Hosts" value={totals.hosts} delay={0.05} />
          <StatCard label="Total findings" value={totals.findings} delay={0.1} />
          <StatCard
            label="Critical"
            value={totals.critical}
            color={totals.critical > 0 ? "#ef4444" : undefined}
            delay={0.15}
          />
        </Stack>
      )}

      <Dialog open={showForm} onClose={() => setShowForm(false)} fullWidth maxWidth="sm">
        <form onSubmit={handleCreate}>
          <DialogTitle>New project</DialogTitle>
          <DialogContent>
            <Stack spacing={2} mt={1}>
              <TextField
                required
                autoFocus
                fullWidth
                label="Name"
                placeholder="e.g. Nethergate Ryall Bank Assessment"
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
              <Typography variant="caption" color="text.secondary">
                Add hosts (each with its own target and checklist) once the project is created.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creating}>
              {creating ? "Creating…" : "Create project"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {error && (
        <Typography
          variant="body2"
          sx={{ mb: 3, px: 2, py: 1.2, borderRadius: 1, bgcolor: "rgba(239,68,68,0.12)", color: "#f87171" }}
        >
          {error}
        </Typography>
      )}

      {!loading && projects.length > 0 && (
        <TextField
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          sx={{ mb: 2, maxWidth: 320 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
            },
          }}
        />
      )}

      {!loading && projects.length === 0 ? (
        <Paper sx={{ px: 4, py: 8, textAlign: "center", borderStyle: "dashed" }}>
          <Typography fontWeight={600} mb={0.5}>
            No projects yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create one, then add each host that&apos;s part of it — each host still picks its own
            target and checklist.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Paper key={i} sx={{ p: 2.5 }}>
                  <Skeleton variant="text" width="65%" height={28} />
                  <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
                  <Skeleton variant="text" width="45%" />
                </Paper>
              ))
            : filtered.length === 0 ? (
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No projects match &ldquo;{query}&rdquo;.
                  </Typography>
                </Box>
              ) : (
                filtered.map((p, i) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    onDelete={() => setDeleteTarget({ id: p.id, name: p.name, hostCount: p.host_count })}
                    delay={Math.min(i * 0.04, 0.3)}
                  />
                ))
              )}
        </Box>
      )}

      <Dialog
        open={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete project?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong>
            {deleteTarget && deleteTarget.hostCount > 0 && (
              <>
                {" "}and all <strong>{deleteTarget.hostCount}</strong> host
                {deleteTarget.hostCount === 1 ? "" : "s"} under it — every checklist item,
                finding, and piece of evidence they hold
              </>
            )}
            . This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button onClick={confirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
