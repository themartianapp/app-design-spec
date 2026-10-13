# /// script
# requires-python = ">=3.10"
# dependencies = ["playwright>=1.40"]
# ///
"""Render a built spec or proposals file in headless Chromium and check every phone.

Usage:
  uv run scripts/check.py out.html [--out DIR] [--json]

Saves one PNG per phone (1x) into DIR (default: <html-dir>/<html-stem>-check/) and
checks: console errors, network requests, clipped text, horizontal overflow, buttons
in the unsafe top/bottom zones, text contrast, and clipping/overflow again at 135%
text. Exit 0 when nothing FAILs, 1 when something does, 2 on usage problems.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

LARGE_SCALE = 1.35
MAX_PER_KIND = 4  # rows per phone and check before collapsing into "+N more"
# A screen should show at least one edge state. Permission refusals count ("Location off").
EDGE_STATE = re.compile(r"empty|error|offline|loading|denied|\boff\b|no results", re.I)

# Runs inside the page. Returns findings for every phone currently in #ads-main.
PAGE_CHECKS = r"""
(opts) => {
  const out = [];
  const SAFE_TOP = 62, SAFE_BOTTOM = 840;
  const parse = c => { const m = /rgba?\(([^)]+)\)/.exec(c); if (!m) return null;
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const over = (f, b) => [0, 1, 2].map(i => f[i] * f[3] + b[i] * (1 - f[3])).concat(1);
  const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const ownText = el => [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
  const snippet = el => (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 42);
  const desc = el => {
    const named = el.closest('[data-c]');
    const tag = el.tagName.toLowerCase() + [...el.classList].slice(0, 2).map(c => '.' + c).join('');
    const t = snippet(el);
    return (named ? named.dataset.c + ' › ' : '') + tag + (t ? ` "${t}"` : '');
  };
  const visible = el => {
    if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
    const r = el.getBoundingClientRect(); return r.width > 0.5 && r.height > 0.5;
  };
  const clips = v => v === 'hidden' || v === 'clip';
  const scrolls = v => v === 'auto' || v === 'scroll';
  const shell = el => el.classList.contains('ads-body') || el.classList.contains('screen');
  const r1 = v => Math.round(v * 10) / 10;

  for (const phone of document.querySelectorAll('#ads-main .phone')) {
    const where = `${phone.dataset.screen}/${phone.dataset.state}`;
    const scr = phone.querySelector('.screen');
    if (!scr) { out.push({ check: 'structure', level: 'FAIL', where, detail: 'phone has no .screen' }); continue; }
    const S = scr.getBoundingClientRect();
    const els = [...scr.querySelectorAll('*')].filter(el => !el.closest('[data-chrome]') && !shell(el) && visible(el));
    const add = (check, el, detail) => out.push({ check, level: 'FAIL', where, detail: `${desc(el)}: ${detail}` });

    // Clipped text (a): the element itself hides overflowing content.
    const clipped = new Set();
    for (const el of els) {
      if (!snippet(el) || el.closest('[data-allow-truncate]')) continue;
      const cs = getComputedStyle(el);
      const x = clips(cs.overflowX) && el.scrollWidth > el.clientWidth + 1;
      const y = clips(cs.overflowY) && el.scrollHeight > el.clientHeight + 1;
      if (x || y) { clipped.add(el); add('clip', el, x ? `content ${el.scrollWidth} wide in a ${el.clientWidth} box` : `content ${el.scrollHeight} tall in a ${el.clientHeight} box`); }
    }
    // Clipped text (b): text runs outside an ancestor that hides overflow.
    for (const el of els) {
      if (!ownText(el) || el.closest('[data-allow-truncate]') || el.closest('svg')) continue;
      const rg = document.createRange(); rg.selectNodeContents(el);
      const t = rg.getBoundingClientRect();
      let fx = true, fy = true;
      for (let a = el.parentElement; a && a !== scr && !shell(a); a = a.parentElement) {
        if (clipped.has(a)) break;
        const cs = getComputedStyle(a), r = a.getBoundingClientRect();
        if (fx && clips(cs.overflowX) && (t.left < r.left - 1 || t.right > r.right + 1)) { add('clip', el, `text cut off by ${desc(a).split(' "')[0]}`); break; }
        if (fy && clips(cs.overflowY) && (t.top < r.top - 1 || t.bottom > r.bottom + 1)) { add('clip', el, `text cut off by ${desc(a).split(' "')[0]}`); break; }
        if (scrolls(cs.overflowX)) fx = false;
        if (scrolls(cs.overflowY)) fy = false;
        if (!fx && !fy) break;
      }
    }
    // Horizontal overflow: boxes outside the screen (outermost offender only).
    const wide = new Set();
    for (const el of els) {
      let inScroller = false;
      for (let a = el.parentElement; a && a !== scr; a = a.parentElement) {
        if (wide.has(a)) { inScroller = true; break; }
        if (!shell(a) && scrolls(getComputedStyle(a).overflowX)) { inScroller = true; break; }
      }
      if (inScroller) continue;
      const r = el.getBoundingClientRect();
      if (r.left < S.left - 0.5 || r.right > S.right + 0.5) {
        wide.add(el);
        add('overflow', el, `box spans x ${r1(r.left - S.left)} to ${r1(r.right - S.left)}, screen is 0 to 402`);
      }
    }
    if (opts.layoutOnly) continue;

    // Safe areas: interactive elements in y < 62 or y > 840.
    for (const el of els) {
      if (!el.matches('a[href],button,input,select,textarea,[role=button],[role=link],[role=switch],[role=tab],[role=checkbox]')) continue;
      const r = el.getBoundingClientRect();
      const top = r.top - S.top, bottom = r.bottom - S.top;
      if (top < SAFE_TOP - 0.5) { add('safe-area', el, `top at y ${r1(top)}, above the 62 pt top safe area`); continue; }
      if (bottom > SAFE_BOTTOM + 0.5) {
        let scrollable = false;
        for (let a = el.parentElement; a && a !== scr; a = a.parentElement) {
          const cs = getComputedStyle(a);
          if (scrolls(cs.overflowY) && a.scrollHeight > a.clientHeight + 1) { scrollable = true; break; }
        }
        if (!scrollable) add('safe-area', el, `bottom at y ${r1(bottom)}, inside the bottom 34 pt (home indicator)`);
      }
    }
    // Contrast: WCAG 2.x against the nearest opaque background.
    for (const el of els) {
      if (!ownText(el) || el.closest('svg') || el.closest('[disabled],[aria-disabled="true"]')) continue;
      const cs = getComputedStyle(el);
      let fg = parse(cs.color); if (!fg) continue;
      let alpha = fg[3];
      for (let a = el; a && a !== phone; a = a.parentElement) alpha *= parseFloat(getComputedStyle(a).opacity);
      const layers = []; let unknown = false;
      for (let a = el; a; a = a.parentElement) {
        const s = getComputedStyle(a);
        const bg = parse(s.backgroundColor);
        if (bg && bg[3] > 0) { layers.push(bg); if (bg[3] >= 1) break; }
        else if (s.backgroundImage && s.backgroundImage !== 'none') { unknown = true; break; }
        if (a === scr) break;
      }
      if (unknown) continue;
      let base = [255, 255, 255, 1];
      for (let i = layers.length - 1; i >= 0; i--) base = over(layers[i], base);
      const text = over([fg[0], fg[1], fg[2], alpha], base);
      const r = ratio(text, base);
      const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
      const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
      if (r < need - 0.005) add('contrast', el, `${r.toFixed(2)}:1, needs ${need}:1 (${r1(size)} px${bold ? ' bold' : ''})`);
    }
  }
  return out;
}
"""

MISSING_CHROMIUM = (
    "check.py: Chromium for Playwright is not installed.\n"
    "Install it once with:\n"
    "  uv run --with playwright playwright install chromium"
)


def die(msg: str, code: int = 2) -> None:
    print(msg, file=sys.stderr)
    sys.exit(code)


def safe_name(s: str) -> str:
    return re.sub(r"[^A-Za-z0-9._-]+", "-", s).strip("-") or "phone"


class Report:
    def __init__(self) -> None:
        self.rows: list[dict] = []
        self.seen: set[tuple] = set()
        self.counts: dict[tuple, int] = {}

    def add(self, level: str, check: str, where: str, detail: str) -> None:
        key = (level, check, where, detail)
        if key in self.seen:
            return
        self.seen.add(key)
        n = self.counts.get((check, where), 0) + 1
        self.counts[(check, where)] = n
        row = {"level": level, "check": check, "where": where, "detail": detail}
        if n > MAX_PER_KIND:
            row["hidden"] = True
        self.rows.append(row)

    def table(self) -> str:
        shown = [r for r in self.rows if not r.get("hidden")]
        extra = {}
        for r in self.rows:
            if r.get("hidden"):
                extra[(r["check"], r["where"], r["level"])] = extra.get((r["check"], r["where"], r["level"]), 0) + 1
        for (check, where, level), n in extra.items():
            shown.append({"level": level, "check": check, "where": where, "detail": f"+{n} more like this"})
        order = {"FAIL": 0, "WARN": 1}
        shown.sort(key=lambda r: (order.get(r["level"], 2), r["check"], r["where"]))
        if not shown:
            return ""
        w = [max(len(r[k]) for r in shown + [{"level": "LEVEL", "check": "CHECK", "where": "WHERE"}]) for k in ("level", "check", "where")]
        lines = [f"{'LEVEL':<{w[0]}}  {'CHECK':<{w[1]}}  {'WHERE':<{w[2]}}  DETAIL"]
        for r in shown:
            lines.append(f"{r['level']:<{w[0]}}  {r['check']:<{w[1]}}  {r['where']:<{w[2]}}  {r['detail']}")
        return "\n".join(lines)


def main() -> None:
    ap = argparse.ArgumentParser(description="Render and check a built design spec or proposals file.")
    ap.add_argument("html", type=Path, help="file made by build.py")
    ap.add_argument("--out", type=Path, help="folder for PNGs and report.json (default <html-dir>/<html-stem>-check)")
    ap.add_argument("--json", action="store_true", help="also write report.json into the out folder")
    a = ap.parse_args()

    src = a.html.resolve()
    if not src.is_file():
        die(f"check.py: file not found: {a.html}")
    out = (a.out or src.parent / f"{src.stem}-check").resolve()
    out.mkdir(parents=True, exist_ok=True)
    for old in out.glob("*.png"):
        old.unlink()

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        die("check.py: Playwright is missing. Run it with `uv run scripts/check.py ...` so the inline dependency is installed.")

    rep = Report()
    shots: list[str] = []
    normal_hits: set[tuple] = set()  # (phone, check, element) failing at 100% text
    where = {"v": "load"}
    mode = "?"
    phones_seen = 0

    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
        except Exception as e:  # noqa: BLE001 - Playwright raises a generic Error
            if "Executable doesn't exist" in str(e) or "playwright install" in str(e):
                die(MISSING_CHROMIUM)
            raise
        page = browser.new_page(viewport={"width": 1600, "height": 1000}, device_scale_factor=1)

        def on_console(msg):
            # Requests we block below already show up as "network"; skip their echo.
            if msg.type == "error" and "ERR_BLOCKED_BY_CLIENT" not in msg.text:
                rep.add("FAIL", "console", where["v"], msg.text[:300])

        def on_request(req):
            if not req.url.startswith(("file:", "data:", "blob:", "about:")):
                rep.add("FAIL", "network", where["v"].removesuffix(" (large text)"), f"request to {req.url[:200]}")

        def on_route(route):
            if route.request.url.startswith(("file:", "data:", "blob:", "about:")):
                route.continue_()
            else:
                route.abort("blockedbyclient")

        page.on("console", on_console)
        page.on("pageerror", lambda err: rep.add("FAIL", "console", where["v"], f"page error: {str(err)[:300]}"))
        page.on("request", on_request)
        page.route("**/*", on_route)

        def settle() -> None:
            page.evaluate("() => document.fonts.ready.then(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))))")

        for scale in (1.0, LARGE_SCALE):
            large = scale != 1.0
            where["v"] = "load" + (" (large text)" if large else "")
            url = src.as_uri() + "?zoom=100" + (f"&scale={scale}" if large else "")
            page.goto(url, wait_until="load")
            settle()
            if not page.evaluate("() => !!(window.ADS && window.ADS.mode)"):
                rep.add("FAIL", "structure", "load", "no defineSpec() or defineProposals() call ran; see console errors")
                break
            mode = page.evaluate("() => ADS.mode")
            if not large:
                info = page.evaluate("() => ADS.info()")
                if mode == "spec":
                    if not info["screens"]:
                        rep.add("FAIL", "structure", "spec", "no screens defined")
                    for s in info["screens"]:
                        if not s["states"]:
                            rep.add("FAIL", "structure", s["id"], "screen has no states")
                        elif not any(EDGE_STATE.search(f"{x['id']} {x['label']}") for x in s["states"]):
                            rep.add("WARN", "structure", s["id"], "no empty, error, offline, loading or denied state")
                else:
                    for g in info["groups"]:
                        if not g["items"]:
                            rep.add("FAIL", "structure", g["id"], "group has no items")
            for route in page.evaluate("() => ADS.routes()"):
                where["v"] = route + (" (large text)" if large else "")
                page.evaluate("(id) => ADS.go(id)", route)
                settle()
                for f in page.evaluate(PAGE_CHECKS, {"layoutOnly": large}):
                    check = f["check"]
                    if large and check in ("clip", "overflow"):
                        # Already failing at 100%: one report is enough.
                        if (f["where"], check, f["detail"].split(": ")[0]) in normal_hits:
                            continue
                        check = "large-text-" + check
                    elif not large:
                        normal_hits.add((f["where"], check, f["detail"].split(": ")[0]))
                    rep.add(f["level"], check, f["where"] + (" @135%" if large else ""), f["detail"])
                phones = page.locator("#ads-main .phone")
                for i in range(phones.count()):
                    ph = phones.nth(i)
                    name = safe_name(f"{ph.get_attribute('data-screen')}--{ph.get_attribute('data-state')}") + ("--large" if large else "")
                    path = out / f"{name}.png"
                    ph.screenshot(path=str(path))
                    shots.append(str(path))
                    if not large:
                        phones_seen += 1
        browser.close()

    fails = sum(r["level"] == "FAIL" for r in rep.rows)
    warns = sum(r["level"] == "WARN" for r in rep.rows)
    table = rep.table()
    print(f"{src.name} · {mode} · {phones_seen} phones · {len(shots)} PNGs in {out}")
    if table:
        print(table)
    print(f"{fails} FAIL · {warns} WARN")
    if a.json:
        (out / "report.json").write_text(json.dumps({
            "file": str(src), "mode": mode, "phones": phones_seen, "fail": fails, "warn": warns,
            "findings": [{k: v for k, v in r.items() if k != "hidden"} for r in rep.rows], "screenshots": shots,
        }, indent=2), encoding="utf-8")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
