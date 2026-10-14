// Re-running a tool on the same checklist item appends its new output to
// the same `item.tool_outputs[tool]` string, fenced with a separator that
// oculus/orchestrator.py writes verbatim:
//
//   \n\n====================================================================== (70 =)
//   # Re-run at 2026-09-10T03:44:29 — ffuf -u http://... -recursion ...
//   ====================================================================== (70 =)
//   \n\n
//
// So one tab can hold several runs concatenated. This splits that blob
// back into individual runs (chronological, oldest first) so the Tool
// output panel can show one run at a time instead of a wall of stacked
// scans.

export interface ToolRun {
  index: number; // 0-based, chronological
  label: string; // "Run 1", "Run 2", ...
  timestamp: string | null; // ISO string from the separator; null for the first run
  command: string | null; // the exact command line of this re-run; null for the first run
  text: string; // just this run's output, separator stripped
}

const RUN_SEPARATOR_RE = /\n*={20,}\n# Re-run at (\S+)\s+[—-]\s+(.*)\n={20,}\n*/g;

export function splitToolRuns(output: string): ToolRun[] {
  const runs: ToolRun[] = [];
  let lastIndex = 0;
  let pending: { timestamp: string | null; command: string | null } = {
    timestamp: null,
    command: null,
  };

  RUN_SEPARATOR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RUN_SEPARATOR_RE.exec(output))) {
    runs.push({ index: 0, label: "", ...pending, text: output.slice(lastIndex, m.index) });
    pending = { timestamp: m[1], command: m[2].trim() };
    lastIndex = RUN_SEPARATOR_RE.lastIndex;
  }
  runs.push({ index: 0, label: "", ...pending, text: output.slice(lastIndex) });

  return runs.map((r, i) => ({ ...r, index: i, label: `Run ${i + 1}` }));
}

// "2026-09-10T03:44:29" -> "09-10 03:44:29"; anything unparseable passes
// through untouched.
export function formatRunTimestamp(ts: string | null): string {
  if (!ts) return "";
  const m = ts.match(/^\d{4}-(\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
  return m ? `${m[1]} ${m[2]}` : ts;
}
