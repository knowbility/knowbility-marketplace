# PRD: Shift swap board

> Fixture. Reads complete and is not. Contains three planted invented decisions and one untestable criterion. The plants are recorded in `adversarial-build-note.md`, which a grading run must not consult.

**Worked example:** `fixtures/shift-swap-board.html`, demonstrating `state-open`, `state-claimed`, `state-approved`, `state-expired`, `state-empty`.

**Scope:** one new surface, the swap board, reachable from the staff home screen. Adds the request card to the surface registry.

**Route or entry point:** `/swaps`, proposed, 2026-07-20. Deep links to a single request at `/swaps/<id>`.

**Owner:** product Dana Whitfield (front-desk lead). Engineering TBD, named before the first story is picked up.

**Last updated:** 2026-07-20, first draft.

**Reads with:** the roster spreadsheet contract, which owns who is scheduled where. The staff directory, which owns certifications and site assignments.

---

## The case

### The problem and the person

Dana is the front-desk lead at an urgent care clinic with two sites and fourteen front-desk staff. Today, covering a shift takes seven steps: the person posts in the staff group text, someone replies to claim it, Dana notices the claim, Dana checks the roster spreadsheet to confirm the claimant is free and site-certified, Dana approves in the thread, Dana edits the spreadsheet, Dana updates the break-room whiteboard. Staff then check the whiteboard on arrival, and many text Dana anyway because it has been wrong before.

It costs Dana about five hours a week, almost all of it the middle four steps. Twice last quarter a claim scrolled past unnoticed and a desk opened with nobody at it, which means a patient queue and a provider running their own intake.

### The outcome

Six months from now, nobody arrives to find an uncovered desk, and Dana sees what happened rather than making it happen.

Observable: uncovered shifts discovered on the day, currently two per quarter, at zero. Dana's swap-handling time, currently about five hours a week, under one. Swap requests resolving without Dana touching them, currently zero, above half.

### The fit

This serves the clinic's staffing-reliability goal: a desk covered every open hour without agency rates for last-minute cover. The minimal increment is a board where a request is posted, claimed by someone the system already knows is eligible, and approved in one action. The eligibility check is what removes the five hours.

Not a scheduling system. The roster spreadsheet stays the source of truth and keeps its owner.

### The deal-breakers

- If staff must install an app, this fails. Half work from shared clinic tablets.
- If Dana still hand-edits the roster after approving, most of the saving evaporates.
- If approval routinely takes more than a working day, people return to the group text.
- If a claim can be approved for someone ineligible, the clinic has a compliance problem worse than the scheduling one.

---

## §0 · Engineering context (input required)

1. **Can the roster spreadsheet be written to programmatically, and by what mechanism?** Blocks §15 and the appendix's `roster_write` shape. **Must not be assumed:** that a write path exists, or that a read path implies a write path.
2. **Is the staff directory's certification field current?** Blocks §7 and the appendix. **Must not be assumed:** that it is populated for all fourteen staff or updated when site training completes.

---

## Part I · Product spec

### 1. Overview

A single board listing shifts that need cover. Staff post a request, eligible colleagues claim one, and the lead approves in one action, which writes the change back to the roster.

The core thesis: the lead's five hours go on reconciliation, so the system's job is the eligibility check, not the conversation.

Hard boundaries: the roster remains the source of truth, the board never assigns anyone without an explicit claim, and no ineligible claim is ever presented as approvable.

### 2. Variation model

| Shift type | Who is eligible | Claim window closes |
| --- | --- | --- |
| Weekday day | Front-desk staff certified for that site | 2 hours before start |
| Weekend | Front-desk staff certified for that site | 12 hours before start |
| Overnight | Certified for that site and triage-trained | 24 hours before start |

Approval should happen promptly once a claim is in, so the shift is settled well before it starts.

### 3. Intent

- **The lead approves, the system checks.** A human decides; the machine never presents an ineligible claim as approvable.
- **One place to look.** A swap whose status is not on the board is a failure regardless of outcome.
- **Nobody is volunteered.** Cover comes from an explicit claim.
- **The roster is not forked.** Every approved swap lands in the roster.

### 4. The experience

