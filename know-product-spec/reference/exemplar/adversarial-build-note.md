# Ground truth for `adversarial.md`

The planted defects, recorded independently so a grading run can be checked against them.

**A grading run must not consult this file.** Its whole purpose is to exist outside the grader's view. Reading it during a run turns the test into a conversation.

---

## Three planted invented decisions

Each satisfies the two-implementer test: two reasonable implementers could choose differently, and a user or stakeholder could tell which one they got. All three are **blocking** under the rubric's severity classes: each guess ships as user-visible behavior (an end state, a visibility rule, a failure path), so none can be defaulted and noted. A run that tags any of them deferrable has misread the severity test.

### P-1 · What happens to a claimed request whose shift arrives without approval

**Where it hides:** §2's variation table gives a claim window per shift type and no approval window. §5's `expired` row triggers only on "claim window closes with the request still open". §13's transitions list `open` to `expired` and no path from `claimed` to `expired`.

So a request that is claimed and never approved has no defined end. Three defensible implementations: expire it and notify nobody, leave it `claimed` forever, or auto-approve at shift start because someone at least volunteered.

**Why it is invisible:** §2 says "Approval should happen promptly once a claim is in, so the shift is settled well before it starts." That sentence reads like a rule and specifies nothing. It is the tell.

**Should be owned by:** §2 (an approval window per shift type) and §5 (a `claimed` to `expired` trigger).

**Consequence if built wrong:** the highest-stakes case in the whole product. A shift that looks covered and is not is exactly the failure the case exists to eliminate.

### P-2 · Who can see the note on a request

**Where it hides:** §4 has Priya adding "a note explaining she has a family commitment". §5's `open` row renders "shift details and note". The appendix gives `note` a shape and a length limit.

Nothing says who the note is visible to. Three defensible implementations: everyone who can see the card, the lead only, or the lead and the eventual claimant.

**Why it is invisible:** the note appears in four places and each mention is consistent with the others. It looks specified because it is mentioned often.

**Should be owned by:** §13's visibility matrix, which covers actions per role and never mentions the note.

**Consequence if built wrong:** the worked example in §4 is a family commitment. Broadcasting a personal reason to fourteen colleagues by default is a privacy decision nobody made.

### P-3 · What happens to an open request when its shift changes in the roster

**Where it hides:** §7 says the eligibility rule re-runs at approval time "because the roster can change in between", which shows the author knew the roster is mutable. The appendix re-reads `shift_id` at approval for the same reason.

But nothing covers the request's own shift changing. If Dana edits the roster directly and reassigns or deletes Priya's Thursday shift, the open request now refers to a shift Priya no longer holds. Three defensible implementations: invalidate the request, leave it and fail at approval, or flag it on the board as stale.

**Why it is invisible:** the document demonstrably thought about roster mutation, which reads as coverage. It handled the claimant's side and never the requester's.

**Should be owned by:** §5 (a state or transition) and §16 (a degradation row).

**Consequence if built wrong:** someone claims and is approved for a shift that no longer exists, and the roster write either fails confusingly or succeeds and corrupts the roster.

---

## One planted untestable criterion

### P-4 · Criterion 6

> "**Given** a claim, **When** the lead reviews it, **Then** the eligibility information is clear and sufficient for a confident decision."

Unverifiable as written. "Clear" and "confident" have no bound and no state to key to, so the criterion can never fail. It sits among seventeen genuinely testable criteria, which is what makes it easy to skim past.

The testable version exists in the same document: criterion 6 of `perfect.md` requires that Approve, Decline, and the passing eligibility line are present in `state-claimed` viewed by the lead.

---

## What a passing grading run looks like

- All three invented decisions named, each tagged blocking, each with the section that should own it.
- Criterion 6 identified as untestable, by number.
- Dimensions 1, 2, 3 scoring well. The case, measurement, and scope are deliberately sound, so a run that fails the document overall on those has detected the wrong thing.
- Stage below Backlog-ready, because the cut finds blocking findings.

Findings beyond these four are not automatically wrong, but each should be assessed as a true or false positive. A grader that flags everything detects nothing.

---

*Ground truth for the product-spec plugin's `adversarial.md` fixture.*
