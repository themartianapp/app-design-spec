#!/usr/bin/env python3
"""Inline an app's CSS and JS into the shell to make one self-contained HTML file.

Usage:
  python3 scripts/build.py <app-dir> [--entry app.js] -o out.html [--title T]
                           [--css FILE.css] [--allow-url]

The entry script calls defineSpec(...) (final spec) or defineProposals(...)
(directions / variants). CSS: --css, else <entry-stem>.css if present, else
app.css if present, else none. Stdlib only. Exit 2 on any problem.
"""
from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

SHELL = Path(__file__).resolve().parent.parent / "assets" / "shell.html"
MARK_STYLE = "<!-- APP:STYLE -->"
MARK_SCRIPT = "<!-- APP:SCRIPT -->"
MARK_TITLE = "{{TITLE}}"
# http(s) URLs are banned (the file must work offline). XML namespace URIs are
# identifiers, never fetched, so they are allowed.
URL_RE = re.compile(r"https?://(?!www\.w3\.org/)[^\s'\"`)<>]+", re.I)


def die(msg: str) -> None:
    print(f"build.py: error: {msg}", file=sys.stderr)
    sys.exit(2)


def read(path: Path, what: str) -> str:
    if not path.is_file():
        die(f"{what} not found: {path}")
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        die(f"{what} is not UTF-8 text: {path}")
    raise AssertionError


def find_urls(name: str, text: str) -> list[str]:
    hits = []
    for no, line in enumerate(text.splitlines(), 1):
        for m in URL_RE.finditer(line):
            hits.append(f"  {name}:{no}: {m.group(0)}")
    return hits


def default_title(js: str, fallback: str) -> str:
    """Best-effort title from the define call's literal app.name / title."""
    call = max(js.rfind("defineSpec("), js.rfind("defineProposals("))
    tail = js[call:] if call >= 0 else js

    def first(key: str) -> str | None:
        m = re.search(key + r"""\s*:\s*(['"`])((?:(?!\1).){1,120})\1""", tail)
        return m.group(2) if m else None

    if tail.startswith("defineSpec("):
        name, sub = first(r"\bname"), first(r"\bsubtitle")
        if name:
            return f"{name} · {sub}" if sub else name
    return first(r"\btitle") or fallback


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("app_dir", type=Path, help="folder with the app's .js and .css files")
    ap.add_argument("--entry", default="app.js", help="script that calls defineSpec / defineProposals (default app.js)")
    ap.add_argument("--css", help="stylesheet in app-dir (default <entry-stem>.css, else app.css)")
    ap.add_argument("-o", "--out", type=Path, required=True, help="output HTML file")
    ap.add_argument("--title", help="page title (default: read from the entry script)")
    ap.add_argument("--allow-url", action="store_true", help="allow http(s) URLs in app files (breaks the offline rule)")
    a = ap.parse_args()

    if not a.app_dir.is_dir():
        die(f"app folder not found: {a.app_dir}")
    shell = read(SHELL, "shell")
    for mark in (MARK_STYLE, MARK_SCRIPT, MARK_TITLE):
        if shell.count(mark) != 1:
            die(f"shell must contain the marker {mark} exactly once: {SHELL}")

    entry = a.app_dir / a.entry
    js = read(entry, "entry script")
    if a.css:
        css_path: Path | None = a.app_dir / a.css
        css = read(css_path, "stylesheet")
    else:
        css_path = next((p for p in (entry.with_suffix(".css"), a.app_dir / "app.css") if p.is_file()), None)
        css = read(css_path, "stylesheet") if css_path else ""

    if not a.allow_url:
        hits = find_urls(entry.name, js) + (find_urls(css_path.name, css) if css_path else [])
        if hits:
            die("app files must work offline, found URLs:\n" + "\n".join(hits)
                + "\nInline the asset (data: URL or SVG) or pass --allow-url.")

    if re.search(r"</style", css, re.I):
        die(f"{css_path.name} contains '</style', which would end the style block")
    js = re.sub(r"</(script)", r"<\\/\1", js, flags=re.I)

    title = a.title or default_title(js, a.app_dir.name)
    head, rest = shell.split(MARK_STYLE)
    body, tail = rest.split(MARK_SCRIPT)
    style = f"<style id=\"app-style\">\n{css}\n</style>" if css else ""
    script = f"<script id=\"app-script\">\n{js}\n</script>"
    out = head.replace(MARK_TITLE, html.escape(title)) + style + body + script + tail

    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(out, encoding="utf-8")
    used = ", ".join(p.name for p in (entry, css_path) if p)
    print(f"wrote {a.out} ({a.out.stat().st_size:,} bytes) from {used}")


if __name__ == "__main__":
    main()
