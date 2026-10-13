# Step 3: Visual directions (Gate 2)

A direction is a complete look: colours, type, density and shape. The user
picks one by seeing it on their own screens, not on a mood board.

## What to make

- **3 or 4 directions.** Two is a yes/no question; five is too many to hold
  in mind.
- **The same 3 or 4 key screens in each direction**, with the same real
  content. Pick the screens the user will look at most: usually the home
  screen, one detail screen, one list or form, and one state that carries
  feeling (empty state or first run).
- **Only the look changes.** Keep layout and content the same across
  directions so the comparison is fair. Layout choices come in step 4 (see
  [variants.md](variants.md)).
- **Each direction is honest.** No straw men. Every option should be one you
  would be glad to build.

## What varies

Change these on purpose, and make the differences visible at a glance:

| Axis | Examples |
| --- | --- |
| Palette | Dark and calm; light and warm; neutral with one strong accent; tinted surfaces |
| Type | System font only; rounded headings; tighter, bolder titles; larger body |
| Density | Airy (big rows, few items per screen) vs compact (more on screen, smaller gaps) |
| Shape | Corner radius (sharp, 8, 14, 22), card vs plain list, outlined vs filled buttons |
| Emphasis | Where the accent colour goes: primary button only, or headers and icons too |

Tie each direction to the brief: one of the three feel words, or a reference
the user liked. Give each a short name and a one-line blurb, for example
"B · Quiet: light grey surfaces, one blue accent, roomy rows".

Check contrast in every direction. A direction that fails 4.5:1 for body text
is not a real option (see [iphone.md](iphone.md)).

## The file

Write `design/directions.js` with `defineProposals`. Start from a copy of the
example's `proposals.js`, and copy `proposals.css` to `directions.css` (the
build inlines the CSS file named after the entry, or `app.css` if there is
none). One group per direction; the group's `tokens` use the same shape as the
spec tokens, so the winning direction's tokens move straight into `app.js`
later.

```js
defineProposals({
  title: 'Pocket Garden · visual directions',
  intro: h`<p>Four looks on the same four screens. Pick one, or two to mix.</p>`,
  groups: [
    {
      id: 'a', title: 'A · Soil', blurb: 'Warm dark, rounded cards, big numbers',
      tokens: { color: { bg: '#15120F', surface: '#221D18', text: '#F2ECE4', muted: '#A99C8C', accent: '#E0A458' },
                type: { title: { size: 28, weight: 700, line: 34 }, body: { size: 17, weight: 400, line: 22 } },
                space: { s: 8, m: 16, l: 24 }, radius: { card: 18, button: 14 } },
      items: [
        { label: 'Home', render: (ctx) => homeScreen(ctx) },
        { label: 'Plant', render: (ctx) => plantScreen(ctx) },
        { label: 'Empty', render: (ctx) => emptyScreen(ctx) },
      ],
    },
    // groups b, c, d: same items, different tokens
  ],
});
```

Write each screen once as a function and reuse it in every group. The shell
applies the group's tokens as CSS variables scoped to that group (`--c-accent`,
`--s-m`, `--r-card`, `--t-body-size`, and classes like `.t-body`; see
[spec.md](spec.md)), so the same markup takes on each look. When a direction
needs more than token changes (for example cards instead of a plain list),
pass a flag through your own function, not a copy of the screen.

Build and check before you send it:

```sh
python3 <skill>/scripts/build.py design --entry directions.js -o design/out/directions.html
uv run <skill>/scripts/check.py design/out/directions.html
```

Screenshots and the report land in `design/out/directions-check/`.

## Gate 2

Stop and ask. Use the agent's interactive question tool if it has one, with
the direction names as options plus "mix two". Otherwise ask in plain text and
wait.

Script:

> Here are four directions on the same four screens: (file).
> A · Soil: ... B · Quiet: ... C · ...: ... D · ...: ...
> Which one should the app use? You can also pick two to mix; say what to
> take from each (for example "B's colours with A's rounded cards").

Do not start step 4 until the user picks. You may say which one you would
choose and why, in one sentence, but the user decides.

After the user picks, record it in the file: set `pick: true` on the chosen
group (the shell shows a "Picked" badge) and put the user's reason in its
`why` (short HTML caption). Rebuild, so the file you keep matches the
decision.

## Mixing two directions

When the user picks two:

1. Write down what comes from each, one line per axis (palette, type,
   density, shape, emphasis).
2. Build the mix as one new group and check its contrast.
3. Show the mix next to the two parents in a short proposals file, or as the
   first group in the variants file, and confirm in one question: "Is this the
   mix you meant?"

Mixing palettes is the riskiest part: an accent that worked on a dark
surface may fail contrast on a light one. Adjust the colour, keep the idea.
