# E-Commerce Homepage

placeholder_allowlist: [Learn more, Shop now]

## Overview

The homepage is the primary landing page for the e-commerce store. It features a hero banner, product grid, navigation, and footer. This spec demonstrates the v2 visual testing features — Visual Focus, Design Reference, Browsers, `placeholder_allowlist` — and models how a spec transmits **design intent**: which visual deviations are signal, which are expected content churn, and which route to a human decision rather than a filed finding.

## Base URL

http://localhost:3000

## Personas

- unauthenticated user (browsing without login)
- logged-in user (use test@example.com / password123)

## Viewports

- desktop (1280x720)
- mobile (375x667)

## Accessibility Focus

- contrast
- interactive-elements

## Visual Focus

- design-verification
- ux-states
- layout-integrity
- performance-responsive

## Design Reference

Intent guidance for the comparison: the hero's **content** (campaign image, headline copy, promoted products) changes weekly — content differences from these references are expected and are not findings. Flag **structural drift** only: the layout grid, spacing system, navigation placement, type scale, and brand colors. Treat purely aesthetic deviations (a radius that differs, a shade that drifted) as `needs_design_judgment` — surface them for a human decision, never file them.

### desktop
- home-logged-out: .know-qa/designs/desktop-home-logged-out.png
- home-logged-in: .know-qa/designs/desktop-home-logged-in.png

### mobile
- home-logged-out: .know-qa/designs/mobile-home-logged-out.png

There is deliberately no logged-in mobile reference yet — the agent should skip that diff and note "no design reference for mobile/home-logged-in" in the report, per the documented Design Reference behavior.

## Browsers

- chromium
- webkit

## Test Scenarios

### 1. Homepage Loads Correctly

tags: [smoke, critical]

**Steps:**

1. Navigate to /
2. Verify the page loads without console errors
3. Check that the hero banner is visible
4. Check that the product grid displays at least 4 products

**Expected:**

- Hero banner image loads and is fully visible
- Hero image space is reserved before the image arrives — no visible layout shift when the banner loads (corroborate with the layout-shift entries from the performance pass)
- Product grid shows product cards with images, titles, and prices
- Navigation bar is present with all expected links
- Footer is visible at the bottom
- No console errors (warnings are noted in the report, not failed — benign warnings are common and gating on them buries real findings)

### 2. Responsive Layout

tags: [regression]
depends_on: 1. Homepage Loads Correctly

**Steps:**

1. At desktop viewport, verify the product grid shows 4 columns
2. At mobile viewport, verify the product grid shows 1-2 columns
3. At mobile viewport, verify the navigation collapses to a hamburger menu
4. At mobile viewport, open the hamburger menu

**Expected:**

- Desktop: 4-column product grid, full navigation bar
- Mobile: 1-2 column product grid, hamburger menu
- The open hamburger panel renders fully — not clipped by an ancestor with `overflow: hidden`/`auto` (if clipped, capture the ancestor's computed overflow as the corroborating fact)
- The hamburger trigger is a comfortable touch target (≥44×44 — the interactive-elements accessibility pass measures this)
- No horizontal scrolling at any viewport
- All images scale appropriately without distortion

### 3. Hero Motion Discipline

tags: [regression, a11y]
depends_on: 1. Homepage Loads Correctly

If the hero is static (no carousel, no entrance animation), note that and skip.

**Steps:**

1. Reload the page with `prefers-reduced-motion: reduce` emulated
2. Verify the hero content is present and readable without any animation playing
3. With normal motion settings, let the page sit untouched through one full carousel cycle (if a carousel exists)

**Expected:**

- Hero content is visible at full opacity under reduced motion — content visibility must not be gated on an animation class (a section stuck at computed `opacity: 0` is the corroborating fact, and is a defect, not a judgment call)
- Carousel auto-advance is paused or disabled under reduced motion
- Carousel advance under normal motion does not cause layout shift in surrounding content

## Edge Cases to Verify

- Very long product names (50+ characters) should truncate or wrap without breaking layout
- Missing product images should show a placeholder, not a broken image icon
- Empty product grid (no products) should show a meaningful empty state

## Things to Watch For

- **Performance**: Largest Contentful Paint should be under 2.5s (this is the measured threshold — there is no separate "page load" number)
- **Visual**: Product card spacing should be consistent across the grid. If an inconsistency has a DOM-corroborated cause (a collapsed element, a failed image request), report it as a likely defect with that evidence. If it is purely visual with no corroborating fact, it caps at Medium confidence and routes to `needs_design_judgment` — surfaced for a human, not filed.
- **Accessibility**: All images should have alt text, navigation should be keyboard-accessible. Text contrast on product cards (titles, prices, muted metadata) is checked deterministically by the contrast pass — exact WCAG AA math, so contrast failures may gate; gradient or image backgrounds get flagged for review instead.
- **Cross-browser**: Hero banner rendering may differ between Chromium and WebKit — note any differences; rendering differences are observations for a human unless something is functionally broken in one engine.

## Known Issues

None currently tracked.
