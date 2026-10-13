# Checks

Run the checker on every built file before you deliver it. It opens the file
in headless Chromium, visits every phone, saves a screenshot of each, and
tests things that are easy to miss by eye.

```sh
python3 <skill>/scripts/build.py design --entry app.js -o design/out/spec.html
uv run <skill>/scripts/check.py design/out/spec.html [--out DIR] [--json]
```

- The mode is read from the file: a spec (every screen and state) or a
  proposals file (every group and item).
- `--out DIR`: where screenshots go. Default: a folder next to the HTML file
  named `<file>-check/`, for example `design/out/spec-check/`. Old PNGs in it
  are deleted on each run.
- `--json`: also write `report.json` into that folder (file, mode, counts,
  every finding, screenshot paths).
- Exit code: 0 when there is no FAIL, 1 when there is at least one FAIL, 2 when
  the file is missing or Playwright or Chromium is not installed.
- If Chromium is missing, the checker says so and prints the install command.
  Run `uv run --with playwright playwright install chromium` once.

The checker runs twice: once at normal text size, once at text scale 1.35
(the same as the Large text toggle). It blocks every request that is not
`file:`, `data:`, `blob:` or `about:`.

## What it checks

| Check | Level | What it finds |
| --- | --- | --- |
| `console` | FAIL | Any console error or uncaught page error. Render failures and duplicate ids are logged here |
| `network` | FAIL | Any request to the network (the file must work offline); reported once per request |
| `clip` | FAIL | Text cut off: an element with `overflow: hidden` or `clip` whose content is larger than its box, or text that runs outside such an ancestor |
| `overflow` | FAIL | A box that sticks out of the 402 pt screen sideways |
| `safe-area` | FAIL | A control (`a[href]`, `button`, `input`, `select`, `textarea`, or role `button`, `link`, `switch`, `tab`, `checkbox`) whose top is in the top 62 pt, or whose bottom is in the bottom 34 pt |
| `contrast` | FAIL | Text below 4.5:1 against the background behind it (3:1 for text 24 px and up, or 18.66 px and up at weight 700 or more) |
| `large-text-clip` | FAIL | `clip` in the 1.35 pass, for elements that were fine at normal size |
| `large-text-overflow` | FAIL | `overflow` in the 1.35 pass, for elements that were fine at normal size |
| `structure` | FAIL | No `defineSpec` or `defineProposals` call ran, a spec with no screens, a screen with no states, or a group with no items |
| `structure` | WARN | A screen with no edge state: no state whose id or label contains empty, error, offline, loading, denied, off or no results |

The 1.35 pass runs `clip` and `overflow` only; safe areas and contrast are
checked once, at normal size. An element that already fails at normal size is
not reported again in the 1.35 pass, so `large-text-*` findings are problems
that only large text causes.

Built-in exemptions:

- `clip`: elements marked `data-allow-truncate`, or inside one, and text in
  SVG.
- `overflow`: content inside a horizontal scroll container
  (`overflow-x: auto` or `scroll`), such as a carousel.
- `safe-area`: the shell's status bar, Dynamic Island and home indicator
  (marked `data-chrome`), and controls at the bottom that sit inside a
  vertical scroll container with more content than fits (the user can scroll
  them up).
- `contrast`: disabled elements (`disabled` or `aria-disabled="true"`), text
  in SVG, and text over a background image or gradient, which the checker
  cannot measure. Check those by eye.

## Reading the report

The checker prints a header line, one line per finding, and a summary:

```
bad.html · spec · 1 phones · 2 PNGs in design/out/bad-check
LEVEL  CHECK      WHERE        DETAIL
FAIL   clip       home/normal  div.t-body "Next watering in three days from now": content 66 tall in a 22 box
FAIL   contrast   home/normal  AddButton › button "Add plant": 1.92:1, needs 4.5:1 (17 px)
FAIL   safe-area  home/normal  AddButton › button "Add plant": top at y 20, above the 62 pt top safe area
WARN   structure  home         no empty, error, offline, loading or denied state
3 FAIL · 1 WARN
```

