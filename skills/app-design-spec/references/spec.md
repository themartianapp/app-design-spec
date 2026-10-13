# Step 5: The final design spec

The spec is one HTML file that shows every screen of the approved screen map
in every state, inside iPhone frames, with the tokens, the voice rules and the
notes a developer needs. You write two files, `design/app.js` and
`design/app.css`; the build puts them into the shared shell. The build
inlines exactly one script and one stylesheet, so all code for the spec
(data, components, screens) lives in `app.js`. No `import`, no other files.

Start from the example's `app.js` and `app.css`. Bring over the chosen
direction's tokens and the picked variants' render functions.

## defineSpec

`app.js` calls `defineSpec` once. Calling it twice, or calling both
`defineSpec` and `defineProposals`, is an error.

```js
defineSpec({
  app: {
    name: 'Pocket Garden',
    subtitle: 'iOS design spec · direction B',
    intro: h`<p>Approved 12 May. Screens follow the screen map.</p>`, // optional, top of Foundations
  },
  tokens: {
    color:  { bg: '#F6F5F2', surface: '#FFFFFF', text: '#1C1B19', muted: '#6B675F', accent: '#2F6FDE', danger: '#C2362B' },
    type:   {
      largeTitle: { size: 34, weight: 700, line: 41 },
      headline:   { size: 17, weight: 600, line: 22 },
      body:       { size: 17, weight: 400, line: 22 },
      footnote:   { size: 13, weight: 400, line: 18 },
      price:      { size: 28, weight: 600, line: 34, font: 'rounded' }, // font is optional
    },
    space:  { xs: 4, s: 8, m: 16, l: 24, xl: 32 },
    radius: { card: 14, button: 12 },
  },
  voice: [
    { instead: 'Error 500', say: 'Can’t reach the server. Try again in a minute.' },
  ],
  foundations: [                     // optional extra pages under Start
    { id: 'principles', title: 'Principles', render: () => h`<ul><li>One primary action per screen.</li></ul>` },
  ],
  screens: [
    {
      id: 'home',
      title: 'Home',
      summary: 'What needs care today, at a glance.',
      code: ['HomeView.swift'],      // optional: the view it maps to
      states: [
        { id: 'normal', label: 'Normal', render: (ctx) => home(ctx, plants) },
        { id: 'empty',  label: 'Empty',  render: (ctx) => home(ctx, []), note: 'First launch, no plants yet' },
        { id: 'offline', label: 'Offline', render: (ctx) => home(ctx, plants, { offline: true }) },
      ],
      notes: [
        { title: 'Plant row', body: h`<p>72 pt tall. Name in Headline, next task in Footnote, muted.</p>` },
      ],
    },
  ],
  downloads: [
    { label: 'Download Tokens.swift', filename: 'Tokens.swift', text: (tokens) => swiftTokens(tokens) },
  ],
});
```

### Fields

"Always" marks what every spec should have; the shell tolerates gaps, but the
spec is incomplete without them.

| Field | Use | What it does |
| --- | --- | --- |
| `app.name`, `app.subtitle` | always | Top of the sidebar and the page title |
| `app.intro` | optional | HTML at the top of the Foundations page |
| `tokens.color` | always | Swatches with hex value and contrast against `bg`, tagged TEXT OK (4.5:1 and up), LARGE TEXT ONLY (3:1 and up), FILL / SURFACE (below 1.5:1) or NOT FOR TEXT; CSS vars `--c-<name>` |
| `tokens.type` | always | Type ramp. Entry: `{ size, line, weight, font, tracking, sample }`; only `size` is needed (`line` defaults to size × 1.25, `weight` to 400). `font` is `text`, `display`, `rounded`, `serif` or `mono` (system font stacks). `tracking` is letter spacing in px. `sample` is the text shown on the ramp |
| `tokens.space` | always | Spacing scale in pt; CSS vars `--s-<name>` |
| `tokens.radius` | always | Corner radii in pt; CSS vars `--r-<name>` |
| `voice[]` | recommended | `{ instead, say, why }`, `why` optional; the "Instead of / Say" table on Foundations and its own Voice page |
| `foundations[]` | optional | Extra pages under Start: `{ id, title, summary, render }` |
| `screens[]` | always | In screen-map order; the sidebar numbers them "01 / N · k states" |
| `screen.id`, `title`, `summary` | always | `id` is the URL hash (`#home`) and part of screenshot names. `foundations` and `voice` are reserved; ids must be unique |
| `screen.code` | optional | File names of the views this screen maps to (see [handoff.md](handoff.md)) |
| `screen.states[]` | always | At least one; shown side by side, each in its own phone. State ids unique per screen |
| `state.id`, `label`, `render` | always | `render(ctx)` returns the screen's HTML |
| `state.status` | optional | `'light'` or `'dark'`: status bar ink for this state |
| `state.note` | optional | Short HTML caption under the phone |
| `screen.notes[]` | recommended | Implementation notes `{ title, body }` below the phones; `body` is HTML |
| `downloads[]` | recommended | Sidebar buttons that save a file: `{ label, filename, text, type }`. `text` is a string or `(tokens) => string`; `type` is an optional MIME type |

