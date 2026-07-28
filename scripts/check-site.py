#!/usr/bin/env python3
"""Integrity checks dla statycznej strony (GH Pages).

Sprawdza:
- czy kazdy lokalny href/src/data-pdf/poster w HTML wskazuje istniejacy plik,
- czy kazdy url() w CSS wskazuje istniejacy plik,
- zgodnosc wielkosci liter w sciezkach (GH Pages jest case-sensitive),
- czy sciezki nie wychodza poza root repo (np. o jeden ../ za duzo),
- balans tagow <video>...</video> w kazdym pliku.

Znane, jeszcze nienaprawione problemy (np. czekajace na PR-C) trzymamy w
scripts/known-issues.txt — raportowane jako WARN, nie blokuja. Wszystko nowe
blokuje (exit 1).

Uzycie: python scripts/check-site.py  (z roota repo albo skadkolwiek)
"""

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent
KNOWN_ISSUES_FILE = ROOT / "scripts" / "known-issues.txt"

ATTR_RE = re.compile(
    r"""(?:href|src|data-pdf|poster)\s*=\s*["']([^"']+)["']""", re.IGNORECASE
)
CSS_URL_RE = re.compile(r"""url\(\s*['"]?([^'")]+)['"]?\s*\)""", re.IGNORECASE)
EXTERNAL_RE = re.compile(r"^(?:[a-z][a-z0-9+.-]*:|//|#)", re.IGNORECASE)

SKIP_DIRS = {".git", ".github", "node_modules", "scripts"}


def repo_files():
    for path in sorted(ROOT.rglob("*")):
        if any(part in SKIP_DIRS for part in path.parts):
            continue
        if path.is_file():
            yield path


def exists_exact_case(rel_path: str) -> bool:
    """Czy plik istnieje z DOKLADNIE ta wielkoscia liter (jak na Linuksie)."""
    current = ROOT
    for part in Path(rel_path).parts:
        if not current.is_dir():
            return False
        matches = {p.name for p in current.iterdir()}
        if part not in matches:
            return False
        current = current / part
    return current.is_file()


def resolve_target(raw: str, base_dir: Path):
    """Zwraca (repo_relative_path | None, error | None) dla lokalnego odnosnika."""
    target = unquote(urlsplit(raw).path)
    if not target:
        return None, None
    if target.startswith("/"):
        candidate = (ROOT / target.lstrip("/")).resolve()
    else:
        candidate = (base_dir / target).resolve()
    try:
        rel = candidate.relative_to(ROOT)
    except ValueError:
        return None, f"sciezka wychodzi poza root repo: {raw}"
    rel_str = str(rel).replace("\\", "/")
    if candidate.is_dir():
        rel_str = rel_str.rstrip("/") + "/index.html"
    return rel_str, None


def load_known_issues():
    known = set()
    if KNOWN_ISSUES_FILE.is_file():
        for line in KNOWN_ISSUES_FILE.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#"):
                known.add(line)
    return known


def main():
    errors, warnings = [], []
    known = load_known_issues()
    seen_known = set()

    def record(source: Path, message: str):
        src = str(source.relative_to(ROOT)).replace("\\", "/")
        entry = f"{src} -> {message}"
        for pattern in known:
            if pattern in entry:
                warnings.append(entry)
                seen_known.add(pattern)
                return
        errors.append(entry)

    for path in repo_files():
        suffix = path.suffix.lower()
        if suffix not in {".html", ".css"}:
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        refs = (
            ATTR_RE.findall(text) if suffix == ".html" else CSS_URL_RE.findall(text)
        )
        for raw in refs:
            raw = raw.strip()
            if not raw or EXTERNAL_RE.match(raw):
                continue
            rel, err = resolve_target(raw, path.parent)
            if err:
                record(path, err)
                continue
            if rel is None:
                continue
            if not exists_exact_case(rel):
                record(path, f"brak pliku (lub zla wielkosc liter): {raw}")

        if suffix == ".html":
            opened = len(re.findall(r"<video\b", text, re.IGNORECASE))
            closed = len(re.findall(r"</video\s*>", text, re.IGNORECASE))
            if opened != closed:
                record(path, f"niedomkniete <video>: {opened} otwarte, {closed} zamkniete")

    stale = known - seen_known
    for pattern in sorted(stale):
        warnings.append(f"[BASELINE NIEAKTUALNY — usun z known-issues.txt] {pattern}")

    if warnings:
        print(f"WARN ({len(warnings)}) - znane problemy (czekaja na swoj PR):")
        for w in warnings:
            print(f"  WARN  {w}")
    if errors:
        print(f"\nFAIL ({len(errors)}) - nowe problemy, blokuja merge:")
        for e in errors:
            print(f"  FAIL  {e}")
        return 1
    print(f"\nOK - zero nowych problemow ({len(warnings)} znanych w baseline).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