This is the report for a one-screen file with four mistakes: a text box
with a fixed height, light grey button text, a button at the very top, and no
edge state. The header line shows the full path of the screenshot folder.
A problem that only appears at large text looks like this:

```
FAIL   large-text-clip  defects/large-only @135%  p.t-body.bk-fixed "Fits at 100% only": content 30 tall in a 22 box
```

- **WHERE** is `screen/state` in a spec and `group/item` in a proposals file;
  `@135%` marks the large text pass. Open the HTML at `#<screen-id>` to see it.
- **DETAIL** starts with the element: its `data-c` name if it has one (see
  [spec.md](spec.md)), its tag and classes, and the start of its text. Adding
  `data-c` names makes reports much easier to read.
- More than four findings of one kind on one phone collapse into a
  "+N more like this" line. Fix the first ones and run again.
- Screenshots are `<screen>--<state>.png`, plus `<screen>--<state>--large.png`
  for the 1.35 pass. In proposals files they are `<group>--<item>.png`, where
  `<item>` is the item's `id`, or its label in lower case with dashes.

What to do:

- Fix every FAIL.
- For every WARN, fix it or say in your message why it stays (for example:
  "Settings has no empty or error state; everything on it is local").
- Passing checks do not mean the design is good. Open the screenshots,
  including the `--large` ones, and look at them.

## Common fixes

| Finding | Usual cause | Fix |
| --- | --- | --- |
| `clip` on a row label | Fixed width or height with `overflow: hidden` | Let it wrap and drop the fixed height. If cutting is right (a long name in a one-line row), add `data-allow-truncate` |
| `large-text-clip` | Fixed `height` on a row, button or chip | Use `min-height` and padding instead of `height` |
| `large-text-overflow` | Label and value side by side in one row | Let the label wrap with `min-width: 0` on the flex child, or stack the two at large sizes |
| `overflow` | Long word or number, fixed widths, negative margins | `overflow-wrap: anywhere` on user text; `max-width: 100%`; check side margins |
| `safe-area` at the top | Content starts at y = 0 | Pad the top with `var(--safe-top)`; the nav bar starts at y = 62 |
| `safe-area` at the bottom | Button or tab bar at the very bottom | Pad with `var(--safe-bottom)`; the tab bar sits above the home indicator |
| `contrast` | Muted grey text, or accent text on an accent-tinted surface | Change the colour token, not the single element, then rebuild |
| `network` | Web font, CDN script, remote image | Remove it. Use the system fonts, inline SVG, or a `data:` URL |
| `console` "render failed for ..." | A render function threw | Read the message; usually a missing field in sample data or a typo |
| `structure` "no defineSpec() ..." | The script stopped before the call | Look at the `console` finding above it for the real error |

Text that does not grow with Large text usually means a fixed `px` font size
in your CSS; use the `.t-<name>` classes (see [spec.md](spec.md)).

## Build errors

`build.py` stops with exit code 2 and a message when the app folder, the
entry file, a CSS file given with `--css`, the shell or one of its markers is
missing, or when an app file contains an `http://` or `https://` URL. SVG
namespace URLs on `www.w3.org` are allowed. Remove the URL; do not use
`--allow-url` for files you deliver.

## Proving the checker works

`scripts/fixtures/broken-app/` is a small app with deliberate mistakes. Run
it after changing the shell or the checker; it must exit with code 1 and
report the mistakes:

```sh
python3 <skill>/scripts/build.py <skill>/scripts/fixtures/broken-app -o /tmp/broken.html --allow-url
uv run <skill>/scripts/check.py /tmp/broken.html
```

`--allow-url` is needed because the fixture includes a remote URL on purpose,
to trigger the `network` check.
