"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ProgressBar } from "@/components/SeverityBar";
import { engagementIcon } from "@/lib/engagementIcons";
import { methodologyLabel } from "@/lib/methodologies";
import type { EngagementSummary } from "@/lib/types";

// One host card — used on both the flat /engagements list and a
// project's own host grid (/projects/[id]), so it always links to the
// same unmodified /engagements/[id] detail page regardless of where
// it's rendered from.
export function EngagementCard({
  engagement,
  onDelete,
  delay,
}: {
  engagement: EngagementSummary;
  onDelete: () => void;
  delay: number;
}) {
  const [done, total] = engagement.progress.split("/").map(Number);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay }}
      style={{ height: "100%" }}
    >
      <Paper
        component={Link}
        href={`/engagements/${engagement.id}`}
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
            {(() => {
              const { Icon, color, label } = engagementIcon(engagement.icon);
              return (
                <Tooltip title={label}>
                  <Box
                    sx={{
                      width: 34,
                      height: 34,
                      borderRadius: 1,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: `${color}1a`,
                      color,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                </Tooltip>
              );
            })()}
            <Box minWidth={0}>
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {engagement.name}
                </Typography>
                <Chip
                  label={methodologyLabel(engagement.methodology)}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: 10, flexShrink: 0 }}
                />
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: "var(--font-geist-mono)" }}
              >
                {engagement.id}
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

        <Typography
          variant="body2"
          color="text.secondary"
          noWrap
          mb={2}
          sx={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {engagement.target}
        </Typography>

        <Box mb={2} mt="auto">
          <ProgressBar done={done || 0} total={total || 0} />
        </Box>

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="body2">
              {engagement.findings} finding{engagement.findings === 1 ? "" : "s"}
            </Typography>
            {engagement.critical > 0 && (
              <Chip
                size="small"
                label={`${engagement.critical} crit`}
                sx={{ bgcolor: "#dc2626", color: "#fff", height: 20, fontSize: 11 }}
              />
            )}
            {engagement.high > 0 && (
              <Chip
                size="small"
                label={`${engagement.high} high`}
                sx={{ bgcolor: "#f97316", color: "#fff", height: 20, fontSize: 11 }}
              />
            )}
          </Stack>
          <Typography variant="caption" color="text.disabled" flexShrink={0}>
            {engagement.created_at}
          </Typography>
        </Stack>
      </Paper>
    </motion.div>
  );
}
