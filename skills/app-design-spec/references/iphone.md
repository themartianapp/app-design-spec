# iPhone rules

Every phone in the proposals and the spec uses the same frame. Design for it
first; other sizes come later, if the user asks.

## Frame

| Item | Value |
| --- | --- |
| Device | iPhone 17 Pro |
| Screen | 402 × 874 pt (1206 × 2622 px at 3x) |
| Top safe area | 62 pt (status bar and Dynamic Island) |
| Bottom safe area | 34 pt (home indicator) |
| Usable height | 874 − 62 − 34 = 778 pt |
| Dynamic Island | about 126 × 37 pt, centred, about 11 pt from the top |
| Status bar | time "9:41" on the left, signal, Wi-Fi and battery on the right |

The shell draws the frame, the Dynamic Island, the status bar and the home
indicator on top of your content. Your render function fills the whole
402 × 874 screen, so pad your own content: use the CSS variables
`--safe-top` (62px) and `--safe-bottom` (34px) the shell provides. 1 CSS px in
the frame equals 1 pt. The status bar uses the `text` colour token by
default. When a state's top differs (a dark photo header on a light app), set
`status: 'light'` (white text) or `status: 'dark'` (black text) on that state.

Keep every tappable element out of the top 62 pt and the bottom 34 pt. The
checker fails links, buttons, form fields and elements with a control role
there (see [checks.md](checks.md)). Backgrounds and scrolling content may run
under both areas; that is normal on iOS.

## Bars

Standard sizes, in points. Use them unless the direction deliberately changes
them.

| Bar | Height | Notes |
| --- | --- | --- |
| Navigation bar, inline title | 44 | Starts at y = 62 |
| Navigation bar, large title | 44 + 52 | Large title 34 pt bold; collapses to inline on scroll |
| Search field in nav bar | 36 field, about 52 row | Below the large title |
| Tab bar | 49 + 34 safe area | Up to 5 items; icon plus short label |
| Toolbar (bottom) | 44 + 34 safe area | For actions on the current screen |
| Sheet grabber | 5 × 36, 5 pt from the top of the sheet | Medium detent is about half the screen |
| List row | 44 minimum, often 52 to 72 with two lines | Inset grouped lists use 16 pt side margins |

Side margins: 16 pt is the iOS default; 20 pt is common on large screens. Pick
one and use it everywhere.

## Touch targets

- At least 44 × 44 pt for anything tappable. The visible shape can be smaller
  if the tap area is padded out.
- At least 8 pt between separate small targets.
- Primary actions sit in the bottom half where the thumb reaches. One primary
  action per screen.

## Type and Dynamic Type

iOS text styles at the default size (Large):

| Style | Size / line | Weight |
| --- | --- | --- |
| Large Title | 34 / 41 | Regular (often Bold in apps) |
| Title 1 | 28 / 34 | Regular |
| Title 2 | 22 / 28 | Regular |
| Title 3 | 20 / 25 | Regular |
| Headline | 17 / 22 | Semibold |
| Body | 17 / 22 | Regular |
| Callout | 16 / 21 | Regular |
| Subheadline | 15 / 20 | Regular |
| Footnote | 13 / 18 | Regular |
| Caption 1 | 12 / 16 | Regular |
| Caption 2 | 11 / 13 | Regular |

Name your type tokens after the roles you use and keep the ramp short. Body
text never below 15 pt; captions never below 11 pt.

People change the text size, and many use large sizes. At the largest
standard size (xxxLarge) Body grows from 17 to 23 pt, about 1.35 times. The
accessibility sizes go much further.

The shell has a **Large text** toggle and a `?scale=1.35` URL option. Both set
the CSS variable `--text-scale`, and token type sizes are multiplied by it.
For this to work, your CSS must size text from tokens, not fixed pixel values
(see [spec.md](spec.md)).

Design for large text:

- Let text wrap. Two lines at default size may become four.
- Rows with a label and a value stack vertically when the text gets large.
- Do not fix the height of anything that contains text.
- Truncate only where the content allows it (long names in a list), and mark
  those elements with `data-allow-truncate` so the checker accepts it.
- Add a "Large text" state to the screens where the layout changes.

The checker reloads every file at scale 1.35 and repeats the clipping and
overflow checks.

## Fonts

The shell uses the system font stack (`-apple-system, "SF Pro Text", ...`).
San Francisco cannot be bundled into the file: its license does not allow
redistribution. So:

- On an iPhone, iPad or Mac the spec shows SF, as the real app will.
- On Windows, Linux or Android the browser shows a fallback font. Widths
  differ by a few percent, so text may wrap slightly differently.
- The checker runs in Chromium on whatever machine runs it, usually with a
  fallback font. Leave a little slack in tight rows, and check the final file
  on an Apple device when you can.

If the app uses a custom brand font the user owns and may embed, it can be
inlined as a `data:` URL in `app.css`. Never fetch fonts from the web.

## Colour and contrast

- Text needs a contrast ratio of at least 4.5:1 against its background; large
  text (24 px and up, or 18.66 px bold and up) needs 3:1. The checker tests
  this on every phone.
- Do not use colour as the only signal. Pair it with an icon, a label or a
  shape.
- If the app supports light and dark, give each token a value for both and
  show at least the key screens in both.

## Icons

Draw icons as inline SVG in the render function. SF Symbols cannot be
embedded either; draw simple shapes of similar weight, and name the intended
SF Symbol in the implementation notes (for example "icon: `trash`").
