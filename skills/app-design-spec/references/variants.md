# Step 4: Page variants

The direction fixes the look. This step fixes the layout of the screens that
matter most, before you spend time on every state of every screen.

## What to make

- **Pick 2 to 4 screens.** The ones people use most, and the ones with the
  hardest layout question (a dense detail screen, a form with many fields, a
  home screen that must serve three tasks).
- **2 or 3 layouts per screen**, all in the chosen direction, all with the
  same real content.
- **Different ideas, not small tweaks.** Each variant answers the layout
  question differently. Examples:
  - Home: list grouped by day / cards with a summary on top / a single
    "next up" hero plus a short list.
  - Detail: everything on one scroll / tabs for sections / a summary with
    "more" sheets.
  - Form: one long form / step by step / inline edit on the detail screen.
- Show the important state too when the layout changes it, for example the
  empty state of each home variant.

## The file

Write `design/variants.js` with `defineProposals` (start from a copy of
`directions.js`, and copy `directions.css` to `variants.css`). One group per
screen; each item is one variant. Use the chosen direction's tokens in every
group.

Mark your pick on the item with `pick: true`, and give the reason in the
group's `why`. An item can also carry a short `note` caption, for example what
that variant is good at.

```js
const tokens = { /* chosen direction from step 3 */ };

defineProposals({
  title: 'Pocket Garden · page variants',
  intro: h`<p>Direction B · Quiet. Picks are marked; tell me if you want a different one.</p>`,
  groups: [
    {
      id: 'home', title: 'Home', tokens,
      blurb: 'What needs care today, at a glance.',
      why: 'Pick: B. The hero answers "what needs water today" without scrolling. A hides it in a list; C needs two taps.',
      items: [
        { label: 'A · Grouped list', render: homeList, note: 'Best with many plants' },
        { label: 'B · Next up', render: homeHero, pick: true },
        { label: 'C · Cards', render: homeCards },
      ],
    },
  ],
});
```

Build and check:

```sh
python3 <skill>/scripts/build.py design --entry variants.js -o design/out/variants.html
uv run <skill>/scripts/check.py design/out/variants.html
```

## How you pick

You pick by default. The user asked for a designer, not a quiz. Judge each
variant against the brief:

1. **Top tasks.** Which variant makes the most common task fastest: fewest
   taps, visible without scrolling?
2. **Real content.** Which one holds up with long names, many items, and no
   items?
3. **Large text.** Which one still works at 1.35 times text size? Turn on
   the Large text toggle and look.
4. **States.** Which one has a clear empty, loading and error version?
5. **Consistency.** Which one fits the other screens and the platform (see
   [iphone.md](iphone.md))?

If two variants tie, pick the simpler one.

## Stating why

For each screen, mark the pick with `pick: true` and write the reason in the
group's `why`, in one or two sentences. Name the deciding point and what the
other variants lose:

> Pick: B. The hero answers "what needs water today" without scrolling. A
> hides it in a list; C needs two taps to reach the same thing.

When you send the file, list the picks in your message and continue to the
spec unless the user objects. If the user overrides a pick, move `pick: true`
to their choice, rebuild, and do not argue it again. If you are truly unsure
between two, ask, using the agent's interactive question tool if it has one.
