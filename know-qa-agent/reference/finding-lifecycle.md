# The Finding Lifecycle

This is the canonical contract for everything the QA agent discovers. Detection is only the first third of the work — what separates a usable QA agent from a false-positive firehose is what happens after: filtering noise, characterizing the finding, not duplicating it, filing it where the team looks, and synthesizing many findings into the few that matter.

Every skill that produces, stores, or reports findings operates on this one structure. Skills forward this document into the tester's assignment; the tester applies it. If a skill's instructions and this document ever disagree about a finding's shape or routing, this document wins.

## The finding (data contract)

Every item the lifecycle handles is a *finding* with this shape. Emit every finding with these fields — in report prose they can read naturally, but each field must be answerable.

| Field | What it holds |
|---|---|
| `finding_id` | Assigned when the finding enters the registry: `F-YYYYMMDD-NN`, date plus a per-day sequence number. Never reused, even after resolution. |
| `scenario` / `step` | Where in the spec (or ad-hoc instruction) this surfaced. |
| `symptom` | What was observed, concretely. "Avatar request 404s and the row collapses," not "team page broken." |
| `expected` / `actual` | What the spec (or reasonable intent) called for vs. what happened. |
| `evidence` | The capture correlated to *this* finding: screenshot path(s), console excerpt, network request (URL, status, timing). Evidence that isn't correlated to the finding is noise. |
| `severity` | Critical / Major / Minor / Cosmetic — user impact, not implementation difficulty. |
| `confidence` | The existing model: certainty × severity, reported as High (Definite) / Medium (Likely) / Low (Possible). All levels are shown; none are hidden. |
| `reliability` | `deterministic` \| `intermittent` \| `transient` — see Reliability classification. |
| `root_cause_hypothesis` | Your best mechanism-level guess, stated as a hypothesis. "Likely a race between the avatar fetch and row render" is credible; "broken" is not. |
| `disposition` | What *kind* of finding this is — see the taxonomy. Decides its routing. |
| `duplicate_of` | The `finding_id` of the existing registry entry this duplicates, if any. |
| `ticket_link` | The tracker ticket, once filed. |
| `status` | `open` → `filed` \| `surfaced-for-decision` \| `known` \| `resolved`. |
| `area` | *(Optional)* The area key from `.know-qa/areas.json` this finding belongs to, when the run is area-scoped or the finding's scenario/spec maps to one. Absent when there's no registry or no match. |
| `owner` | *(Optional)* The owner handle for that area (from `areas.json` `owners`). A routing suggestion only — never an auto-assignment. |

## Disposition taxonomy (what keeps you from over-filing)

Classify every finding's disposition *before* reporting it. The disposition is the routing decision:

| Disposition | Meaning | Routing |
|---|---|---|
| `defect` | Objectively broken — a fact (failed request, console error, broken flow) backs it. | File it (when filing is wired). |
| `likely_defect` | Probably broken; one more confirmation would settle it. | Confirm (re-test, second angle) — then file or downgrade. |
| `needs_design_judgment` | An aesthetic or design-system call: is this dashed border intentional, does this radius belong in the system or a ticket. | Surface for a human decision. **Never file unilaterally.** This call belongs to the person, not the agent. |
| `spec_ambiguity` | The spec doesn't say, and reality could reasonably be intended. | Ask, citing both the spec text and the observed behavior. |
| `environment_noise` | A framework or environment artifact (see Known-benign classes). | Discard, with a one-line note in the report so the discard is auditable. |
| `known_issue` | Already in the filed-findings registry. | Cross-link; attach any new blast radius to the existing entry. Don't duplicate. |

Only `defect` and *confirmed* `likely_defect` flow to filing. Everything else routes to surface, ask, discard, or dedup. When you're unsure between `defect` and `needs_design_judgment`, choose `needs_design_judgment` — over-filing consistency nits buries the real findings.

## Reliability classification

A finding is reproduced before it is reported. Attempt the failing path once more, then label:

- **`deterministic`** — failed the same way both times. State it plainly.
- **`intermittent`** — varies across identical attempts. Pair the label with a hypothesis for the variance ("works warm, fails cold — likely a race in the avatar fetch"). "Works sometimes, fails others, likely a race in X" is a credible finding; an unqualified "broken" that a developer can't reproduce is not.
- **`transient`** — observed once, did not reproduce. Report it at Low confidence with the evidence you captured; never escalate a transient to filing on one observation.

This is distinct from the 3-failure escalation during a run (which is about when to stop retrying an *approach*). Reliability describes the *defect's* behavior, and it's part of the finding standard.

## Noise discipline (known-benign classes + warm/cold confirm)

A large share of QA judgment is deciding what *not* to file. Without this discipline, an autonomous sweep files dozens of false bugs per page.

**Known-benign classes** — signals that look like defects but usually aren't:

1. **Cancelled framework prefetches.** Modern frameworks (Next.js and peers) speculatively prefetch routes and cancel the requests on purpose. A `FAILED`/cancelled request matching a route-prefetch pattern is not a network defect.
2. **Dev/preview cold-compile artifacts.** First hit on a dev or preview server can show a blank/unstyled state or slow response while the route compiles. Cold-start slowness on a dev target is environment, not product.
3. **Streaming and loading intermediates.** Skeletons, partial hydration states, and streamed content mid-arrival are intended intermediate states, not layout breaks — judge the *settled* state.
4. **Third-party widget console noise.** Analytics, chat widgets, and embeds log errors and warnings from their own code. Console noise whose source URL is third-party is not the app's defect (note it once if it's loud, don't file per-page).

