"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import AddIcon from "@mui/icons-material/Add";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { EngagementCard } from "@/components/EngagementCard";
import { NewHostDialog } from "@/components/NewHostDialog";
import { CollapsibleText } from "@/components/CollapsibleText";
import type { Project, EngagementSummary } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [hosts, setHosts] = useState<EngagementSummary[] | null>(null);
  const [error, setError] = useState("");
  const [showAddHost, setShowAddHost] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    try {
      const { project, hosts } = await api.getProject(params.id);
      setProject(project);
      setHosts(hosts);
      setError("");
    } catch {
      setError("Could not load this project. It may have been deleted.");
      setHosts([]);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteEngagement(deleteTarget.id);
      toast.success(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
      refresh();
    } catch {
      toast.error("Failed to delete host.");
    } finally {
      setDeleting(false);
    }
  }

  const loading = hosts === null;

  return (
    <Container maxWidth="lg" sx={{ py: 6, flex: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4}>
        <Box minWidth={0}>
          <Typography
            component={Link}
            href="/projects"
            variant="caption"
            sx={{ color: "text.secondary", textDecoration: "none", "&:hover": { color: "text.primary" } }}
          >
            ← Projects
          </Typography>
          {project ? (
            <>
              <Typography variant="h5" fontWeight={700} noWrap>
                {project.name}
              </Typography>
              {project.scope_notes && (
                <Box sx={{ maxWidth: 640 }}>
                  <CollapsibleText>
                    <Typography variant="body2" color="text.secondary">
                      {project.scope_notes}
                    </Typography>
                  </CollapsibleText>
                </Box>
              )}
            </>
          ) : (
            <Skeleton variant="text" width={240} height={36} />
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowAddHost(true)}
          sx={{ flexShrink: 0 }}
        >
          Add host
        </Button>
      </Stack>

      <NewHostDialog
        open={showAddHost}
        onClose={() => setShowAddHost(false)}
        projectId={params.id}
        onCreated={() => {
          setShowAddHost(false);
          refresh();
        }}
      />

      {error && (
        <Typography
          variant="body2"
          sx={{ mb: 3, px: 2, py: 1.2, borderRadius: 1, bgcolor: "rgba(239,68,68,0.12)", color: "#f87171" }}
        >
          {error}
        </Typography>
      )}

      {!loading && hosts.length === 0 ? (
        <Paper sx={{ px: 4, py: 8, textAlign: "center", borderStyle: "dashed" }}>
          <Typography fontWeight={600} mb={0.5}>
            No hosts in this project yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add each host that&apos;s in scope — each one gets its own target and checklist
            (WSTG or OSCP), picked when you add it.
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
            ? Array.from({ length: 3 }).map((_, i) => (
                <Paper key={i} sx={{ p: 2.5 }}>
                  <Skeleton variant="text" width="65%" height={28} />
                  <Skeleton variant="text" width="40%" sx={{ mb: 2 }} />
                  <Skeleton variant="rounded" height={6} sx={{ mb: 2, borderRadius: 3 }} />
                  <Skeleton variant="text" width="45%" />
                </Paper>
              ))
            : hosts.map((h, i) => (
                <EngagementCard
                  key={h.id}
                  engagement={h}
                  onDelete={() => setDeleteTarget({ id: h.id, name: h.name })}
                  delay={Math.min(i * 0.04, 0.3)}
                />
              ))}
        </Box>
      )}

      <Dialog
        open={deleteTarget !== null}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete host?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently delete <strong>&ldquo;{deleteTarget?.name}&rdquo;</strong> and
            all of its checklist items, findings, and tool output. This cannot be undone.
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
