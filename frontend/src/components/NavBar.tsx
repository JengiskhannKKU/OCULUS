"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import { SettingsDialog } from "@/components/SettingsDialog";
import { ToolsCatalog } from "@/components/ToolsCatalog";

export function NavBar() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false);

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ maxWidth: 1200, width: "100%", mx: "auto", px: { xs: 2, sm: 3 } }}>
        <Box
          component={Link}
          href="/"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <Box
            component="img"
            src="/logo.svg"
            alt=""
            width={22}
            height={22}
            sx={{ filter: "drop-shadow(0 0 4px rgba(94,234,212,0.5))" }}
          />
          <Typography
            sx={{
              fontFamily: "var(--font-geist-mono)",
              fontWeight: 700,
              letterSpacing: 3,
              fontSize: 14,
              color: "text.primary",
            }}
          >
            [ OCULUS ]
          </Typography>
        </Box>
        <Box flex={1} />
        <Button
          component={Link}
          href="/projects"
          size="small"
          sx={{ fontSize: 12.5, letterSpacing: 1 }}
        >
          DASHBOARD
        </Button>
        <Button component={Link} href="/logs" size="small" sx={{ fontSize: 12.5, letterSpacing: 1 }}>ERROR LOGS</Button>
        <IconButton
          size="small"
          onClick={() => setShowTools(true)}
          title="Tools"
          sx={{ ml: 1, color: "text.secondary" }}
        >
          <BuildOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" title="Sign out" onClick={() => { localStorage.removeItem("oculus_access_token"); router.replace("/login"); }} sx={{ ml: 1, color: "text.secondary" }}>
          <LogoutOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => setShowSettings(true)}
          title="Settings"
          sx={{ ml: 1, color: "text.secondary" }}
        >
          <SettingsOutlinedIcon fontSize="small" />
        </IconButton>
      </Toolbar>

      {showSettings && <SettingsDialog onClose={() => setShowSettings(false)} />}
      {showTools && <ToolsCatalog onClose={() => setShowTools(false)} />}
    </AppBar>
  );
}
