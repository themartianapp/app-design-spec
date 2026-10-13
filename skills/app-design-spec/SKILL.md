---
name: app-design-spec
description: >-
  Design an app's screens with the user, iPhone first, and deliver one
  self-contained HTML design spec: every screen and every state in iPhone
  frames, with tokens, voice rules, implementation notes and an inspect mode.
  Walks from a short brief and reference apps to a screen map, visual
  direction proposals, page layout variants, the final spec and a handoff to
  code. Use when the user asks to design an app, plan or redesign screens,
  make UI proposals, mockups or wireframes, write a design spec, do iPhone or
  iOS app design, or redesign an App Store app.
license: Apache-2.0
compatibility: >-
  Needs Python 3.10+ for the build script, and uv (or pip plus playwright)
  with Chromium for the render checks. Designed for coding agents with file
  and shell access.
metadata:
  author: themartianapp
  version: "1.0"
---

# App design spec

You design an app's screens together with the user and hand over one HTML file
that a developer (human or agent) can build from. iPhone first.

The work moves through six steps. Two of them end in a gate: you stop, show the
result, and wait for the user before going on.

1. Brief and references
2. Screen map (**Gate 1**: user approves)
3. Visual directions (**Gate 2**: user picks)
4. Page variants (you pick by default; user may override)
5. Final design spec
6. Handoff to code (when an app exists)

Every file you deliver is a single self-contained HTML file. It opens offline in
any browser, has no external URLs, and can be sent by mail or chat.

## Files in this skill

- [references/brief.md](references/brief.md): questions, reference intake,
  reading an existing app, brief template.
- [references/screen-map.md](references/screen-map.md): screen list, states
  checklist, navigation map, Gate 1.
- [references/directions.md](references/directions.md): visual directions,
  Gate 2, mixing two directions.
- [references/variants.md](references/variants.md): layout variants and how to
  pick one.
- [references/spec.md](references/spec.md): writing `app.js` with
  `defineSpec`, content rules, voice table, notes, downloads.
- [references/iphone.md](references/iphone.md): frame size, safe areas, bars,
  touch targets, Dynamic Type, fonts.
- [references/checks.md](references/checks.md): what the checker verifies and
  how to fix common failures.
- [references/handoff.md](references/handoff.md): screen-to-code mapping, build
  tasks, screenshot comparison.
- [assets/example-app/](assets/example-app/): a complete worked example. Copy
  it as the starting point for every new project.
- [assets/shell.html](assets/shell.html): the shared HTML shell. Do not edit
  it per project; the build inlines your files into it.
- [scripts/build.py](scripts/build.py) and [scripts/check.py](scripts/check.py):
  build and check the HTML files.

## Setup

In the commands below, `<skill>` is the folder that holds this SKILL.md. Keep
the user's design work in its own folder. Decide where it goes **before** you
copy anything:

- **New app or no rules against it:** `design/` in the user's project.
- **The project already has a `design/` folder:** never write over it. Use
  `design/app-design-spec/` or another new name, and treat the old files as
  inputs to read (see the existing-app checklist).
- **The design must stay out of the app repo** (the user says so, or the repo
  only accepts code changes): use a sibling folder such as
  `../<app>-design/design/`. Record the app repo and commit you read in the
  brief so later steps can point back to it.

Then copy the starter into the folder you chose (the target must be new or
empty; `design` here stands for it):

```sh
mkdir -p design
cp -r <skill>/assets/example-app/. design/
```

All paths below say `design/`; use whichever folder you chose.

The example holds two worked files, each a script plus its styles:

- `app.js` + `app.css`: a final spec (step 5), built with `defineSpec`.
- `proposals.js` + `proposals.css`: a proposals file (steps 3 and 4), built
  with `defineProposals`.

Each step has its own entry file in `design/`: `directions.js`,
`variants.js` and `app.js`. The build inlines the CSS file with the same name
(`directions.css` for `directions.js`), or `app.css` when there is none.
Replace the example content step by step; keep the structure.

Build and check, every time before you show a file to the user:

```sh
python3 <skill>/scripts/build.py design --entry app.js -o design/out/spec.html
uv run <skill>/scripts/check.py design/out/spec.html
```

The check writes a screenshot of every phone and its report to
`design/out/spec-check/`. `build.py` needs only the Python standard library.
`check.py` declares its dependency (playwright) inline, so `uv run` installs
it. You do not need Chromium for steps 1 and 2; install it before the first
render check: `uv run --with playwright playwright install chromium`, once.
Without uv: `pip install playwright && playwright install chromium`, then
`python3 <skill>/scripts/check.py ...`. See
[references/checks.md](references/checks.md).

