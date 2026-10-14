// Lines that are pure progress/status noise from a live-streaming tool —
// ffuf's repeating "::  Progress: [1038084/1185254] :: Job [1/1] :: 3472
// req/sec :: Duration: [0:04:58] :: Errors: 0 ::" ticker being the
// motivating case, which can print thousands of lines over a long run and
// bury any real finding underneath them — rather than an actual result
// worth a tester's attention. Shared with pathTree.ts's own path-parsing
// ignore-list, since the same lines that are noise for "did this line
// report a path" are noise for "is this worth showing while watching a
// run live" too.
export const NOISE_LINE_RE = /^(::|_{3,}|v\d|\[SIMULATED|Duration:|Progress:)/;

// ANSI/VT100 control sequences (colour, erase-line, cursor moves). New
// tool runs get these stripped at capture (oculus/tools/base.py), but
// runs stored before that fix still carry them — e.g. ffuf -c writes
// "\x1b[2K\x1b[33m[Status: 403 ...]\x1b[0m", whose leading escape stops
// the line matching /^\[Status:/ or /^\|/ and hides every ffuf-found
// path from the Paths view. Strip defensively wherever a real tool line
// is pattern-matched.
export const ANSI_RE = /\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b[@-Z\\-_]/g;

export function stripAnsi(s: string): string {
  return s.replace(ANSI_RE, "");
}

export function isNoiseLine(line: string): boolean {
  return NOISE_LINE_RE.test(stripAnsi(line).trim());
}

export function filterNoiseLines(lines: string[]): string[] {
  return lines.filter((l) => !isNoiseLine(l));
}
