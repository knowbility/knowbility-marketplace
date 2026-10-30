# PRD: Shift swap board

> Fixture. A fictional product, written to score 3 on every rubric dimension. See `perfect-annotated.md` for what earns each score.

**Worked example:** `fixtures/shift-swap-board.html`, demonstrating every state in §5 plus the viewer variants the criteria key to, each as a named section id. Plus `fixtures/swap-request.json`, one record per lifecycle state.

**Scope:** one new surface, the swap board, reachable from the staff home screen. Adds one component, the request card, to the surface registry. No change to the existing roster view.

**Route or entry point:** `/swaps`, proposed, 2026-07-20. Deep links to a single request at `/swaps/<id>`.

**Owner:** product Dana Whitfield (front-desk lead). Engineering TBD, named before the first story is picked up.

**Last updated:** 2026-07-22, review pass: the two open items that blocked shipping actions resolved, so no open item blocks one, and the worked example extended to every state the criteria key to. · 2026-07-21, decomposition pass: closed four gaps the decomposition test surfaced (note visibility, duplicate requests, the shift changing under a live request, and the lead approving their own request, left open at the time). · 2026-07-20, first draft (case, contract, and the two open engineering items).

**Reads with:** the roster spreadsheet contract, which owns who is scheduled where and is the source of truth for eligibility. The staff directory, which owns certifications and site assignments.

---

## The case

### The problem and the person

Dana is the front-desk lead at an urgent care clinic with two sites and fourteen front-desk staff. When someone needs a shift covered, this is what happens today:

1. The person posts in the staff group text ("anyone able to take Thursday 7 to 3 at Eastside?").
2. Whoever reads it first replies to claim it. People who are off that day often do not read it for hours.
3. Dana sees the claim, then checks the roster spreadsheet to confirm the claimant is not already scheduled that day and is trained for that site.
4. Dana replies in the thread to approve.
5. Dana edits the roster spreadsheet by hand.
6. Dana updates the paper whiteboard by the break room.
7. Staff check the whiteboard when they arrive, and many text Dana anyway to confirm, because the whiteboard has been wrong before.

It costs Dana about five hours a week, almost all of it steps 3 through 6. Twice last quarter a claim scrolled past unnoticed in the thread and a desk opened with nobody at it, which means a queue of patients and one provider running their own intake. Staff do not trust the whiteboard, so Dana fields confirmation texts on her days off.

### The outcome

Six months from now, nobody arrives to find an uncovered desk, and Dana is not the routing layer for swaps. She sees what happened rather than making it happen.

Observable: uncovered shifts discovered on the day, currently two per quarter, at zero. Dana's swap-handling time, currently about five hours a week, under one. Swap requests that resolve without Dana touching them, currently zero, above half.

### The fit

This serves the clinic's staffing-reliability goal: a desk covered every open hour without paying agency rates for last-minute cover.

The minimal increment is a board where a request is posted, claimed by someone the system already knows is eligible, and approved in one action. The eligibility check is the part that removes Dana's five hours, because steps 3 through 6 are all reconciliation she does by hand today.

It is deliberately not a scheduling system. The roster spreadsheet stays the source of truth and keeps its owner. Replacing it would be a much larger project and is not what is failing.

### The deal-breakers

- **If staff must install an app, this fails.** Half of them work from shared clinic tablets and will not install anything. It has to work in a browser they are already signed into.
- **If Dana still hand-edits the roster after approving, most of the saving evaporates.** An approval that does not write back to the roster is not worth building. The write is specified in the appendix, so this deal-breaker is satisfied rather than open.
- **If approval routinely takes more than a working day, people go back to the group text**, and a half-used board is worse than none because now there are two places to look.
- **If a claim can be approved for someone ineligible**, the clinic has a compliance problem worse than the scheduling one.

---

## §0 · Engineering context (input required)

1. **How often does the roster's sheet API rate-limit a single-cell update, and what is the retry budget?** Does not block any shipping action: §15's approve write is specified and implementable, and §16 already defines the behavior when it fails. This asks how often that failure path will fire so the retry copy can be tuned. **Owner:** engineering, once named. **Must not be assumed:** that failures are rare enough to skip the retry path, or that a retry can be silent.
2. **Is the staff directory's certification field kept current when someone completes site training?** Does not block the eligibility rule, which reads the field either way and is implementable as written. This is an operational risk: a stale field makes the check permissive rather than broken. **Owner:** Dana, who maintains the directory. **Must not be assumed:** that the field is current, or that the plugin can detect staleness.

