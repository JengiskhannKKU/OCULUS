"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ToolRunLog } from "@/lib/types";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export default function LogsPage() {
  const [logs, setLogs] = useState<ToolRunLog[]>([]);
  useEffect(() => { api.listToolRunLogs().then(setLogs).catch(() => setLogs([])); }, []);
  return <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, sm: 4 }, width: "100%" }}>
    <Typography variant="h5" sx={{ mb: 2, fontFamily: "var(--font-geist-mono)" }}>TOOL ERROR LOGS</Typography>
    <Stack spacing={2}>{logs.length === 0 && <Typography color="text.secondary">No failed tool runs recorded.</Typography>}
      {logs.map((log) => <Paper key={log.id} sx={{ p: 2 }}>
        <Typography variant="caption" color="text.secondary">{new Date(log.timestamp).toLocaleString()} · {log.id}</Typography>
        <Typography sx={{ fontFamily: "var(--font-geist-mono)" }}>{log.tool} · {log.item_id} · {log.kind}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>Command: <code>{log.command || "(unknown)"}</code></Typography>
        {log.error && <Typography color="error" variant="body2">{log.error}</Typography>}
        <Box component="pre" sx={{ overflow: "auto", whiteSpace: "pre-wrap", maxHeight: 280, mt: 1, p: 1, bgcolor: "action.hover", fontSize: 12 }}>{log.traceback || log.output || "No output captured."}</Box>
      </Paper>)}
    </Stack>
  </Box>;
}