## Step 1: Brief and references

Goal: a one-page brief you and the user agree on.

- Ask the questions in [references/brief.md](references/brief.md). Ask few at a
  time. Skip what the user already told you.
- Ask for references: screenshots, links, or App Store app names. For each one,
  write down what to borrow (for example "the way it groups settings") and
  what to leave. Borrow ideas; never copy layouts, names, icons or text.
- If the app already exists, read its code before you design anything. Use its
  real screens, real data fields and real copy. Note what the code does that
  the user did not mention. The checklist is in
  [references/brief.md](references/brief.md). For a large app, split the read
  across parallel readers (one per area, such as navigation, data and copy) if
  your tools allow it, then merge their notes.

Produce: `design/brief.md` (one page, with the template from the reference
file) and, for an existing app, `design/existing-app-notes.md` with the full
code inventory.

## Step 2: Screen map (Gate 1)

Goal: the full list of screens and the states each one needs, before any
visual work.

- List every screen, one line each: name, purpose, how the user gets there.
- For each screen, go through the states checklist in
  [references/screen-map.md](references/screen-map.md): normal, empty,
  loading, error, offline, first run, permission, large text. Keep the states
  that apply and say why the others do not.
- Draw the navigation: tabs, stacks, sheets, alerts.

Produce: `design/screen-map.md`.

**Gate 1.** Stop. Show the screen map and ask the user to approve it or change
it. If your tools include an interactive question tool, use it. Do not start
visual work until the user approves.

## Step 3: Visual directions (Gate 2)

Goal: let the user choose a look by seeing it on real screens.

- Make 3 or 4 directions. Each one shows the same 3 or 4 key screens with the
  same real content, so only the look differs.
- Vary palette, type, density and shape between directions. Details in
  [references/directions.md](references/directions.md).
- Write `design/directions.js` (start from a copy of `proposals.js` and
  `proposals.css`) with `defineProposals`, one group per direction.

Produce: `design/out/directions.html` (built and checked).

**Gate 2.** Stop. Send the file and ask the user to pick one direction, or two
to mix (say what comes from each). Use the interactive question tool if you
have one. Do not go on until the user picks.

## Step 4: Page variants

Goal: the best layout for the screens that matter most, in the chosen
direction.

- Pick the 2 to 4 most important screens. Make 2 or 3 layouts for each in
  `design/variants.js`, one group per screen.
- By default you pick the winner for each screen: mark it with `pick: true`
  and state why in one or two sentences. The user may override any pick.
- Details in [references/variants.md](references/variants.md).

Produce: `design/out/variants.html` (built and checked). Share it, say which
variants you picked, and continue unless the user objects.

## Step 5: Final design spec

Goal: one file that shows every screen in every state, ready to build from.

- Write `design/app.js` with `defineSpec`: tokens, every screen from the
  approved screen map, every state from the checklist, implementation notes,
  voice table, and downloads such as a tokens file. The API and content rules
  are in [references/spec.md](references/spec.md).
- Use real content: real names, real numbers, real copy. No lorem ipsum, no
  "Item 1".
- Follow the iPhone rules in [references/iphone.md](references/iphone.md).
- Build, then run the checks and fix every FAIL. Look at the screenshots
  yourself; the checker cannot judge taste.

Produce: `design/out/<app-name>-design-spec.html`.

## Step 6: Handoff to code

Only when there is an app to build or change.

- Map each spec screen to the view it becomes in code (new or existing file),
  and write the build tasks in order.
- After the app is built, take screenshots of the real app in the same states
  and compare them against the spec, one screen at a time.
- Details in [references/handoff.md](references/handoff.md).

Produce: `design/handoff.md`.

## Defaults

- iPhone first: iPhone 17 Pro frame, 402 × 874 pt. Other devices only when the
  user asks.
- Ask for references early; say what you will borrow from each.
- In step 4 you pick; in steps 2 and 3 the user decides.
- If the app exists, its code is the source of truth for screens, data and
  copy.
- Plain words in the UI. Short labels. Say what happened and what to do next.

## Before every delivery

1. Build with `scripts/build.py`. It fails on missing files or any `http(s)://`
   URL in your files; keep everything offline.
2. Run `scripts/check.py`. Fix every FAIL. Read every WARN and fix it or say
   why it stays.
3. Open a few screenshots and check them by eye: alignment, spacing, text that
   reads well, nothing hidden under the status bar or home indicator.
4. Deliver the HTML file through the channel the user works in: attach it,
   upload it, or give the file path. Say in one or two lines what changed and
   what you need from them.