Neither item blocks a shipping action or a deal-breaker path, which is why this PRD can be Build-ready. An open item that made the approve action unimplementable would hold it at Backlog-ready however well the rest scored.


---

## Part I · Product spec

### 1. Overview

A single board listing shifts that need cover. Staff post a request, eligible colleagues claim one, and the front-desk lead approves in one action, which writes the change back to the roster.

The core thesis: **the lead's five hours are spent on reconciliation, so the system's job is the eligibility check, not the conversation.** Everything else here exists to make that check trustworthy enough that approval is a single tap.

Hard boundaries the build has to honor: the roster remains the source of truth for who is scheduled, the board never assigns anyone without an explicit claim, and no claim reaches approval unless the eligibility rule passed at claim time and still passes at approval time.

### 2. Variation model

Requests vary by shift type, which changes eligibility and timing.

| Shift type | Who is eligible | Claim window closes | Approval window |
| --- | --- | --- | --- |
| Weekday day | Any front-desk staff certified for that site | 2 hours before start | Until start |
| Weekend | Any front-desk staff certified for that site | 12 hours before start | Until 4 hours before start |
| Overnight | Front-desk staff certified for that site **and** triage-trained | 24 hours before start | Until 12 hours before start |

Site certification is always required. Triage training is required only for overnight, because overnight has no triage nurse on site.

### 3. Intent

- **The lead approves, the system checks.** A human decides; the machine is responsible for never presenting an ineligible claim as approvable.
- **One place to look.** If a swap's status is not visible on the board, the board has failed, regardless of whether the swap succeeded.
- **Nobody is volunteered.** Cover comes from an explicit claim. No auto-assignment, no rotation, no nudging a specific person.
- **The roster is not forked.** Every approved swap lands in the roster. A swap that lives only on the board is a bug.

### 4. The experience

Priya is scheduled Thursday 7 to 3 at Eastside and needs the day. She opens the board, taps New request, picks her Thursday shift from her own upcoming list, and posts it. She can add a note but does not have to.

The request appears on the board as open. Marcus, who is off Thursday and certified for Eastside, sees it when he next opens the board and taps Claim. The request shows as claimed, with his name on it, and Dana gets it in her approvals list.

Dana opens her list, sees one claim with a green eligibility line ("Marcus is free Thursday and certified for Eastside"), and taps Approve. The roster updates. Priya and Marcus both see the request as approved, with the date it was approved.

If Marcus were not eligible, he would never have seen a Claim button on that request. If Dana declines, the request goes back to open with a reason, and Priya can see it needs another claimant.

If nobody claims it and the claim window closes, the request expires. It stays on the board in the expired state, because a request that vanishes is a request Dana has to remember.

### 5. Lifecycle states and loops

| State | Trigger | What renders | What drives it |
| --- | --- | --- | --- |
| `open` | Request posted, or a claim declined | Card with shift details, the note if there is one, and a Claim button for eligible viewers only. The note is visible to every viewer who can see the card, which the composer says before posting | Requester action, or lead decline |
| `claimed` | Eligible staff claims | Card with claimant name, awaiting-approval label. No Claim button for anyone | Claimant action |
| `approved` | Lead approves | Card with claimant name and approval date, no actions | Lead action, plus a successful roster write |
| `declined` | Lead declines a claim | Returns to `open`, with the decline reason on the card | Lead action |
| `withdrawn` | Requester cancels before approval | Card in withdrawn state, no actions | Requester action |
| `expired` | Claim window closes with the request in `open`, approval window closes with it in `claimed`, or the underlying shift is reassigned or removed in the roster | Card in expired state with the reason, no actions, visually distinct from approved | Time, or a roster change |

**The return loop:** staff open the board because requests they can actually claim appear there, and the eligibility filter is what makes that true. A board showing everyone every request would be noise within a week, and nobody would open it. The loop is backed by real eligibility, not by reminders.

### 6. Structure or model

- **Swap request:** the shift being given up, who posted it, an optional note, its state, and its timestamps.
- **Claim:** who claimed, when, and the eligibility result recorded at claim time.
- **Shift:** date, start and end, site, and shift type. Read from the roster, never created here.
- **Staff member:** name, site certifications, triage training. Read from the directory, never edited here.

Formal shapes in the appendix.

### 7. Mechanics

**The eligibility rule**, evaluated at claim time and again at approval time:

