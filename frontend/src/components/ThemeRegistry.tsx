"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Box from "@mui/material/Box";
import { theme } from "@/lib/theme";
import { GridBackground } from "@/components/GridBackground";
import { NavBar } from "@/components/NavBar";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ToastProvider } from "@/lib/toast";

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("oculus_access_token");
    if (!token && pathname !== "/login" && pathname !== "/register") router.replace("/login");
    else if (token && (pathname === "/login" || pathname === "/register")) router.replace("/projects");
    else window.setTimeout(() => setReady(true), 0);
  }, [pathname, router]);
  if (!ready) return null;
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GridBackground />
        <ToastProvider>
          <Box sx={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
            {pathname !== "/login" && pathname !== "/register" && <NavBar />}
            <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
              {children}
            </Box>
          </Box>
        </ToastProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
