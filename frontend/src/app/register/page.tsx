"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmation) { setError("Passwords do not match."); return; }
    setBusy(true); setError("");
    try {
      const result = await api.register(username, password);
      localStorage.setItem("oculus_access_token", result.access_token);
      router.replace("/projects");
    } catch (err) { setError(err instanceof Error ? err.message : "Registration failed"); }
    finally { setBusy(false); }
  }

  return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2 }}>
    <Paper component="form" onSubmit={submit} sx={{ p: 4, width: "100%", maxWidth: 420 }}><Stack spacing={2}>
      <Typography variant="h5" sx={{ fontFamily: "var(--font-geist-mono)" }}>CREATE ACCOUNT</Typography>
      <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoFocus />
      <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" helperText="At least 8 characters" />
      <TextField label="Confirm password" type="password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} autoComplete="new-password" />
      {error && <Typography color="error" variant="body2">{error}</Typography>}
      <Button type="submit" variant="contained" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
      <Button component={Link} href="/login" variant="text">Back to sign in</Button>
    </Stack></Paper>
  </Box>;
}
