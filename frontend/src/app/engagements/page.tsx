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
import Skeleton from "@mui/material/Skeleton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import AccountTreeOutlinedIcon from "@mui/icons-material/AccountTreeOutlined";
import InputAdornment from "@mui/material/InputAdornment";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { EngagementCard } from "@/components/EngagementCard";
import { NewHostDialog } from "@/components/NewHostDialog";
import type { EngagementSummary } from "@/lib/types";

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

export default function EngagementsPage() {
  const router = useRouter();
  const toast = useToast();
  const [engagements, setEngagements] = useState<EngagementSummary[] | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    try {
      setEngagements(await api.listEngagements());
      setError("");
    } catch {
      setError("Could not reach the backend API. Is it running?");
      setEngagements([]);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    refresh();
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteEngagement(deleteTarget.id);
      toast.success(`Deleted "${deleteTarget.name}"`);
      setDeleteTarget(null);
      refresh();
    } catch {
      toast.error("Failed to delete engagement.");
    } finally {
      setDeleting(false);
    }
  }

  const filtered = useMemo(() => {
    if (!engagements) return [];
    const q = query.trim().toLowerCase();
    if (!q) return engagements;
    return engagements.filter(
      (e) => e.name.toLowerCase().includes(q) || e.target.toLowerCase().includes(q)
    );
  }, [engagements, query]);

  const totals = useMemo(() => {
    if (!engagements) return { count: 0, findings: 0, critical: 0, high: 0 };
    return engagements.reduce(
      (acc, e) => ({
        count: acc.count + 1,
        findings: acc.findings + e.findings,
        critical: acc.critical + e.critical,
        high: acc.high + e.high,
      }),
      { count: 0, findings: 0, critical: 0, high: 0 }
    );
  }, [engagements]);

  const loading = engagements === null;

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
              Engagements
            </Typography>
          </Stack>
          <Typography
            component={Link}
            href="/projects"
            variant="caption"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              mt: 0.5,
              color: "text.secondary",
              textDecoration: "none",
              "&:hover": { color: "primary.main" },
            }}
          >
            <AccountTreeOutlinedIcon sx={{ fontSize: 14 }} />
            Grouped by project? See Projects →
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
          New Engagement
        </Button>
      </Stack>

      {!loading && engagements.length > 0 && (
        <Stack direction="row" spacing={2} mb={4} flexWrap="wrap" useFlexGap>
          <StatCard label="Engagements" value={totals.count} delay={0} />
          <StatCard label="Total findings" value={totals.findings} delay={0.05} />
          <StatCard
            label="Critical"
            value={totals.critical}
            color={totals.critical > 0 ? "#ef4444" : undefined}
            delay={0.1}
          />
          <StatCard
            label="High"
            value={totals.high}
            color={totals.high > 0 ? "#f97316" : undefined}
            delay={0.15}
          />
        </Stack>
      )}

      <NewHostDialog
        open={showForm}
        onClose={() => setShowForm(false)}
        onCreated={(eng) => {
          setShowForm(false);
          router.push(`/engagements/${eng.id}`);
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

      {!loading && engagements.length > 0 && (
        <TextField
          size="small"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or target…"
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

      {!loading && engagements.length === 0 ? (
        <Paper
          sx={{
            px: 4,
            py: 8,
            textAlign: "center",
            borderStyle: "dashed",
          }}
        >
          <Typography fontWeight={600} mb={0.5}>
            No engagements yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create one to start working through the OWASP WSTG checklist.
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
                  <Skeleton variant="rounded" height={6} sx={{ mb: 2, borderRadius: 3 }} />
                  <Skeleton variant="text" width="45%" />
                </Paper>
              ))
            : filtered.length === 0 ? (
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <Typography color="text.secondary" textAlign="center" py={4}>
                    No engagements match &ldquo;{query}&rdquo;.
                  </Typography>
                </Box>
              ) : (
                filtered.map((e, i) => (
                  <EngagementCard
                    key={e.id}
                    engagement={e}
                    onDelete={() => setDeleteTarget({ id: e.id, name: e.name })}
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
        <DialogTitle>Delete engagement?</DialogTitle>
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
