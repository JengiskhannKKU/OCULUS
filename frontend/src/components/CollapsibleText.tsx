"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";

// Clamps arbitrary content — a paragraph, a bullet list, a code block,
// anything — to a fixed collapsed height and offers a "Show more/Show
// less" toggle, but only when the content actually overflows that
// height. Overflow is measured directly (scrollHeight vs the collapsed
// height), not guessed from character count, so a genuinely short
// description/note never grows a pointless toggle underneath it.
export function CollapsibleText({
  children,
  collapsedHeight = 72,
}: {
  children: React.ReactNode;
  collapsedHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflows, setOverflows] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setOverflows(el.scrollHeight > collapsedHeight + 1);
  }, [children, collapsedHeight]);

  return (
    <Box>
      <Box ref={ref} sx={{ maxHeight: expanded ? "none" : collapsedHeight, overflow: "hidden" }}>
        {children}
      </Box>
      {overflows && (
        <Button
          size="small"
          onClick={() => setExpanded((v) => !v)}
          sx={{ mt: 0.5, minWidth: 0, p: 0, fontSize: 12, textTransform: "none", "&:hover": { bgcolor: "transparent" } }}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      )}
    </Box>
  );
}