**The confirm procedure:** when a signal looks like a defect but matches a benign class, do not file *or* silently discard on first sight — confirm by re-test. Reload the same state (warm vs. cold: a second visit after the first has primed compilation/caches). If the symptom vanishes on the warm pass and matches a benign class, classify `environment_noise` and discard with a one-line note. If it persists, it is not noise — classify it on its merits.

## Visual findings (the corroboration rule)

The rendered screen is one of the four signals, and in autonomous mode you *look at* the screenshots you take — at load, after each meaningful interaction, and at error states — scanning for overlap, clipping, missing imagery, and unstyled flashes. But screenshot judgment is noisy, so:

- A visual finding earns **High confidence only when a DOM, network, or console fact corroborates it** — a failed image request behind the gap, an element whose computed size collapsed, a hydration error under the flash.
- A visual finding with **no corroborating fact caps at Medium confidence**, dispositioned `likely_defect` (if it reads as breakage) or `needs_design_judgment` (if it reads as intent).
- **Multi-sample ambiguous calls** before reporting: re-screenshot after settle, compare warm vs. cold. A "break" that only exists mid-load is a streaming intermediate (benign class 3).
- No visual-only finding gates a pass/fail result.

## The registry: `.know-qa/FINDINGS.md`

The durable, per-project register of findings — checked before filing, updated when filing, read by `/know-qa:monitor` every run. Human-readable; the human and the agent read the same file. (The session-scoped "filed this session" list in `QA-SESSION-STATE.md` rolls into this registry; the registry is the cross-session truth.)

**Entry shape** — one `##` block per finding, fields exactly as below:

```markdown
## F-20260611-03 — Avatar 404 collapses the team-row layout
- status: filed
- disposition: defect
- severity: Major · confidence: High · reliability: deterministic
- scenario: team page > member list
- symptom: GET /avatars/jdoe.png returns 404; row height collapses to 12px
- expected: avatar renders, row at full height · actual: broken image, collapsed row
- root_cause_hypothesis: avatar path built from username, not user id — stale after rename
- evidence: .know-qa/reports/2026-06-11-team.md, .know-qa/runs/team-sweep/fullpage.png
- duplicate_of: — · ticket_link: WEB-1042
- area: team · owner: jdoe
- first_seen: 2026-06-11 · last_seen: 2026-06-11
```

The `area`/`owner` line is optional — include it only when an area registry is present and the finding maps to an area; omit the line entirely otherwise.

**Rules:**

- IDs are assigned at append time (`F-` + date + two-digit sequence within that day) and never reused.
- New findings append with `status: open`. Filing sets `status: filed` and `ticket_link`. Human-routed items sit at `surfaced-for-decision`. When a finding is fixed and verified, set `status: resolved` and move the entry to the `## Archive` section at the bottom, so the active scan stays short.
- `last_seen` updates whenever a run re-observes the symptom.

**The dedup procedure** — before filing anything, read the registry's active entries and judge: does this new symptom share a **root cause** with an existing entry? Match on mechanism, not symptom string — a 404 avatar on the team page and a broken profile photo on settings are one registry entry if they share the stale-path cause. On a match: classify `known_issue`, set `duplicate_of`, update the existing entry's `last_seen`, and attach the broader blast radius there (and to its ticket, if filed) rather than opening a duplicate. This is what keeps `/know-qa:monitor` from re-filing the same issue every run.

## Area stamping and routing (optional)

This applies only when the project has a `.know-qa/areas.json`. With no registry, skip all of it — findings carry no `area`/`owner` and routing is unchanged.

**Stamping.** When a run is area-scoped, stamp `area` + `owner` from the active area onto each finding. When a run is *not* area-scoped but `areas.json` exists, derive the area by matching the finding's `scenario`/spec against each area's `match` (membership tag, `match.tags`, or `match.specs` glob); first match wins; none or ambiguous → leave both blank. Stamping is metadata only — it **never** changes a finding's disposition, confidence, or routing-by-disposition. A finding's owner is a *suggested* assignee surfaced at filing/report time, not an auto-assignment or an auto-notification.

**Escalation.** If `areas.json` carries an `escalation` matrix (rows of `area × severity → action`, with `area: "*"` as a wildcard), a finding whose `(area, severity)` matches an `escalate` row is flagged for escalation at report/filing time — surfaced in a dedicated "Escalations" block with the owner's notify handle. An absent matrix means no escalation (current behavior). Escalation only *flags* for a human or a wired connector; it never sends anything itself.

## Systemic-theme synthesis

The most valuable output of a sweep is usually not any single ticket — it's the observation that six of nine findings trace to one subsystem, which points the team at one shared fix instead of six separate ones.

After a sweep (and in `/know-qa:report`), cluster the findings — this run's plus the registry's open entries — by shared `root_cause_hypothesis` or component. Report themes alongside, not instead of, the individual list:

```markdown
## Systemic Themes
- **Avatar/media service** — 4 of 7 findings (F-…-01, -03, -04, -06) trace to media URLs
  built from mutable usernames. One fix likely clears all four.
- **Form error states** — 2 findings share missing error summaries (F-…-02, -05).
```

A theme needs at least two member findings and a plausible shared mechanism. Don't force singletons into themes. This is cross-finding synthesis — distinct from the during-a-run failure escalation and from cross-run trend analysis, both of which remain as they are.

## How this composes with the confidence model

The existing model is unchanged: confidence = certainty × severity, grouped High (Definite) / Likely (Medium) / Possible (Low), all levels shown. The lifecycle adds the dimensions around it — disposition decides *routing*, reliability describes *behavior*, the registry provides *memory*, themes provide *synthesis*. A finding's confidence never silently changes its disposition: a Low-confidence `defect` is still reported as a possible defect, not discarded.
