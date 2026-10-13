# Step 1: Brief and references

The brief is one page. It is what you and the user agree the app is for. Every
later step points back to it.

## Questions

Ask a few at a time, in plain words. Skip anything the user already answered.
If the app exists, answer what you can from the code first and only ask the
rest.

**The app**
1. What does the app do, in one sentence?
2. Who uses it? What are they doing when they open it?
3. What are the three things people do most often?
4. What must never go wrong (lost data, wrong payment, missed message)?

**Scope**
5. Is this a new app or a redesign? If a redesign, what is wrong today?
6. Which screens are in scope? Anything explicitly out of scope?
7. iPhone only, or also iPad, Mac, Android or web later?
8. Sign-in, payments, notifications, offline use: which apply?

**Look and voice**
9. Light, dark, or both? Any brand colours, logo or type to keep?
10. Three words for how it should feel (for example "calm, exact, quick").
11. How should it talk? Formal or casual? "You" or "we"?

**References**
12. Which apps do you like, and what exactly do you like about each?
13. Which apps do you dislike, and why?

**Constraints**
14. Deadlines, platform minimum (for example iOS 17), accessibility needs,
    languages?
15. Hard limits that shape the UI: what the platform or a service will not
    let the app know or do. For example, iOS does not tell an app whether a
    call was blocked, so no screen can show "blocked calls today". Find these
    in the code and the platform docs, and ask the user about any you suspect.

## Reference intake

Ask for references as screenshots, links, or App Store app names. For each
one, record:

| Reference | What to borrow | What to leave |
| --- | --- | --- |
| Name or file | One concrete idea, for example "grouped settings with short footers" | What does not fit, for example "dense icon grid" |

Rules:

- Borrow ideas, not pixels. Never copy a layout one to one, never copy names,
  icons, illustrations or text.
- Be concrete. "Clean" is not a borrowable idea; "one primary action per
  screen, at the bottom" is.
- If the user gives an App Store name only, describe what you know about it
  and ask the user to confirm the part they mean, or ask for a screenshot.
- Images the user shares are inputs for you. Do not embed them in the
  deliverables unless the user asks and owns them.

## Reading an existing app

If the app exists, read the code before you design. Look for:

- [ ] **Entry and navigation**: the root view, tab bar, navigation stacks,
      sheets, deep links. Write the real screen list from this.
- [ ] **Each screen**: file name, what it shows, what actions it has, which
      conditions change it (empty list, error, loading, signed out).
- [ ] **Data**: the models behind each screen, field names, sizes (how long can
      a name be, how many items in a list), and where data comes from.
- [ ] **Copy**: every user-facing string, including errors and alerts. Note
      the ones that are unclear or technical.
- [ ] **States the code already handles**, and the ones it does not.
- [ ] **Permissions and system features**: camera, photos, notifications,
      location, Face ID, widgets, share sheet.
- [ ] **Current look**: colours, fonts, spacing values, custom components.
      Note what to keep.
- [ ] **Settings and feature flags** that change what a screen shows or hide
      a screen entirely. List every flag and what it turns on.
- [ ] **Platform minimum** and UI framework (SwiftUI, UIKit, React Native,
      Flutter...).
- [ ] **Languages**: which locales ship, where strings live, and which
      strings are hard-coded in views. Design for the longest language.
- [ ] **Old design material** in the repo (briefs, specs, mockups, store
      text). Read it, but check every claim against the code: old documents
      are a common source of wrong copy and features that no longer exist.

Write file paths next to each finding. You will need them for the handoff
(see [handoff.md](handoff.md)). For a large app, give each reader one area of
this list and merge the results.

Put the full inventory in `design/existing-app-notes.md`. The brief keeps only
a short summary and a link to it, so the brief stays one page.

## Brief template

Save as `design/brief.md`. Keep it to one page; long material goes in
separate notes files that the brief links to.

```md
# <App name>: design brief

## What it is
One sentence. Who it is for and when they use it.

## Top tasks
1. ...
2. ...
3. ...

## Scope
In: ...
Out: ...
Devices: iPhone first (iPhone 17 Pro frame). Later: ...

## Feel
Three words: ...
Light / dark: ...
Keep from the current app or brand: ...

## Voice
How it talks, with two example lines.

## References
| Reference | Borrow | Leave |
| --- | --- | --- |

## Existing app (if any)
Repo and commit read, framework, platform minimum, main files, what to keep,
what to fix. Full inventory: existing-app-notes.md.

## Hard constraints
Platform or service limits that shape the UI, one line each.

## Pending decisions
Questions only the user can answer, each with your drafted answer or wording:
- (question) · Draft: "(proposed wording or behaviour)" · Blocks: (which screens)

## Constraints and open questions
...
```

Show the brief to the user. Small fixes are fine without a full round; then go
to the screen map (see [screen-map.md](screen-map.md)).
