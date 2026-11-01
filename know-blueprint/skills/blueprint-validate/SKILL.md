---
name: blueprint-validate
description: This skill should be used when a captured or designed Blueprint needs its stakeholder validation session run and recorded — the walkthrough with the person who owns the risk, going through the autonomy ratings one at a time and the exception paths (e.g. "validate this Blueprint", "sign off on the ratings", "review the automation calls", "I've got the process owner here", "re-validate after the change"), or when the user runs /know-blueprint:validate. Walks the ratings and exceptions with the risk owner, records which ratings moved and who moved them, and clears the automation gate only for what was actually reviewed.
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# blueprint-validate — Run the review the Blueprint is waiting on

A Blueprint out of the interview is an unvalidated draft. Its autonomy ratings came from one
operator's account of their own work, they are the most consequential and least verified thing in
the document, and `blueprint-capture` deliberately refuses to sign them off — it recommends a real
walkthrough with the person who owns the risk and notes in the status line that the walkthrough
has not happened.

This skill is that walkthrough. It exists because the gate was real and had no key: the only two
exits were never automating, or taking the recorded waiver.

**What you are not doing.** You are not reviewing the Blueprint yourself, and you are not standing
in for the person who owns the risk. You are running their session and writing down what they
decided. If nobody with that authority is in the room, this skill stops.

## Preflight

1. **Find the Blueprint.** Check `blueprints/` in the working directory, or `blueprints_dir` if
   the project's `CLAUDE.md` sets one. Several Blueprints → list them with their Status and Last
   validated lines and ask which. Exactly one → use it and say which.
2. **Read it end to end** before asking anything. You need every step, every rating and its
   justification, the exception paths, the open questions, and the change log.
3. **No Blueprint** → say so and offer `/know-blueprint:capture`. Do not validate a process from
   conversation; there is nothing to record against.
4. **Already validated, unchanged.** If Status says validated and the change log shows no
   revision since, say so with the date and who signed off, and ask whether this is a re-review
   (fine, record it as a new pass) or a mistake.
5. **Mode matters.** A **Design**-mode Blueprint can have its ratings validated, but its steps
   stay proposals until the process has actually run. Say this up front: this session can clear
   the rating gate, and it cannot turn a designed process into an observed one. Status keeps its
   "not yet run" half.

## Step 1: Establish who is in the room

Ask who is validating, and record the name and role as they give it.

**The operator cannot validate their own Blueprint.** If the person reviewing is the same person
who gave the capture interview, stop and say why: the ratings are their account of their own work,
and a second pass by the same person is a re-read, not a review. Offer the two honest options —
find the person who carries the consequence (the one who answers for the money, the compliance
exposure, the customer trust, or the safety call), or record this session as an operator re-read
that explicitly does not clear the automation gate.

**You cannot be the stakeholder either.** If asked to review as them, sign off on their behalf, or
mark it approved, decline and say why. Reading the document critically is something you can do and
it is not validation.

**One more, asked plainly:** does this person have the authority to move a rating? If the answer
is no or unclear, this is useful input gathering and it does not clear the gate. Say so now rather
than at the end.

## Step 2: Walk the autonomy ratings, one at a time

This is the core of the session and the reason it exists. Do not present the ratings as a list of
automation candidates to go build — that frames them as settled when they are the part most likely
to be wrong.

Order by consequence, not by step number:

1. Every **Automate**-rated step. These are the ones where nobody will be looking.
2. Every step where the capture recorded a **disagreement or an overruled default**, including any
   accessibility judgment the operator moved off Human.
3. Every **Monitor**-rated step — specifically, who actually watches, how, and how often.
4. The **Human**-rated steps, which the owner may well want to relax.

For each one, use AskUserQuestion with the rating, the justification the Blueprint carries, and the
one question that decides it: *if this step were done wrong with no review, what would happen?*
Options are "Rating holds" / "Move it" / "Needs someone else to answer". Take the reasoning
conversationally when they move one.

**Record the confirmations, not only the changes.** A rating the owner looked at and kept is
evidence. A rating nobody looked at is not, and at the end those two must not look the same.

