---
name: know-qa:check
description: Verify that the current phase's deliverables actually work. Designed for integration with GSD phase completion - tests what was just built before moving on.
argument-hint: "--url <base-url> --phase <phase-number>"
---

# /know-qa:check

Quick verification that the current phase's work actually functions. This is a gate check, not a full QA pass.

## Purpose

When an orchestration system like GSD completes a phase, it knows the code was written - but not whether it works. This skill:

1. Understands what the phase was supposed to deliver
2. Runs targeted tests to verify those deliverables
3. Reports pass/fail with enough detail to act on
4. Blocks phase completion if issues are found

## Usage

```
/know-qa:check --url http://localhost:3000
/know-qa:check --url http://localhost:3000 --phase 3
```

If no `--phase` is specified, infer from current GSD context (active phase in ROADMAP.md or PLAN.md).

## Execution Flow

### 1. Gather Phase Context

Look for phase information in this order:

1. `.planning/phases/XX/PLAN.md` - What was the plan?
2. `.planning/phases/XX/GOAL.md` or phase goal in ROADMAP.md - What was the intended outcome?
3. Recent commits or changes - What was actually built?

Extract:
- **Phase goal**: What user-facing functionality should now exist?
- **Key deliverables**: What specific features/flows were implemented?
- **Acceptance criteria**: Any explicit criteria from the plan?

### 2. Determine What to Test

Based on phase context, identify testable outcomes:

| Phase Type | What to Verify |
|------------|----------------|
| New feature | Feature exists and basic flow works |
| Bug fix | The bug no longer reproduces |
| Refactor | Existing functionality still works |
| API work | Endpoints return expected responses |
| UI work | Components render and are interactive |

### 3. Run Verification

Spawn the `qa-tester` agent with a focused prompt:

```
## Phase Verification Check

**Phase**: {phase number and name}
**Goal**: {phase goal}
**Base URL**: {url}

## What This Phase Should Have Delivered
{extracted deliverables}

## Verification Task

This is a phase completion gate check. Your job is to verify that the functionality built in this phase actually works.

Focus on:
1. Does the core functionality exist and work?
2. Does it work for the happy path?
3. Are there any obvious errors (console, network)?

This is NOT a full QA pass. Don't exhaustively test edge cases unless something seems wrong. The goal is to catch "it doesn't work at all" before the project moves on.

If you find issues:
- Describe exactly what doesn't work
- Provide evidence (screenshots, console errors, network failures)
- Assess severity: Is this a blocker or a minor issue?

If everything works:
- Confirm the deliverables function as expected
- Note any concerns that should be tested more thoroughly later
```

### 4. Report Results

Report findings grouped by confidence level. All findings are shown — none filtered.

**If verification passes:**
```
✅ Phase {N} Verification: PASSED

Verified:
- {deliverable 1}: Works
- {deliverable 2}: Works

Confidence: High — all deliverables verified with evidence.

Notes:
- {any observations for later}

Ready to proceed to next phase.
```

**If verification fails:**
```
❌ Phase {N} Verification: FAILED

Definite Issues:
1. {Issue description}
   - Confidence: High — {rationale}
   - Evidence: {what was observed}
   - Severity: {Blocker / Major / Minor}

Likely Issues:
(if any)

Possible Issues:
(if any)

Recommendation: Address these issues before proceeding.
{If repeated failure: "This has failed verification multiple times. Consider whether the implementation approach needs reconsideration."}
```

**If partial pass:**
```
⚠️ Phase {N} Verification: PASSED WITH CONCERNS

Working:
- {deliverable 1}: Works
- {deliverable 2}: Works

Possible Issues:
- {issue that's not a blocker but should be noted}
  - Confidence: Low — {rationale}

Recommendation: Can proceed, but schedule follow-up for noted concerns.
```

## Integration with GSD

### In GSD Executor Instructions

Add to the executor's methodology:

> After completing phase implementation and before marking the phase complete:
> 1. Run `/know-qa:check --url {app-url}` to verify deliverables
> 2. If check fails, address issues before proceeding
> 3. If check fails repeatedly (3+ times), stop and escalate - the approach may need reconsideration
> 4. Only mark phase complete after verification passes

### In GSD Verifier

The existing `gsd-verifier` agent does goal-backward analysis. `/know-qa:check` complements this by adding *runtime verification* - not just "did we write the code" but "does the code work."

## Failure Escalation

Track verification attempts within a phase:

- **1st failure**: Report issues, expect fixes
- **2nd failure**: Report issues, note pattern
- **3rd failure**: Escalate with message:

  > "Phase {N} has failed verification three times. The repeated failures suggest the implementation approach may have a fundamental issue. Recommend pausing to review:
  > - Is the technical approach sound?
  > - Are there missing requirements or misunderstandings?
  > - Should this be broken into smaller phases?"

## What This Is NOT

- **Not a full QA pass**: Edge cases, performance, security are for `/know-qa:run` with proper specs
- **Not a replacement for tests**: Unit/integration tests catch different issues
- **Not blocking on minor issues**: Only blockers should prevent phase completion

This is a sanity check: "Does the thing we just built actually work at all?"

## Examples

**After completing a login feature phase:**
```
/know-qa:check --url http://localhost:3000

> Checking Phase 3: User Authentication
>
> Verifying: Login form exists and accepts credentials
> ✓ Login page loads at /login
> ✓ Form accepts email and password
> ✓ Submit with valid credentials redirects to dashboard
> ✓ No console errors
>
> ✅ Phase 3 Verification: PASSED
> Ready to proceed.
```

**After a phase that broke something:**
```
/know-qa:check --url http://localhost:3000

> Checking Phase 5: Shopping Cart
>
> Verifying: Add to cart functionality
> ✗ "Add to Cart" button exists but clicking does nothing
>   - Console shows: "TypeError: Cannot read property 'id' of undefined"
>   - Network shows: No request sent to /api/cart
>
> ❌ Phase 5 Verification: FAILED
>
> Issue: Add to cart click handler has a bug - product ID not being passed
> Severity: Blocker
>
> Address before proceeding.
```
