---
name: know-spec:groom
description: >-
  Work a list of filed items with a human, one at a time, leaving each one
  resolved, sharper, or routed to whoever owns the call. Researches the item and
  the system before asking anything, presents each open question as a concrete
  scenario rather than a question with options attached, writes the outcome onto
  the item, and sweeps the items downstream of every answer in the same pass.
  Handles defects as well as open questions, and the four defect outcomes it can
  settle by checking need no human at all. What it cannot answer it routes, with
  the scenario written on, which is how a run produces the agenda for the next
  team session instead of stalling. Use when filed work needs refining, when a
  ticket turns out to be wrong about the world, or to prepare a sprint or a
  roadmap for grooming.
---

# Groom: work the filed items

The document is frozen. These items are what the team builds from now, and this is the session that makes them true.

Your job for each item is to leave it in one of three states: resolved, sharper than you found it, or routed to the person who owns the call with everything they need to make it. Never leave it as it was.

**The most valuable thing you do here is not answering questions. It is sorting them by who owns them.** A list of open questions is not homogeneous. Some the user in front of you can settle in a sentence. Some are already settled by a rule nobody remembered. Some are defects that stopped reproducing three releases ago. And some genuinely need another person, which is a result, not a failure. Working out which is which is the whole value, and it is what turns a backlog into an agenda.

## Reference material

Read `${CLAUDE_PLUGIN_ROOT}/reference/filed-work.md`, `${CLAUDE_PLUGIN_ROOT}/reference/tracker-syntax.md`, and `${CLAUDE_PLUGIN_ROOT}/reference/legibility.md`.

**If `filed-work.md` cannot be read, stop.** Say which path failed and that you will not write onto filed work without the capture contract. The append headings, the read-verification rule that keeps a truncated fetch from destroying a contract, and the rule protecting the provenance marker all live there. Writing to a real tracker from a remembered summary of those rules would look identical to doing it correctly, right up until it destroyed something. Refusing is the honest outcome. If `tracker-syntax.md` or `legibility.md` fails, say so and keep going; the rules at the bottom of this file carry the part of each that cannot be lost.

## The project profile

Read `.know-product-spec/profile.md`. It is optional and every field has a default.

- **Missing:** use the defaults described in `reference/profile.md`, and mention once that a profile can be created. Never require one before doing useful work.
- **Present:** its values win over the defaults for destinations, output vocabulary, style rules, reviewer routing, standard sub-tasks, labels, and definition of done.
- **Present but unparseable:** name the file and the field you could not read, use defaults for the rest, and say which values you fell back on. Do not guess what a broken field meant.

Two keys carry this skill, both inside `tracker_connection`. **`project key`** scopes every search. **`routing label`** is the label applied to a routed item so the set assembles by query; it is its own key and is never inferred from the general `labels` vocabulary, because guessing which of a project's labels means "waiting on a person" is exactly the kind of invention this plugin refuses elsewhere.

**Without a `tracker_connection`, stop before touching anything**: say what the block needs and offer to add it with the user. With no `routing label`, propose one, get a clear yes, and say it is being added to the project's vocabulary. This skill is the exception to the profile being optional, for the same reason `file` is: guessing a destination for an external write is not a graceful default.

## Preflight

1. **Resolve the input into a list.** A sprint, a query, or a set of keys. **Never a single item**: the point is a working session, and a one-item run cannot do the sorting that makes this worth running. If the user names one item, say so and offer to widen the input.
2. **Scope every search to the profile's `project key` and nothing else.** A profile note naming another project is context for humans, never a search instruction.
3. **Confirm the tracker's tools are reachable** in this session. If they are not, stop and name the missing connection. Never describe an edit you did not make.
4. **Find the run, or start one.** See the ledger below. A matching run means this is a resume.
5. **Check the tickets themselves, not only the ledger.** Before working any item, look at the item for a dated capture block this skill would have written. **An item already carrying one for the same question is already worked**: report it and skip it, whatever the ledger says. The ledger can be lost, hand-edited, or belong to a run someone else started; the ticket is the durable record, exactly as the provenance marker is for `file`. Never append a second resolution to a question that already has one.
6. **Report the list before working it**: how many items, how many are open questions and how many are defects, how many were already worked, and where the ledger lives.

## The run ledger

Write to `.know-product-spec/groom/<run-id>/` in the working directory. **The run id is the date plus a short slug for the list**, so two lists groomed on the same day do not collide and a resume can tell them apart. Record the list's definition in `run.md` (the query or the keys, the project key, and when it started) and match on that when looking for an existing run, never on the date alone.

```
<run-id>/
├── run.md               the list's definition, the project key, and when it started
├── journal.md           append-only, one line per external write attempted and its outcome
├── list.md              the items, their type, and their outcome once worked
├── downstream.md        queued edits, grouped by target item, each pending or applied
├── routed.md            items routed, their owner, and the decision each one needs
└── worked-example.md    consequences for the design, in two batches, plus what needed nothing
```

