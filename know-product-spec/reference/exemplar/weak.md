# PRD: Shift swap board

> Fixture. Deliberately thin on behavior, data, and copy, to test that the grader detects absence and localizes it. Expected result: behavior 1, data 1, copy 1, stage **Case-clear**. The case, measurement, and scope are deliberately sound, so the stage is driven by the contract layer rather than by overall thinness. Case-clear rather than Drafted is what the rubric's gates produce for a document like this, and getting that right is part of what the fixture tests.

**Worked example:** none yet. Design is in progress.

**Scope:** the swap board, a new surface reachable from the staff home screen.

**Route:** `/swaps`, proposed.

**Owner:** product Dana Whitfield. Engineering TBD.

**Last updated:** 2026-07-20, first draft.

**Reads with:** the roster spreadsheet and the staff directory.

---

## The case

### The problem and the person

Dana is the front-desk lead at an urgent care clinic with two sites and fourteen front-desk staff. When someone needs a shift covered they post in the staff group text, someone replies to claim it, and Dana then checks the roster spreadsheet to confirm the claimant is free and certified for that site, approves in the thread, edits the spreadsheet, and updates the whiteboard by the break room.

It costs Dana about five hours a week, nearly all of it the checking and the editing. Twice last quarter a claim scrolled past unnoticed and a desk opened with nobody at it. Staff do not trust the whiteboard, so Dana fields confirmation texts on her days off.

### The outcome

Six months from now, nobody arrives to find an uncovered desk, and Dana is not the routing layer for swaps.

Observable: uncovered shifts discovered on the day, currently two per quarter, at zero. Dana's swap-handling time, currently about five hours a week, under one.

### The fit

This serves the clinic's staffing-reliability goal: a desk covered every open hour without paying agency rates for last-minute cover. The minimal increment is a board where requests are posted, claimed, and approved, with the eligibility check handled by the system rather than by Dana.

It is not a scheduling system. The roster spreadsheet stays the source of truth.

### The deal-breakers

- If staff must install an app, this fails. Half of them work from shared clinic tablets.
- If Dana still hand-edits the roster after approving, most of the saving evaporates.
- If approval routinely takes more than a working day, people go back to the group text.

---

## §0 · Engineering context (input required)

1. **Can the roster spreadsheet be written to programmatically?** Blocks the approve action. **Must not be assumed:** that a write path exists, or that a read path implies a write path.

---

## Part I · Product spec

### 1. Overview

A board listing shifts that need cover. Staff post requests, colleagues claim them, and the lead approves. The point is to take the eligibility checking off Dana's desk.

### 2. Variation model

Eligibility varies by shift type. Overnight shifts need extra training.

### 3. Intent

The lead approves and the system checks. Nobody is assigned a shift without claiming it. The roster stays the source of truth.

### 4. The experience

A staff member who needs cover posts their shift to the board. Colleagues who are able to take it can claim it. The lead reviews claims and approves them, and the roster is updated. If nobody claims a request in time it expires.

### 5. Lifecycle states and loops

Requests move through the following states: open, claimed, approved, declined, withdrawn, and expired. Requests start as open when posted and move to claimed when someone takes them. The lead's approval moves a request to approved. Requests that nobody claims expire.

### 6. Structure or model

A swap request references a shift and a requester. A claim references a request and a claimant. Shifts and staff come from the roster and the directory.

### 7. Mechanics

The system checks that the claimant is free during the shift and certified for the site. Overnight shifts also require triage training. The check runs when someone claims a request.

### 8. Inputs

The roster spreadsheet and the staff directory.

### 9. Variants with external parties

Does not apply. Agency staff are not in the directory.

### 10. Worked example

To be produced once the design is further along.

---

## Part II · Implementation contract

### 11. Prior art disposition

| Prior art | Disposition |
| --- | --- |
| Group text thread | Drop as the swap mechanism |
| Break-room whiteboard | Drop once the board is live |
| Roster spreadsheet | Keep as the source of truth |

### 12. V1 scope and non-goals

| Area | Status | Traces to |
| --- | --- | --- |
| Post a request | Ships | Outcome: swaps resolve without the lead |
| Claim a request, eligible staff only | Ships | Outcome: the eligibility check removes the lead's reconciliation |
| Approve or decline, with the roster write | Ships | Deal-breaker: approval must write back |
| Withdraw before approval | Ships | Outcome: fewer stale requests |
| Expiry | Ships | Outcome: no uncovered shift found on the day |
| Notifications | Post-v1 | v1 relies on staff opening the board |
| Partial-shift swaps | Post-v1 | v1 swaps a whole shift |
| Auto-assignment | Permanent non-goal | Nobody is volunteered |
| Replacing the roster | Permanent non-goal | Not what is failing |

### 13. State machine

Requests move between the states listed in §5 as staff and the lead act on them. The lead sees more options than other staff.

### 14. Reachability and access

The board is available to signed-in staff. Individual requests can be linked to. The approvals list is for the lead.

### 15. Actions (mutations)

Staff can post, claim, and withdraw requests. The lead can approve and decline. Approving updates the roster.

### 16. Empty, loading, error, and degradation

The board shows a message when there are no open requests. Errors are handled and the user is informed. If the roster is not available, claiming is unavailable.

### 17. Copy

Copy to be finalized with Dana before build.

### 18. Acceptance criteria

1. A staff member can post a request for one of their own shifts.
2. An eligible colleague can claim an open request.
3. An ineligible colleague cannot claim a request.
4. The lead can approve a claim, and the roster is updated.
5. The lead can decline a claim.
6. Requests nobody claims expire.
7. The board is accessible.

### 19. Measurement

| Question | Event |
| --- | --- |
| Are shifts going uncovered? | `swap_request_expired` |
| Is the lead still the routing layer? | `swap_approved`, with time from claim to approval |
| Do swaps resolve without the lead? | `swap_claimed`, with time from post to claim |

The outcome's two numbers derive from the first two events. Flagged for reconciliation with the tracking plan.

### 20. Infrastructure and security

New endpoints for the board and its actions. Reads from the roster and the directory. No patient data is involved.

### 21. Design references and open items

Reuses existing card and button patterns. The request card is new.

### 22. Resolutions log

**2026-07-20, first draft.** The roster stays the source of truth. Approval is always required.

---

## Appendix · Data contract

A swap request holds an id, the shift it refers to, the requester, an optional note, and its state. A claim holds an id, the request, the claimant, and a timestamp. Shifts and staff members come from the roster and the directory respectively. Exact field shapes to be settled during implementation.

---

*Fixture for the product-spec plugin. Fictional product, no real clinic or staff.*