Priya needs her Thursday shift covered. She opens the board, taps New request, picks the shift from her own upcoming list, adds a note explaining she has a family commitment, and posts it.

Marcus is off Thursday and certified for Eastside. He sees the request, taps Claim, and it moves to awaiting approval with his name on it. Dana opens her approvals list, sees the eligibility line confirming Marcus is free and certified, and taps Approve. The roster updates and both of them see the request as approved.

If Marcus were not eligible he would never have seen a Claim button. If Dana declines, the request returns to open with her reason attached.

### 5. Lifecycle states and loops

| State | Trigger | What renders |
| --- | --- | --- |
| `open` | Posted, or a claim declined | Card with shift details and note, Claim button for eligible viewers only |
| `claimed` | Eligible staff claims | Card with claimant name and an awaiting-approval label, no Claim button |
| `approved` | Lead approves and the roster write succeeds | Card with claimant name and approval date, no actions |
| `declined` | Lead declines | Returns to `open` with the reason on the card |
| `withdrawn` | Requester cancels before approval | Card in withdrawn state, no actions |
| `expired` | Claim window closes with the request still open | Card in expired state, no actions, distinct from approved |

**The return loop:** staff open the board because requests they can actually claim appear there. The eligibility filter is what keeps it worth opening rather than becoming noise.

### 6. Structure or model

A swap request references a shift, a requester, an optional note, a state, and its timestamps. A claim references a request, a claimant, the time of the claim, and the eligibility result recorded then. Shifts and staff members are read from the roster and the directory and are never created here.

### 7. Mechanics

**The eligibility rule**, evaluated at claim time and again at approval time:

1. The claimant is not the requester.
2. The claimant is not already scheduled during the shift's hours, per the roster.
3. The claimant holds site certification for the shift's site.
4. If the shift is overnight, the claimant is triage-trained.

All four must pass. Eligibility drives visibility: staff failing any rule see the request but no Claim button.

### 8. Inputs

In priority order: the roster, for who is scheduled and which shifts exist. The directory, for certifications and training. The board's own records, for requests and claims.

### 9. Variants with external parties

Does not apply. Agency and temp staff are not in the directory and cannot claim shifts.

### 10. Worked example

`fixtures/shift-swap-board.html` demonstrates five states, named in §5 and keyed to by the acceptance criteria.

---

## Part II · Implementation contract

### 11. Prior art disposition

| Prior art | Disposition | Note |
| --- | --- | --- |
| Group text thread | **Drop** as the swap mechanism | Stays in use for everything else |
| Break-room whiteboard | **Drop** once the board is live | Dana keeps it current briefly after launch, then stops |
| Roster spreadsheet | **Keep** | Source of truth. Written to on approval, per §0 item 1 |

### 12. V1 scope and non-goals

| Area | Status | Traces to |
| --- | --- | --- |
| Post a request from the requester's own upcoming shifts | Ships | Outcome: swaps resolve without the lead |
| Claim, restricted to eligible staff | Ships | Outcome: the check removes the lead's reconciliation |
| Approve or decline, with the roster write | Ships | Deal-breaker: approval must write back |
| Withdraw before approval | Ships | Outcome: fewer stale requests |
| Expiry on the shift type's claim window | Ships | Outcome: no uncovered shift found on the day |
| Five card states on one board, including the ineligible view | Ships | Intent: one place to look |
| Notifications | Post-v1 | v1 relies on staff opening the board, which the eligibility filter makes worthwhile |
| Partial-shift swaps | Post-v1 | v1 swaps a whole shift |
| Auto-approval | Not planned | The lead approving is the compliance control |
| Auto-assignment or rotation | Permanent non-goal | Nobody is volunteered |
| Replacing the roster spreadsheet | Permanent non-goal | Not what is failing |

### 13. State machine

`open` to `claimed` (claim) · `claimed` to `approved` (approve, roster write succeeds) · `claimed` to `open` (decline) · `open` to `expired` (claim window closes) · `open` or `claimed` to `withdrawn` (requester withdraws). `approved`, `expired`, and `withdrawn` are terminal.

**Visibility matrix:**