**`journal.md` is append-only and written immediately, one line per external write, before and after.** Record what was attempted, against which item, and what came back. A run that dies between the tracker accepting a write and the ledger recording it is the failure this exists for: without the journal there is no way to tell a write that landed from one that did not, and the recovery guess is a duplicate resolution or a lost one. On resume, reconcile the journal against the tickets themselves before working anything new.

The ledger is what makes a run resumable. A list of twenty will not finish in one sitting, and a run that can route instead of forcing an answer stops cleanly at any item.

## Per item, in order

### 1. Research before asking

Read the item, every item it references, and **the actual system**: the worked example the profile's `worked_example` field names, the surrounding code where it is available, and any prior decision recorded on a neighbouring item.

This step is where the good outcomes come from. An open question that reads unanswerable from the document is very often already settled somewhere nobody looked. Take the time here; it costs less than a wrong answer and far less than a meeting.

**Reading a design tells you what it was built to do, never what it does.** When the answer turns on whether something actually renders, actually reaches a person, or actually looks right, reading the file cannot settle it and neither can you. Say so and route to `know-spec:ui-review`, which drives the rendered surface. Treating a read of the markup as an observation is the one research mistake here that produces a confident wrong answer rather than no answer.

### 2. Present the scenario

The output for each item is a scenario, not a question with options attached. In this order:

- A specific person doing a specific thing, at a specific moment.
- What they see under each candidate answer, concretely.
- **When a count or a threshold is at stake, work the numbers for each option** so the difference is visible rather than asserted.
- The rules that collide, named, with where each one is written.
- Then the question, narrow enough to answer in a sentence.

**If writing the scenario reveals that an existing decided rule already settles it, say that instead of asking.** That is a good outcome, not an edge case, and it is the second most common one after a straight answer.

### 3. Capture the outcome

Write it onto the item, following the capture contract in `filed-work.md`: the dated heading for the outcome, the decision in the first bold line with who made it, the consequences including the ones that are "nothing changes", and the reopen trigger where one exists. Append; never overwrite the question with its answer. Verify the read before any description write, and never let anything land after the provenance marker.

Every write here goes through the mutation contract below.

### 4. Sweep downstream

Every answer moves other items. Find them, and **queue the edits rather than applying them**. Group the queue by target item in `downstream.md`, each one marked pending. The reasoning behind this, and why identifying the downstream set stays here rather than being handed off, is in `filed-work.md`.

An answer that moves nothing gets recorded as moving nothing.

**Apply the queue before the session ends, never at the end of the list.** "End of run" means this sitting, not the completion of a list that may take a week. An upstream question closed on Monday whose downstream contracts stay stale until Friday is a ticket a builder can pick up and get wrong, and the resolution reads as settled while the work it governs disagrees with it. If the session is ending with items unworked, apply everything queued so far anyway, then stop. The batching rule exists to serialize writes per target, not to defer them past the point where somebody could act on the inconsistency.

## The mutation contract

This skill edits and closes work that already exists. `file` only creates, and its worst failure is a duplicate somebody deletes; the worst failure here is a destroyed contract or a wrongly closed ticket. So the protocol is at least as strict, not less.

**Before any external write, show the plan and wait for a clear yes.** Name what will change, on which items, and how: which items get a resolution and close, which get a note and stay open, which get routed and labelled, which downstream items get rewritten and what changes in each, and anything being closed as redundant or duplicate along with what survives it. State plainly which of these are reversible in the tracker and which are not.

**Confirm the first write of each kind before batching the rest.** The first resolution, the first close, the first routed item, the first downstream rewrite. Show what landed: the item, the text as written, and how it rendered. Formatting and escaping problems get found on one item, not discovered across twenty. After the yes for that kind, batch the rest of that kind.

**Journal every write immediately**, per the ledger above, before and after the attempt.

**Read back any rewrite containing a table or a code block** and confirm the structure survived, per `filed-work.md`. These break at the escaping level rather than at size, and they break at render time, so read the rendered form rather than the stored source.

**When something fails mid-batch**, stop at the failure. Say which items were written and which were not, leave the journal accurate, and let a human decide. Never transition or delete anything in the tracker to tidy up after a partial batch, and never retry a write whose outcome you could not determine: reconcile it against the ticket first.

**Closing is the one-way door.** A resolution can be appended to; a closed ticket that should not have closed costs somebody their work item. Treat every close as needing its own yes when it was not explicit in the plan.

## The outcomes

Open questions and defects fail differently, so they get different taxonomies. Classify each item before working it, and say which taxonomy you are using.

### Open questions