`render(ctx)` gets `ctx = { screen, state, tokens, textScale, mode: 'spec' }`.
Keep render functions pure: same input, same HTML. No timers, no random data,
no `Date.now()` in content; screenshots must be stable.

If a render function throws, the phone shows "Render failed" with the message
and the error goes to the console, so the checker reports it as a `console`
FAIL. Duplicate ids are reported the same way.

### HTML helpers

The shell defines three globals for building HTML safely:

- `` h`...` ``: a tagged template. Every `${value}` is escaped, so names with
  `<` or `&` cannot break the markup. Nested `h` results and arrays of them
  are inserted as HTML; `null`, `undefined` and `false` insert nothing.
- `raw(str)`: insert trusted HTML without escaping, for example an SVG icon
  string you wrote.
- `esc(str)`: escape a string.

Fields that take HTML (`intro`, `note`, `body`, `why`) insert plain strings
as HTML without escaping. Build them with `h` whenever they contain data.

Write each screen once as a function that takes data and options, and call it
from every state. That keeps states consistent and makes changes cheap.

## defineProposals

Steps 3 and 4 use `defineProposals` instead, in their own entry file
(`directions.js`, `variants.js`). Same helpers, same frame, same checker.

| Field | What it does |
| --- | --- |
| `title`, `intro` | Page heading and HTML intro; `title` also names the saved file |
| `eyebrow` | Small label above the title (default "Proposals") |
| `groups[]` | One section each: `{ id, title, blurb, why, pick, tokens, items }` |
| `group.tokens` | Same shape as spec tokens; applied as CSS vars to this group only, and shown as palette and type chips |
| `group.pick` | `true` shows a "Picked" badge on the group (a chosen direction) |
| `group.why` | Short HTML: the reason for the pick |
| `items[]` | One phone each: `{ id, label, render, pick, note, status }`. `id` (or else `label`) names the screenshot |
| `item.pick` | `true` marks the picked variant |
| `item.note` | Short HTML caption under the phone |

`render(ctx)` gets `ctx = { group, item, tokens, textScale, mode: 'proposals' }`.
Tapping a phone opens it larger.

## Styling

Put styles in `app.css`. The shell turns the tokens into CSS variables and
classes. Names are kept as written, so `accentSoft` becomes `--c-accentSoft`.

| Token | CSS |
| --- | --- |
| `color.accent` | `var(--c-accent)` |
| `space.m` | `var(--s-m)` (px) |
| `radius.card` | `var(--r-card)` (px) |
| `type.body` | class `.t-body` (family, weight, size, line height, tracking) |
| `type.body` parts | `var(--t-body-size)`, `-line`, `-weight`, `-font`, `-track` |
| safe areas | `var(--safe-top)` (62px), `var(--safe-bottom)` (34px) |
| text scale | `var(--text-scale)`: 1, or 1.35 with Large text |

Rules:

- Set text with the `.t-<name>` classes. They multiply size and line height
  by `--text-scale`, so they follow the Large text toggle. The raw
  `--t-<name>-size` variable is not scaled; if you use it directly, write
  `calc(var(--t-body-size) * var(--text-scale))`. Fixed `px` font sizes do not
  grow at all, which hides exactly the problems the large text pass is there
  to find (see [iphone.md](iphone.md)).