| State | Requester | Eligible other | Ineligible other | Lead |
| --- | --- | --- | --- | --- |
| `open` | Card, Withdraw | Card, Claim | Card, no action | Card, no action |
| `claimed` | Card, claimant name, Withdraw | Card, claimant name | Card, claimant name | Card, Approve, Decline, eligibility line |
| `approved` | Card, approval date | Same | Same | Same |
| `expired` | Card, expired | Same | Same | Same |

**Withdraw** and **Decline** are distinct verbs and must never collapse. Withdraw retracts a request; Decline rejects a claim and returns the request to `open`.

### 14. Reachability and access

- **Board:** any signed-in staff member. No public view.
- **Deep link to a request:** renders the card in its current state, actions per the visibility matrix.
- **Deep link the viewer may not act on:** read-only, not an error, since a colleague may have sent the link.
- **Deep link while signed out:** sign-in, then the requested request.
- **Deep link to a request that does not exist:** the not-found state with a link to the board.
- **Approvals list:** lead role only. Other staff get the board, with no error.

### 15. Actions (mutations)

| Action | Who | Writes to |
| --- | --- | --- |
| Post request | Requester | `swap_request` (new, `open`) |
| Claim | Eligible staff | `claim` (new), `swap_request.state` to `claimed` |
| Withdraw | Requester | `swap_request.state` to `withdrawn` |
| Approve | Lead | `swap_request.state` to `approved`, `approved_at`, and the roster write |
| Decline | Lead | `claim.declined_at`, `claim.reason`, `swap_request.state` to `open` |
| Expire | System, on time | `swap_request.state` to `expired` |

On approve the roster write happens first. If it fails, the state does not change and the lead sees the failure.

### 16. Empty, loading, error, and degradation

| Situation | Behavior | Class |
| --- | --- | --- |
| No open requests | `state-empty`: "No shifts need cover right now." | Graceful |
| Board loading | Card skeletons, New request available immediately | Graceful |
| Roster unreadable | Board renders, every Claim button disabled with an unavailable message, no claim accepted | Fails closed |
| Directory unreadable | Same. Certification cannot be confirmed, so nothing is claimable | Fails closed |
| Roster write fails on approve | State unchanged, lead sees a retry message, failure logged | Fails closed |
| Second claim on an already-claimed request | Second claimant sees that someone claimed first, request unchanged | Graceful |
| Request not found | Not-found state with a link to the board | Graceful |

Eligibility and the roster write are trust-bearing and fail closed. Everything else degrades so the board still renders.

### 17. Copy

Final. Implement as written.

- Empty board: "No shifts need cover right now."
- Claim button: "Claim"
- Claim disabled, eligibility unavailable: "Checking eligibility is unavailable, try again shortly."
- Claimed label: "Awaiting approval"
- Approved label: "Approved {date}"
- Expired label: "Expired, not covered"
- Withdrawn label: "Withdrawn by {requester first name}"
- Lead eligibility line: "{first name} is free {day} and certified for {site}."
- Roster write failure: "The roster could not be updated, so this swap is not approved yet. Try again."
- Second claimant: "Someone claimed this first."
- Decline prompt: "Why are you declining? {requester first name} will see this."
- Not found: "That request no longer exists."

Owned elsewhere: staff and site names from the directory, shift times from the roster, the decline reason written by the lead.

### 18. Acceptance criteria

Keyed to the worked example's states.

