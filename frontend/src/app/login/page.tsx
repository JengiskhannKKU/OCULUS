"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { const result = await api.login(username, password); localStorage.setItem("oculus_access_token", result.access_token); router.replace("/projects"); }
    catch (err) { setError(err instanceof Error ? err.message : "Login failed"); }
    finally { setBusy(false); }
  }
  return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
    <Paper component="form" onSubmit={submit} sx={{ p: 4, width: "100%", maxWidth: 420 }}><Stack spacing={2}>
      <Typography variant="h5" sx={{ fontFamily: "var(--font-geist-mono)" }}>OCULUS LOGIN</Typography>
      <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
      <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
      {error && <Typography color="error" variant="body2">{error}</Typography>}
      <Button type="submit" variant="contained" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
      <Button component={Link} href="/register" variant="text">Create an account</Button>
      <Typography variant="caption" color="text.secondary">Set OCULUS_USERNAME and OCULUS_PASSWORD before the first backend start to change the default.</Typography>
    </Stack></Paper>
  </Box>;
}
