"""ffuf tool wrapper — directory/file brute-forcing."""
from __future__ import annotations

from ..wordlists import default_wordlist
from .base import BaseTool, base_url


class FfufTool(BaseTool):
    name   = "ffuf"
    binary = "ffuf"
    description = "Brute-force directories/files on the target using a wordlist."
    uses_wordlist = True
    example = (
        "ffuf -u https://example.com/FUZZ -w /usr/share/wordlists/dirb/common.txt "
        "-mc 200,301,302,401,403 -t 50 -c -v"
    )
    install_hints = {
        "brew": "brew install ffuf",
        "apt": "sudo apt install -y ffuf",
        "go": "go install github.com/ffuf/ffuf/v2@latest",
    }
    timeout_seconds = 600

    # ffuf only fuzzes one directory level at a time. "Recursive" turns on
    # ffuf's own -recursion so every directory it finds (a 301 -> /dir/, or
    # any hit with greedy) is re-queued as a new FUZZ point — that's the
    # "script that recurses to find paths" ask. Kept as explicit modes
    # rather than always-on because recursion multiplies runtime by the
    # number of directories found and is rarely wanted for a first pass.
    modes = {
        "quick": "Quick (single level, 30s cap)",
        "full": "Full (single level)",
        "recursive": "Recursive (depth 2, redirect dirs)",
        "recursive_greedy": "Recursive greedy (depth 2, every hit)",
        "recursive_deep": "Recursive deep (depth 4, greedy)",
    }

    def _base_command(self) -> list[str]:
        return [
            "ffuf",
            "-u", f"{base_url(self.target)}/FUZZ",
            "-w", default_wordlist(),
            # 401/403 included (not just the "found" 200/redirect codes) so a
            # tester can tell "exists but needs permission" apart from
            # "exists and is publicly accessible" — -s (silent) is dropped
            # in favor of -v (verbose) since -s strips the [Status: ...]
            # line entirely, which is exactly the info needed to tell those
            # two cases apart (see extract_ffuf()/pathTree.ts's per-path
            # status parsing).
            "-mc", "200,301,302,401,403",
            "-t", "50",
            "-c", "-v",
        ]

    def build_command(self, fast: bool = False) -> list[str]:
        cmd = self._base_command()
        if fast:
            cmd += ["-maxtime", "30"]
        return cmd

    def build_command_for_mode(self, mode: str) -> list[str]:
        if mode == "quick":
            return self.build_command(fast=True)
        if mode == "full":
            return self.build_command(fast=False)
        if mode in ("recursive", "recursive_greedy", "recursive_deep"):
            cmd = self._base_command()
            depth = "4" if mode == "recursive_deep" else "2"
            cmd += ["-recursion", "-recursion-depth", depth]
            if mode in ("recursive_greedy", "recursive_deep"):
                cmd += ["-recursion-strategy", "greedy"]
            # Recursion has no natural end (work grows with every directory
            # found), so cap it well under timeout_seconds — a -maxtime stop
            # exits 0 with partial results kept, a hard timeout kill marks
            # the run FAILED and tags "[TIMEOUT]" onto the output.
            cmd += ["-maxtime", "540"]
            return cmd
        return super().build_command_for_mode(mode)

    def mock_output(self) -> str:
        return f"""\
[Status: 200, Size: 1245, Words: 89, Lines: 32, Duration: 120ms]
| URL | https://{self.target}/admin
[Status: 301, Size: 178, Words: 6, Lines: 8, Duration: 45ms]
| URL | https://{self.target}/admin -> https://{self.target}/admin/
[Status: 200, Size: 3892, Words: 214, Lines: 67, Duration: 98ms]
| URL | https://{self.target}/login
[Status: 301, Size: 178, Words: 6, Lines: 8, Duration: 52ms]
| URL | https://{self.target}/api
[Status: 403, Size: 564, Words: 12, Lines: 14, Duration: 38ms]
| URL | https://{self.target}/backup
[Status: 200, Size: 87, Words: 3, Lines: 5, Duration: 41ms]
| URL | https://{self.target}/.env
[Status: 200, Size: 734, Words: 42, Lines: 28, Duration: 55ms]
| URL | https://{self.target}/robots.txt
[Status: 200, Size: 2104, Words: 115, Lines: 43, Duration: 63ms]
| URL | https://{self.target}/sitemap.xml
[Status: 200, Size: 41, Words: 1, Lines: 2, Duration: 37ms]
| URL | https://{self.target}/.git/HEAD
[Status: 200, Size: 1893, Words: 98, Lines: 51, Duration: 72ms]
| URL | https://{self.target}/config.php.bak

:: Progress: [4614/4614] :: Job [1/1] :: 312 req/sec :: Duration: [0:00:15] :: Errors: 0 ::
[SIMULATED — ffuf not found on this machine]"""