1. The claimant is not the requester.
2. The claimant is not already scheduled during the shift's hours, per the roster.
3. The claimant holds site certification for the shift's site.
4. If the shift type is overnight, the claimant is triage-trained.
5. The claim window for the shift type has not closed.

All five must pass. A claim that passed at claim time and fails at approval time is surfaced to the lead as no longer eligible rather than silently approved, because the roster can change in between.

Eligibility drives visibility: staff who fail any of rules 1 to 4 do not see a Claim button. They still see the request, so the board reflects reality.

### 8. Inputs

In priority order: the roster spreadsheet, for who is scheduled and which shifts exist. The staff directory, for certifications and training. The board's own records, for requests and claims. The board reads the first two and writes to neither, except the roster write on approval.

### 9. Variants with external parties

Does not apply. Agency and temp staff are not in the directory and cannot claim shifts. If that changes it is a new increment, because agency cover has a rate and an approval path this design does not model.

### 10. Worked example

`fixtures/shift-swap-board.html` demonstrates every state in §5 plus the viewer variants the criteria key to: `state-open`, `state-open-ineligible`, `state-open-requester`, `state-claimed`, `state-claimed-ineligible`, `state-approved`, `state-declined`, `state-withdrawn`, `state-expired`, `state-empty`, and `state-eligibility-unavailable`.

`fixtures/swap-request.json` carries one record per lifecycle state in §5, plus one posted by the lead for criterion 23, matching the appendix shapes.

---

## Part II · Implementation contract

### 11. Prior art disposition

| Prior art | Disposition | Note |
| --- | --- | --- |
| Staff group text thread | **Drop** as the swap mechanism | Stays in use for everything else. The PRD does not migrate its history |
| Break-room whiteboard | **Drop** once the board is live | Dana keeps updating it for two weeks after launch, then stops. Named here so it is a decision rather than a thing that lingers |
| Roster spreadsheet | **Keep** | Remains the source of truth. The board writes approved swaps to it, per §0 item 1 |

### 12. V1 scope and non-goals

| Area | Status | Traces to |
| --- | --- | --- |
| Post a request from the requester's own upcoming shifts | Ships | Outcome: swaps resolve without the lead |
| Claim, restricted to eligible staff | Ships | Outcome: the eligibility check removes the lead's reconciliation |
| Approve or decline, with the roster write | Ships | Deal-breaker: approval must write back |
| Withdraw before approval | Ships | Outcome: fewer stale requests the lead has to chase |
| Expiry on the shift type's windows | Ships | Outcome: no uncovered shift discovered on the day |
| Six card states on one board, including the ineligible view | Ships | Intent: one place to look |
| Notifications of any kind | Post-v1 | v1 relies on staff opening the board, which the eligibility filter makes worth doing. Revisit if half of requests expire unclaimed |
| Partial-shift swaps | Post-v1 | v1 swaps a whole shift. A half shift needs a roster model this does not have |
| Auto-approval of any shift type | Not planned | The lead approving is the compliance control |
| Requests posted by the lead | Not planned | There is one lead, so such a request would have no second approver. v1 refuses it at post time and the lead swaps through the group text as today. Revisit if a second lead is appointed |
| Auto-assignment or rotation | Permanent non-goal | Nobody is volunteered (§3) |
| Replacing the roster spreadsheet | Permanent non-goal | Not what is failing |

### 13. State machine

States in §5. Transitions:

`open` to `claimed` (claim) · `claimed` to `approved` (approve, roster write succeeds) · `claimed` to `open` (decline) · `claimed` to `expired` (approval window closes) · `open` to `expired` (claim window closes) · `open` or `claimed` to `expired` (the shift is reassigned or removed in the roster) · `open` or `claimed` to `withdrawn` (requester withdraws). `approved`, `expired`, and `withdrawn` are terminal.

**Visibility matrix**, since three viewer roles see the same request differently:

| State | Requester sees | Eligible other sees | Ineligible other sees | Lead sees |
| --- | --- | --- | --- | --- |
| `open` | Card, Withdraw | Card, Claim | Card, no action | Card, no action |
| `claimed` | Card, claimant name, Withdraw | Card, claimant name | Card, claimant name | Card, Approve, Decline, eligibility line |
| `approved` | Card, approval date | Same | Same | Same |
| `declined` | Returns to `open` with reason | Card, Claim | Card, no action | Card, no action |
| `withdrawn` | Card, withdrawn | Same | Same | Same |
| `expired` | Card, expired | Same | Same | Same |

**Navigation contract:**

