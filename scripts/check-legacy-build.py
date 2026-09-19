"""Verify the Jekyll artifact before any migration code can reach Pages."""

import hashlib
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else ROOT / "_site"
if not output.is_dir() or output == ROOT:
    sys.exit("FAIL: provide a separate, existing Jekyll output directory")
for forbidden in ("site", "node_modules", "package.json", "package-lock.json"):
    if (output / forbidden).exists():
        sys.exit(f"FAIL: migration file leaked into legacy output: {forbidden}")

tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode("utf-8").split("\0")
checked = 0
for name in filter(None, tracked):
    relative = Path(name)
    if relative.parts[0] in {"site", "scripts", ".github", ".vscode"}:
        continue
    public = relative.suffix in {".html", ".css"} or name == "CNAME"
    public = public or relative.parts[0] in {"images", "video", "pdf", "js"}
    if not public:
        continue
    source, built = ROOT / relative, output / relative
    if not built.is_file():
        sys.exit(f"FAIL: missing legacy file: {name}")
    if hashlib.sha256(source.read_bytes()).digest() != hashlib.sha256(built.read_bytes()).digest():
        sys.exit(f"FAIL: legacy contents changed during build: {name}")
    checked += 1
if not checked:
    sys.exit("FAIL: no legacy files checked")
print(f"LEGACY_BUILD_OK unchanged_public_files={checked}")