**When the owner wants a checkpoint gone**, hold the same posture `blueprint-capture` holds: offer
the proportionate middle in the same turn — raise the threshold so it fires on fewer runs, sample a
share instead of reviewing every one, or let it proceed and audit after the fact. Name which you
would pick and why the residual risk is acceptable there. Monitor sits between Automate and Human
for exactly this. If they still want it gone, that is their call to make; record it with what the
rating would otherwise have been.

**Accessibility judgments get named out loud.** Where a step's output is a determination about
accessibility — whether an image is decorative, whether alt text conveys the right thing, whether
a reading order is correct, whether a control's name means anything to the person hearing it,
whether a criterion is met — say that the default is Human and why: locating a missing attribute is
mechanical, and deciding whether the thing it describes is *right* is a judgment about what a
person needs. The owner may move it. If they move it to Automate, record the move, who made it, the
date, and the rating it would otherwise have carried, in §14 where the Blueprint already asks for
exactly that. Never let that move happen silently, and never make it on your own initiative.

## Step 3: Pressure-test the exception paths

The weird cases, and whether the handling is right. For each exception path: has the owner seen
this happen, is the recorded handling what they would want, and is there a case the Blueprint does
not cover? New exceptions go in as steps with the same fields and ratings as any other, and they
are unvalidated until walked — so walk them in this session or list them as outstanding.

## Step 4: Resolve the open questions that gate automation

Pull §13's open questions and separate them: the ones that bear on an **Automate**-rated step, and
the rest. Work the first group with the owner — these are what stands between here and safe
automation. Answered items move into the step they belong to and get checked off with the date.
Anything they cannot answer keeps its owner and stays open; name it in the report.

Do not resolve a question by inference. An unanswered question is a better artifact than a
plausible answer, which is the rule the whole plugin runs on.

## Step 5: Write it down

Update the Blueprint in place:

- **Header.** `Status` and `Last validated`. Full pass, every rating reviewed: `Validated — <name>,
  <YYYY-MM-DD>`. Partial: `Partially validated — <n> of <m> ratings reviewed by <name>,
  <YYYY-MM-DD>; <list> outstanding`. Set `Next review` to a real date the owner agrees to.
- **The ratings themselves**, where they moved, each with its new justification and a note of what
  it was before.
- **§14 Automation notes.** Refresh the first candidates and the checkpoints that stay human, and
  fill the accessibility-judgments line with any move, who made it, and when.
- **A validation record** — §16 in the template. One row per rating reviewed: the step, the rating
  before, the rating after, and who decided. Plus the exception paths walked, the open questions
  closed, and, explicitly, what this session did not cover.
- **§15 Change log.** A row for the validation pass, and set `Re-validated?` on the revision rows
  this session covered.

**Never write a Status that claims more than the session delivered.** A partial pass that reads as
complete is worse than no pass, because the next person builds on it.

## Step 6: Report

Three short lines:

- **Stands:** what is validated, by whom, and dated — plus what is still outstanding, named.
- **The automation gate:** open or not, and if not, exactly what is in the way (ratings not
  reviewed, open questions on Automate-rated steps, or an unvalidated exception path). When it is
  open, say that the plan can now be drafted and offer it.
- **Fork:** only where one genuinely exists.

Interrupted part-way: whatever was written is already in the Blueprint and the Status line says
how far it got, so `/know-blueprint:validate` resumes from the first unreviewed rating.

## What this does not establish

**A validated Blueprint is a reviewed model of a process, not a safety certification.** It records
that a person with the authority to move these ratings looked at them on a date and said which
ones they would move. It says nothing about whether the process itself is any good, whether it is
being followed, or whether an automation built from it works.

**It is a claim by the person who signed it**, written down so it is attributable instead of
remembered. Nothing here verifies that they read as carefully as the record says.

**Validation ages.** A changed process is an unvalidated process again, which is why the change log
carries `Re-validated?` per revision. Re-running this skill after a revision scopes to what changed
plus anything downstream of it.

**And it is not an accessibility conformance evaluation.** Rating an accessibility judgment Human,
or moving it, is a decision about who does the work. It is not a determination that any artifact
the process produces conforms to anything — that involves assistive technology and a person, and
neither this skill nor any Blueprint substitutes for it.