| From | Affordance | To | What travels |
| --- | --- | --- | --- |
| Staff home | Swaps | Board | nothing |
| Board | card tap | Request detail `/swaps/<id>` | request id |
| Board | New request | Request composer | the requester's upcoming shifts |
| Lead approvals list | card tap | Request detail | request id |

**Withdraw** and **Decline** must never collapse into one verb. Withdraw is the requester retracting a request. Decline is the lead rejecting a claim, which returns the request to `open` for someone else.

### 14. Reachability and access

- **Board:** any signed-in staff member. No public view.
- **Deep link to a request** (`/swaps/<id>`): renders the card in its current state, with actions per the visibility matrix.
- **Deep link to a request the viewer may not act on:** renders read-only. Not an error, because a colleague may legitimately have sent the link.
- **Deep link while signed out:** sign-in, then the requested request.
- **Deep link to a request that does not exist or was hard-deleted:** the not-found state, with a link to the board. Never a blank card.
- **Approvals list:** the lead role only. Any other signed-in staff member gets the board instead, with no error, because the list is not secret, it is simply not theirs.
- **No public, anonymous, or partner access exists.**

### 15. Actions (mutations)

| Action | Who | Writes to |
| --- | --- | --- |
| Post request | Requester | `swap_request` (new, `open`). Refused if a non-terminal request already exists for that shift, so one shift never has two live requests |
| Claim | Eligible staff | `claim` (new), `swap_request.state` to `claimed` |
| Withdraw | Requester | `swap_request.state` to `withdrawn` |
| Approve | Lead | `swap_request.state` to `approved`, `swap_request.approved_at`, and the roster write (appendix `roster_write`) |
| Decline | Lead | `claim.declined_at`, `claim.reason`, `swap_request.state` to `open` |
| Expire | System, on time | `swap_request.state` to `expired` |

**The approve action is the only one with two write targets, and the order matters:** the roster write happens first. If it fails, the state does not change and the lead sees the failure. A request marked approved without a roster write is the exact fork §3 forbids.

### 16. Empty, loading, error, and degradation

| Situation | Behavior | Class |
| --- | --- | --- |
| No open requests | `state-empty`: "No shifts need cover right now." Nothing else | Graceful |
| Board loading | Card skeletons. The New request button is available immediately | Graceful |
| Roster unreadable | The board renders, and every Claim button is disabled with "Checking eligibility is unavailable, try again shortly." No claim is accepted | Fails closed |
| Directory unreadable | Same as roster unreadable. Certification cannot be confirmed, so nothing is claimable | Fails closed |
| Roster write fails on approve | State unchanged, lead sees "The roster could not be updated, so this swap is not approved yet. Try again." Logged | Fails closed |
| Claim arrives for a request already claimed | The second claimant sees "Someone claimed this first." The request is unchanged | Graceful |
| Claim was eligible at claim time, ineligible at approval | Lead sees the claim marked no longer eligible with the failed rule named, and Approve is disabled. Decline remains available | Fails closed |
| Requester posts a second request for a shift that already has a live one | Refused at post time: "There is already an open request for that shift." The existing request is unchanged | Graceful |
| The requested shift is reassigned to someone else in the roster while the request is `open` | The request expires with reason `shift reassigned`, and the card says "This shift is no longer yours to swap." No claim is accepted after that point | Fails closed |
| The requested shift is removed from the roster entirely while the request is `open` or `claimed` | Same as reassigned. The request expires with reason `shift removed` rather than being deleted, so the lead can see what happened | Fails closed |
| The lead posts a request for one of their own shifts | Refused at post time with the lead-conflict copy. Nothing is written | Fails closed |
| Request not found | Not-found state with a link to the board | Graceful |

Eligibility and the roster write are the trust-bearing paths and both fail closed. Everything else degrades so the board still renders.

### 17. Copy

Final. Implement as written.

- Empty board: "No shifts need cover right now."
- Claim button: "Claim"
- Claim disabled, eligibility unavailable: "Checking eligibility is unavailable, try again shortly."
- Claimed label: "Awaiting approval"
- Approved label: "Approved {date}"
- Expired label, window closed: "Expired, not covered"
- Expired label, shift reassigned: "This shift is no longer yours to swap."
- Expired label, shift removed: "This shift is no longer on the roster."
- Duplicate request refused: "There is already an open request for that shift."
- Lead posting refused: "There is only one lead, so a swap you post would have nobody to approve it. Use the group text for your own shifts."
- Withdrawn label: "Withdrawn by {requester first name}"
- Lead eligibility line, passing: "{first name} is free {day} and certified for {site}."
- Lead eligibility line, overnight passing: "{first name} is free {day}, certified for {site}, and triage-trained."
- Lead eligibility line, failing: "{first name} is no longer eligible: {failed rule}."
- Roster write failure: "The roster could not be updated, so this swap is not approved yet. Try again."
- Second claimant: "Someone claimed this first."
- Decline prompt: "Why are you declining? {requester first name} will see this."
- Not found: "That request no longer exists."