- Use token variables, not raw hex or pixel values, so the spec and the code
  stay in step.
- Inside `.screen`, the shell resets margins on headings, paragraphs and
  lists, and buttons and inputs inherit the font. The screen's default
  background and text colour are `--c-bg` and `--c-text`.
- Scope every rule to your own classes or under `.screen`. Never style bare
  elements globally (`body`, `button`, `h1`); that breaks the shell's sidebar
  and tools.
- No external URLs anywhere: no web fonts, no CDN, no remote images. Draw
  icons as inline SVG. The build fails on `http://` or `https://` in your
  files (SVG namespace URLs on `www.w3.org` are allowed).

## Real content

The spec is only useful if it looks like the real app on a real day.

- Real names, real numbers, real dates, real copy. Never lorem ipsum, "Item 1"
  or "John Doe". If the app exists, use its actual data shape and strings.
- Realistic lengths: include one long name, a large number, a two-line title.
  This is where layouts break.
- Every state gets its own true content: the empty state says what to do
  next, the error state says what happened and how to fix it, the offline
  state shows what is stale.
- One primary action per screen, with a verb label ("Add plant", not "OK").
- Use the same sample data across screens so the app tells one story.

## Voice table

The voice table turns tone into rules a developer can apply. Each row is a
phrase to avoid and the phrase to use instead:

| Instead of | Say |
| --- | --- |
| Error 500 | Can't reach the server. Try again in a minute. |
| Are you sure? | Delete "Monstera"? Its watering history is deleted too. |
| Submit | Save plant |
| No data | No plants yet. Add your first one to get reminders. |

Aim for 8 to 15 rows that cover errors, empty states, confirmations, buttons
and permission prompts. Pull the "Instead of" side from the existing app when
there is one.

## Implementation notes

Notes sit under each screen's phones. Write them for the person or agent who
builds the screen:

- Exact sizes that matter: row height, padding, image size, corner radius
  token.
- Behaviour that a static picture cannot show: what scrolls, what is sticky,
  what happens on tap, swipe actions, pull to refresh, animations.
- Which state appears when, and how the app moves between them.
- The intended SF Symbol for each icon you drew by hand.
- Accessibility: VoiceOver labels, what changes at large text sizes.

Keep each note short: a title and two to five lines.

## Inspect mode

The shell has an "Inspect measurements" toggle. Hovering an element inside a
phone shows its size in pt, padding, position, corner radius, and for text
the font size, line height, weight, type token and colour. Text colours and
fills are shown by token name when they match a colour token. Add
`data-c="Name"` to the elements a developer should know by name (components
and key parts); the inspector shows that name, and for elements inside it
"Name › tag":

```html
<div class="plant-row" data-c="PlantRow">...</div>
```

Use the same names as the components in the code, or the names you propose
for them. The checker also uses `data-c` names when it reports a problem.

## Truncation

The checker fails any text that is cut off by `overflow: hidden`. When cutting
is intended, for example a long name in a one-line list row, mark the element
(or an ancestor) with `data-allow-truncate`:

```html
<span class="t-headline row-name" data-allow-truncate>${plant.name}</span>
```

Use it sparingly. Titles, buttons and error messages should wrap, not cut.

## Downloads

Downloads give the developer files they can drop into the code. The most
useful one is the tokens file for the target platform. `text` can be a
function that receives the tokens, so the file always matches the spec:

```js
function swiftTokens(t) {
  const hex = (c) => c.replace('#', '0x');
  const colors = Object.entries(t.color)
    .map(([k, v]) => `    static let ${k} = Color(hex: ${hex(v)})`).join('\n');
  return `import SwiftUI\n\nenum Palette {\n${colors}\n}\n`;
}
```

Other good downloads: a strings file built from the voice table, or the
screen-to-view mapping as Markdown.

## Saving and sharing

The built file is self-contained: send it as is. The "Save this HTML" button
in the sidebar downloads a copy of the file as built, named
`<app-name>-design-spec.html` (`<title>-proposals.html` in a proposals file;
names in lower case with dashes),
which helps when the user opened it from a chat or mail preview. Build and
check it before every delivery (see [checks.md](checks.md)).
