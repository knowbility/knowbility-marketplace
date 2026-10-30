<!-- WORKED EXAMPLE — output of the computed-style consistency method (fingerprint.mjs), from a
  real session against a live web app. Shows the shape of the deliverable: tokens
  that are consistent, divergences as concrete token drift (not pixel noise), and the judgment
  call of routing design-system questions to a human rather than auto-filing them. -->

# Cross-page consistency diff

**Date:** 2026-06-10
**Method:** `fingerprint.mjs` against the live QA deployment, computed styles for sidebar, headings, cards, buttons, and body type.
**Pages:** Settings, Boardroom, Profile, Business data, Advisors (chat).
**Raw data:** `fp-*.json` in this folder.

## Consistent across all surfaces (good)

- **Sidebar:** 240px wide, nav items IBM Plex Sans 16px / weight 400. Identical everywhere.
- **Body type:** IBM Plex Sans 16px / line-height 24px. Identical everywhere.
- **Content-page H1:** Libre Baskerville 32px / weight 400 / lh 36.8px. Settings, Profile, and Business data all match exactly.
  - Note: the live app uses 32px H1, not the 28px from the mockup hierarchy decision. That is the engineered app's choice, not a defect.

## Divergences

### 1. Card corner radius drifts by surface
| Surface | Dominant card |
|---|---|
| Profile | r8px / 1px solid / 32px padding (x6) |
| Business data | r8px / 1px solid / 32px padding (x10) |
| Boardroom | r4px / 1px solid (x2) |
| Advisors (chat) | r14px / 1px solid (x1) |
| Settings | none (borderless sections) |

Form pages standardize on **r8px**. Boardroom uses **r4px**. Chat uses **r14px**. One radius token would unify them (or document the per-surface intent).

### 2. Settings does not use the bordered-card pattern
Profile and Business data wrap every section in an r8px bordered card. Settings renders its panels borderless (spacing + dividers only). This reads against the "every region is a card on the grid" rule. Either card the Settings sections or treat Settings as a deliberate exception.

### 3. Boardroom hero is an H2, not an H1
Filed as WEB-4288. Visually it is Baskerville 32/400 like the other H1s, but it is the wrong element and the page has no H1.

### Secondary headings (minor)
- Profile and Business data agree: H2 = IBM Plex Sans 20px / 700 ("Business identity", "Basics").
- Settings uses bold field labels instead of H2 section headings. Not a token drift, just a different section-labeling approach.

## Recommendation
Divergences 1 and 2 are design-system token/pattern decisions, not release defects. Route to the design system (pick a canonical card radius; decide whether Settings is carded) rather than filing as HAC bugs. Divergence 3 is already filed.