Owned elsewhere: staff names and site names come from the directory. Shift times and dates come from the roster. The decline reason is written by the lead.

### 18. Acceptance criteria

Keyed to the worked example's states by name.

1. **Given** `state-empty`, **When** the board loads, **Then** the empty copy renders and the New request button is available.
2. **Given** `state-open` viewed by an eligible viewer, **When** the card renders, **Then** a Claim button is present.
3. **Given** `state-open` viewed by an ineligible viewer, **When** the card renders, **Then** the card is present and no Claim button exists.
4. **Given** `state-open` viewed by the requester, **When** the card renders, **Then** Withdraw is present and Claim is not.
5. **Given** `state-open`, **When** an eligible viewer claims, **Then** the request reads `claimed`, the claimant's name shows, and no Claim button remains for anyone.
6. **Given** `state-claimed` viewed by the lead, **When** the card renders, **Then** Approve, Decline, and the passing eligibility line are present.
7. **Given** `state-claimed`, **When** the lead approves and the roster write succeeds, **Then** the request reads `approved` with the approval date.
8. **Given** `state-claimed`, **When** the lead approves and the roster write fails, **Then** the state is unchanged, the failure copy shows, and the failure is logged.
9. **Given** `state-claimed`, **When** the lead declines with a reason, **Then** the request returns to `open` and the reason shows on the card.
10. **Given** `state-claimed` where the claimant is now scheduled elsewhere, **When** the lead opens it, **Then** Approve is disabled and the failing eligibility line names the failed rule.
11. **Given** an overnight shift and a claimant who is certified but not triage-trained, **When** they view `state-open`, **Then** no Claim button exists.
12. **Given** `state-open` past its claim window, **When** expiry runs, **Then** the request reads `expired` and renders distinctly from `approved`.
13. **Given** the roster is unreadable, **When** the board loads, **Then** every Claim button is disabled with the eligibility-unavailable copy and no claim is accepted.
14. **Given** two eligible viewers claiming the same request, **When** the second claim arrives, **Then** the second claimant sees the already-claimed copy and the request is unchanged.
15. **Given** a deep link to a request the viewer cannot act on, **When** it loads, **Then** the card renders read-only with no error.
16. **Given** a deep link to a request that does not exist, **When** it loads, **Then** the not-found copy renders with a link to the board.
17. **Given** a signed-out deep link, **When** the viewer signs in, **Then** they land on the requested request.
18. **Given** a non-lead staff member, **When** they open the approvals list URL, **Then** they get the board with no error.
19. **Given** `state-open` with a note, **When** any viewer who can see the card renders it, **Then** the note is visible, and **When** the requester composes a request, **Then** the composer states that the note will be visible to colleagues before they post.
20. **Given** a shift with a live request, **When** the requester posts a second request for the same shift, **Then** it is refused with the duplicate copy and the existing request is unchanged.
21. **Given** `state-open` whose shift is reassigned in the roster, **When** the change is detected, **Then** the request reads `expired` with the reassigned reason and no claim is accepted afterwards.
22. **Given** `state-claimed` whose shift is removed from the roster, **When** the change is detected, **Then** the request reads `expired` with the removed reason rather than being deleted.
23. **Given** the lead posting a request for their own shift, **When** they submit it, **Then** it is refused with the lead-conflict copy and no request is created.
24. **Naming hygiene:** "cover request" and "shift trade" appear nowhere in copy, routes, components, class names, or analytics. The noun is "swap request" throughout.
25. **Accessibility:** every card action is a focusable named control, the state label is announced with the card, the board's heading is the page's only h1, and the claim-disabled reason is programmatically associated with the disabled control.

### 19. Measurement

| Question | Event |
| --- | --- |
| Are shifts going uncovered? | `swap_request_expired`, with state at expiry and shift type |
| Is the lead still the routing layer? | `swap_approved`, with time from claim to approval |
| Do swaps resolve without the lead? | `swap_claimed`, with time from post to claim |
| Is the eligibility filter too narrow? | `swap_viewed`, with whether a Claim button was shown |
| Is the roster write reliable? | `roster_write_failed`, count and reason |