| Outcome | What you do |
| --- | --- |
| **Answered as asked** | Write the resolution, close the item |
| **Redundant** | Another item's contract already answers it. Close as redundant, and remove the now-circular reference from that other item |
| **Already determined** | A decided rule settles it. Write the rule and where it is written into the resolution, close, and record it as the grounds to refuse the same proposal later |
| **Premise wrong** | The question assumes something untrue, usually a capability that already shipped. Retire the what-must-not-be-assumed line explicitly, then answer the narrowed question that remains |
| **Question misframed** | The question cannot be answered as posed, often because it asks to enumerate a set that is empty by design. Reframe it, answer the real question, and note what the downstream criterion is actually keyed to |
| **New scope surfaced** | Working the item revealed work nobody had written down. **Add it to the existing item that owns that surface.** Do not cut a new one, and do not go back to the document |

Expect a straight answer to be the minority outcome. A run that can only record answers will mishandle most of its list.

### Defects

| Outcome | What settles it |
| --- | --- |
| **Still reproduces, contract clear** | Confirm against the system, record that you did, leave it in the backlog |
| **Already fixed** | Close, naming the change that fixed it |
| **Working as designed** | Close, citing the rule, and record it as the grounds to refuse a re-file |
| **A decision in disguise** | The fix cannot proceed until somebody decides something. Convert it: it is an open question, and it goes through that taxonomy |
| **Duplicate** | Close, after merging any detail the surviving item lacks |
| **Real, and not being fixed now** | Needs a human, and it is a priority call. **Route it. Never make it here** |

The first four settle by checking rather than by asking, because reproduction is verifiable. Do that checking before presenting anything: a defect you can close by reading the system should never reach a scenario.

## Routed: when it is not the user's call

Anything the user in front of you cannot settle alone. Another owner, a cross-team constraint, or a genuine group tradeoff.

Write the scenario onto the item as a `## Decision needed` block naming the owner and the exact call, apply the profile's routing label, and record it in `routed.md` with the owner and the count of items the decision moves.

**Routing is not deferral.** The item leaves the run better than it arrived: the person who owns the call gets a written scenario in the place they already work, instead of a ticket to read cold. That is the difference between a session that hands over an agenda and one that hands over a backlog.

Order the routed set by blast radius, the number of other items each decision moves. You have that number from the sweep, and nobody working by hand does.

## Consequences for the worked example

Collect them; never trickle them out as they appear. Two batches in `worked-example.md`, mechanical copy changes in one and design work in the other, plus what was checked and needed nothing. The reasoning is in `filed-work.md`.

Say at the end of the run how large each batch is. Do not start on either one inside the run.

## Ending

Close every run, normal or not, with three short lines:

- **Stands:** the list, how many items were worked, and the outcome counts by class, including how many routed and to whom.
- **Next:** the one next step, with the exact invocation to run.
- **Fork:** only when one genuinely exists, the two options and what decides between them.

Items remaining in the list means Next is `know-spec:groom` again, resuming from the ledger. A finished list with a routed set means Next is the session with those owners, and the routed query is the agenda. A finished list with nothing routed means Next is the worked-example batches. If the run surfaced that a document's premise no longer holds, Next is `know-spec:discovery`, carrying what broke. An abnormal exit still ends with this block, plus one line naming what survived in the ledger and that the Next invocation resumes from it.

## Rules you keep even if the reference files do not load

- Never edit the source document. Filed work changes on the items.
- Never work a single item. The input is a list.
- Never write to the tracker before the plan is confirmed, and never batch a kind of write before the first one of that kind is confirmed.
- Journal every external write immediately, before and after. A write whose outcome you could not determine is reconciled against the ticket, never retried blind.
- An item already carrying this skill's capture block for the same question is already worked. Skip it and say so, whatever the ledger says.
- Apply the downstream queue before the session ends, never at the end of a list that spans sessions.
- Never transition or delete anything to tidy up after a partial batch.
- Every tracker search is scoped to the profile's `project key` and nothing else. A profile note naming another project is never a search instruction.
- Research the system before presenting a question. An answer already written somewhere is the cheapest outcome available and the easiest to miss.
- Verify the read before any description write, and refuse to write on a truncated fetch. Never let an append land after the provenance marker.
- Never put a literal `{` or `[` into a description outside a fenced code block: several trackers read them as macro and link syntax even inside an inline code span. Never put an alternation inside a table cell. Verify against the rendered form, never the echo and never the stored source, both of which are correct in exactly these failures.
- Queue downstream edits, group them by target item, and apply once per target. Never apply the same target twice in a run.
- New scope goes onto the item that already owns the surface. Never create a second item for the same contract.
- Never set priority and never commit work to an iteration. Both are human decisions made after the work is read.
- When you ask the user something, the ask is the first sentence and it carries one decision. When you report, the verdict is the first line.
- Never claim an edit landed without having seen it land.
- Before writing anything, check the destination: it must be a relative path that resolves inside the working directory. Refuse an absolute path, a path that escapes upward, a symlink that resolves outside, and any URL. Say which rule refused it and do not fall back to a default location. Never write to the plugin directory.
- Apply the profile's style rules. With no profile, impose none of your own.
