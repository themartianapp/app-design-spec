# Step 6: Handoff to code

Do this step when there is an app to build or change. The spec is the target;
the handoff says how to get there and how to check you arrived.

## Screen to code mapping

Start from the spec's screen list. For each screen, name the view it becomes
in code. If the app exists, use the file paths you found in step 1 (see
[brief.md](brief.md)).

Save as `design/handoff.md`:

```md
# <App name>: handoff

Spec: design/out/<app-name>-design-spec.html

## Screens
| # | Spec screen | States | Code view | New / change | Data it needs |
| --- | --- | --- | --- | --- | --- |
| 01 | Home | normal, empty, loading, offline | HomeView.swift | change | items, sync status |
| 02 | Item detail | normal, error | ItemDetailView.swift | new | item by id |

## Shared pieces
| Piece | Used on | Code |
| --- | --- | --- |
| Tokens (colours, type, spacing, radii) | all | Tokens.swift (downloaded from the spec) |
| Row with icon, title, detail | 01, 03 | ItemRow.swift |
```

Also put the code file names into the spec itself: each screen in `app.js` has
an optional `code` list (see [spec.md](spec.md)), so the spec shows which view
a screen maps to.

## Build tasks

Write tasks in an order that keeps the app working after each one:

1. Tokens first: colours, type styles, spacing, radii. Use the spec's
   downloads if it has them.
2. Shared components: rows, buttons, empty-state block, error banner.
3. Screens, in the order of the screen map. For each screen, build the normal
   state first, then each other state. States marked `(new)` in the screen
   map do not exist in the code yet: list each one as its own task.
4. Copy: apply the voice table (Instead of / Say) to every string, including
   errors and alerts.
5. Accessibility: Dynamic Type at large sizes, VoiceOver labels, 44 pt targets.

Each task names the spec screen and states it covers, the files it touches,
and how to verify it. Keep tasks small enough to review in one sitting.

When the user works with a coding agent, hand over the spec file plus
`design/handoff.md`; the notes under each screen in the spec are written for
the person or agent who builds it.

## Comparing the real app with the spec

After a screen is built, check it against the spec state by state.

1. Run the app on an iPhone 17 Pro simulator (402 × 874 pt) so sizes match the
   frame.
2. Put the app into each state from the spec: use test data, a flag, or a
   debug menu for empty, error, offline and loading. Turn on the largest
   standard text size for the large text state.
3. Take a screenshot of each state.
4. Put it next to the spec's screenshot of the same state. `check.py` saves
   one PNG per phone (see [checks.md](checks.md)); the spec PNG is at 1x, the
   simulator one at 3x, so scale one of them before comparing.
5. Note every difference in a table:

```md
| Screen / state | Difference | Fix in | Severity |
| --- | --- | --- | --- |
| 01 Home / empty | Button 36 pt tall, spec 50 pt | code | must fix |
| 02 Detail / normal | Date format differs | spec (code is right) | update spec |
```

Not every difference is a bug in the code. If the code made a better choice,
update the spec and say so. Keep the spec the single source of truth.

Fonts differ between a browser on a non-Apple machine and the simulator (see
[iphone.md](iphone.md)); compare spacing, sizes and structure, not exact text
wrapping.