Flagged for reconciliation with the tracking plan before instrumentation. The outcome's three numbers all derive from these five events, so if any is dropped the outcome becomes unmeasurable and §12 needs revisiting.

### 20. Infrastructure and security

- New endpoints: board list, request detail, and the five mutations in §15.
- New reads: the roster and the staff directory. Both read-only except the roster write on approve, which §0 item 1 owns.
- Data classifications touched: staff names, work schedules, and certifications. Schedules are employment data and stay inside the signed-in surface. No patient data is touched at all, and the board must never join to any clinical record.
- Auth or role changes: one new role check, lead, for the approvals list and the approve and decline actions. No new sign-in path.
- External services: none.
- Cost drivers: negligible. Fourteen staff, low volume.

### 21. Design references and open items

Reuses the existing card, button, and empty-state patterns. Adds one component, the request card, with six visual states, promoted as `swap-request-card` after confirming that name is unused in the design system. Open design task: the expired state must be visually distinct from approved at a glance, since both are terminal and one is a failure.

### 22. Resolutions log

**2026-07-22, review pass.** Two open items that blocked shipping actions were resolved, because a blocking open item cannot coexist with Build-ready. The roster write mechanism moved into the appendix, and §0 item 1 now asks about rate limiting, which tunes the retry path rather than gating the write. The lead-posted request became a v1 non-goal refused at post time, since one lead means no second approver. Both remaining open items are explicitly non-blocking.

**2026-07-21, decomposition pass.** Attempting the decomposition surfaced four product decisions the first draft had left unstated. Three are now decided: the note is visible to every viewer who can see the card and the composer says so before posting; a shift may have only one live request at a time; and a shift reassigned or removed in the roster expires its request with a stated reason rather than deleting it. The fourth, who approves a request the lead posted, was left open and has since been decided as a v1 non-goal.

**2026-07-20, first draft.** Decisions: the roster stays the source of truth rather than being replaced; approval is always required, with auto-approval as a permanent non-goal because the lead approving is the compliance control; eligibility drives the Claim button's presence rather than showing an error after the fact; expired requests stay on the board rather than disappearing. Provisional, default stated, confirmer Dana: notifications stay post-v1, on the assumption that the eligibility filter makes the board worth opening. Revisit if more than half of requests expire unclaimed.

---

## Appendix · Data contract

Proposed shapes, non-authoritative until reconciled. §0 owns both reconciliation items.

**`swap_request`**

| Field | Shape | Source of truth | Freshness |
| --- | --- | --- | --- |
| `id` | string | this system | n/a |
| `shift_id` | string | roster | read at post time, re-read at approval |
| `requester_id` | string | directory | read at post time |
| `note` | string, optional, 280 max | this system | n/a |
| `state` | one of the six in §5 | this system | live |
| `posted_at`, `approved_at`, `expired_at`, `withdrawn_at` | timestamp, nullable | this system | live |
| `expired_reason` | one of `claim_window_closed`, `approval_window_closed`, `shift_reassigned`, `shift_removed`. Null unless `state` is `expired` | this system | live |

**`claim`**

| Field | Shape | Source of truth | Freshness |
| --- | --- | --- | --- |
| `id`, `swap_request_id` | string | this system | n/a |
| `claimant_id` | string | directory | read at claim time |
| `claimed_at` | timestamp | this system | live |
| `eligibility_at_claim` | the five rule results | this system | recorded once, never recomputed |
| `declined_at`, `reason` | timestamp and string, nullable | this system | live |

**`shift`** (read from the roster, never written except the approval swap): `id`, `date`, `start`, `end`, `site`, `shift_type` (one of the three in §2), `assigned_staff_id`. Freshness: re-read at approval time, because the eligibility rule depends on it.

**`staff_member`** (read from the directory): `id`, `first_name`, `last_name`, `site_certifications` (list), `triage_trained` (boolean), `is_lead` (boolean). Freshness: read per session. §0 item 2 owns whether the certification fields are current.

**`roster_write`**: a single-cell update to the roster sheet, setting the shift row's `assigned_staff_id` to the claimant. Source of truth: the roster. Freshness: written once per approval, synchronously, and the response is checked before the state changes. §0 item 1 asks how often this rate-limits, which tunes the retry path in §16 rather than gating the write.

---

*Fixture for the product-spec plugin. Fictional product, no real clinic or staff.*