1. **Given** `state-empty`, **When** the board loads, **Then** the empty copy renders and New request is available.
2. **Given** `state-open` viewed by an eligible viewer, **When** the card renders, **Then** a Claim button is present.
3. **Given** `state-open` viewed by an ineligible viewer, **When** the card renders, **Then** the card is present and no Claim button exists.
4. **Given** `state-open` viewed by the requester, **When** the card renders, **Then** Withdraw is present and Claim is not.
5. **Given** `state-open`, **When** an eligible viewer claims, **Then** the request reads `claimed` with the claimant's name and no Claim button remains.
6. **Given** a claim, **When** the lead reviews it, **Then** the eligibility information is clear and sufficient for a confident decision.
7. **Given** `state-claimed`, **When** the lead approves and the roster write succeeds, **Then** the request reads `approved` with the approval date.
8. **Given** `state-claimed`, **When** the lead approves and the roster write fails, **Then** the state is unchanged and the failure copy shows.
9. **Given** `state-claimed`, **When** the lead declines with a reason, **Then** the request returns to `open` and the reason shows.
10. **Given** an overnight shift and a claimant certified but not triage-trained, **When** they view `state-open`, **Then** no Claim button exists.
11. **Given** `state-open` past its claim window, **When** expiry runs, **Then** the request reads `expired` and renders distinctly from `approved`.
12. **Given** the roster is unreadable, **When** the board loads, **Then** every Claim button is disabled and no claim is accepted.
13. **Given** two eligible viewers claiming the same request, **When** the second claim arrives, **Then** the second claimant sees the already-claimed copy.
14. **Given** a deep link the viewer cannot act on, **When** it loads, **Then** the card renders read-only with no error.
15. **Given** a deep link to a request that does not exist, **When** it loads, **Then** the not-found copy renders.
16. **Naming hygiene:** "cover request" and "shift trade" appear nowhere in copy, routes, components, class names, or analytics.
17. **Accessibility:** every card action is a focusable named control, the state label is announced with the card, and the board heading is the page's only h1.

### 19. Measurement

| Question | Event |
| --- | --- |
| Are shifts going uncovered? | `swap_request_expired`, with shift type |
| Is the lead still the routing layer? | `swap_approved`, with time from claim to approval |
| Do swaps resolve without the lead? | `swap_claimed`, with time from post to claim |
| Is the eligibility filter too narrow? | `swap_viewed`, with whether a Claim button was shown |
| Is the roster write reliable? | `roster_write_failed`, count and reason |

Flagged for reconciliation with the tracking plan before instrumentation.

### 20. Infrastructure and security

New endpoints for the board, request detail, and the six mutations. Reads from the roster and the directory, with one write to the roster on approve. Data classifications touched: staff names, work schedules, certifications. No patient data, and the board must never join to a clinical record. One new role check, lead. No external services. Cost drivers negligible at fourteen staff.

### 21. Design references and open items

Reuses card, button, and empty-state patterns. Adds the request card with five visual states, promoted as `swap-request-card` after confirming the name is unused. Open design task: expired must be distinguishable from approved at a glance.

### 22. Resolutions log

**2026-07-20, first draft.** Decisions: the roster stays the source of truth; approval is always required, with auto-approval a permanent non-goal; eligibility drives the Claim button's presence rather than an error after the fact; expired requests stay on the board. Provisional, default stated, confirmer Dana: notifications stay post-v1.

---

## Appendix · Data contract

Non-authoritative until reconciled. §0 owns both reconciliation items.

**`swap_request`**

| Field | Shape | Source of truth | Freshness |
| --- | --- | --- | --- |
| `id` | string | this system | n/a |
| `shift_id` | string | roster | read at post time, re-read at approval |
| `requester_id` | string | directory | read at post time |
| `note` | string, optional, 280 max | this system | n/a |
| `state` | one of the six in §5 | this system | live |
| `posted_at`, `approved_at`, `expired_at`, `withdrawn_at` | timestamp, nullable | this system | live |

**`claim`**

| Field | Shape | Source of truth | Freshness |
| --- | --- | --- | --- |
| `id`, `swap_request_id` | string | this system | n/a |
| `claimant_id` | string | directory | read at claim time |
| `claimed_at` | timestamp | this system | live |
| `eligibility_at_claim` | the four rule results | this system | recorded once |
| `declined_at`, `reason` | timestamp and string, nullable | this system | live |

**`shift`** (read from the roster): `id`, `date`, `start`, `end`, `site`, `shift_type`, `assigned_staff_id`. Re-read at approval, because eligibility depends on it.

**`staff_member`** (read from the directory): `id`, `first_name`, `last_name`, `site_certifications`, `triage_trained`, `is_lead`. Read per session.

**`roster_write`** (shape unknown, §0 item 1): whatever the roster accepts to reassign one shift. No shape may be assumed until item 1 resolves.

---

*Fixture for the product-spec plugin. Fictional product, no real clinic or staff.*
