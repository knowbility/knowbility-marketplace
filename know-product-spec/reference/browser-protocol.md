# Looking at a surface, rather than reading it

How `ui-review` gathers runtime evidence. The rules here exist because every one of them has a cheap shortcut that produces a confident wrong answer.

## The posture

**Open the surface in a browser and look at it.** Source inspection, DOM queries, accessibility snapshots, and automated assertions support a review. They never replace looking.

**A screenshot must be inspected, not merely captured.** Producing an image and moving on is the most common way a review claims visual coverage it does not have. If you did not read the screenshot, you did not check the surface.

The reason this is stated so hard: a state can be present in the markup, correctly wired, and still never reach a person, because something in the surface's own styling outranks the mechanism meant to reveal it. Every source-based method reports that as healthy. It is the defect class this skill exists for.

## Setup

For each role or materially different starting condition:

1. Use a fresh browser context. Never inherit state from an unrelated session.
2. Navigate to the exact route.
3. Establish the role, permissions, and prerequisite data through the project's own documented setup.
4. Wait for a stable visual state.
5. Record the URL, role, viewport, data condition, and how setup was done.

**Serve the surface over HTTP.** A file opened from disk is not the page a browser serves, and the differences land exactly where this review looks. If a local server is needed, start it, record how to stop it, and stop it before reporting.

**Bust the cache when re-checking an edited surface.** A stale copy silently invalidates a whole pass. Append a changing query parameter and confirm you are looking at the new version.

## What to do on every surface

1. Capture and read an initial screenshot.
2. Inspect it for hierarchy, composition, spacing, typography, content, visible state, controls, overflow, clipping, and unexpected overlays.
3. Exercise the primary task.
4. Capture and read the resulting states.
5. Reach the relevant alternate, failure, and recovery states.
6. Repeat at representative widths.
7. Record what was observed and, explicitly, what was not.

## Interact the way a person does

- Use visible links, buttons, fields, menus, dialogs, and controls.
- Prefer locators by role, accessible name, label, placeholder, and visible text. Use test ids only when nothing user-facing is available.
- Exercise keyboard-only operation where it matters.
- **Never execute script in the page to bypass the interface.**
- **Never call internal functions to manufacture a completed state.**
- **Never mutate application state directly to produce a pass.**
- Never dismiss an unexpected error, banner, or overlay just to keep going. That overlay is a finding.
- **Never treat a bound handler, a hidden node, or a successful selector lookup as proof that something works.** Presence is not behavior.

Documented fixtures may establish prerequisite data or hard-to-reach states. They must not stand in for the interaction being evaluated.

## The walkthrough

Where applicable, confirm by doing:

- The purpose of the surface is understandable.
- The primary action is discoverable.
- The task can be completed.
- Secondary actions do not compete with it.
- Validation appears at the right time and place.
- Loading feedback is visible.
- Empty states offer a next action.
- Errors say what happened and how to recover.
- Success is recognizable.
- Cancel, back, close, and retry behave predictably.
- Focus order is logical, focus is visible, dialog focus is contained and restored.
- Content does not clip, overlap, or become unreachable.
- Required actions survive at narrow widths.
- Realistic and long content does not break the layout.
- Permission and read-only conditions match the story.
- Refresh and return preserve or discard state as the story requires.

Do not test states the workflow does not have. Every state exercised maps to a requirement or a credible risk.

## Widths

Use the project's own breakpoints when the profile names them. Otherwise inspect at least a desktop width near 1440 by 900 and a mobile width near 390 by 844, adding a tablet width when the layout has one.

**One viewport never establishes responsive coverage.** Say which widths were inspected.

## What to record per surface

The route, the role, the viewport, the task attempted, the visible controls used, the states actually reached, the screenshots read, the keyboard paths exercised, relevant console output, network failures that affected the experience, and a result of pass, fail, blocked, or unverifiable.

## When you cannot get in

If a surface cannot be reached or operated:

- Report the exact blocker and the steps attempted.
- Keep source-based observations, marked as supported inference, never as observed.
- Classify the runtime behavior unverifiable.
- **Do not award a runtime or responsive pass**, and do not call the story ready when the missing evidence is material.

## Cleanup

Stop any server this review started. Keep the screenshots that are evidence and discard the rest. Say in the run notes what was cleaned up and what was left running.
