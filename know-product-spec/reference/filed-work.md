# Working on filed work

Everything in this plugin up to `file` produces a document. This file covers what happens after, when the work exists in a tracker and someone discovers the document was wrong about the world.

Two skills read it. **`groom` writes to the tracker; `ui-review` never does.** `groom` works a list of filed items with a human and records the outcome on each. `ui-review` decides whether a story and the surfaces it needs can go into implementation, and returns a report. Neither owns these rules. They are here because both need them and they must not drift apart.

Everything below about writing onto an item is `groom`'s alone. `ui-review` reads it for the boundary, the routing idea, and the two-batch collection of design consequences, and for nothing that mutates a tracker.

## The boundary

**The document freezes when it is decomposed and filed. Changes then go on the work items, never back into the document.**

`clarify` edits the document. `groom` edits filed work. Reaching for `clarify` because a filed item turned out to be wrong is motion in the wrong direction: it fixes the source of a ticket nobody will re-read, while the ticket a builder actually opens stays wrong.

The one exception is a broken premise. If what you discover contradicts the reason the work exists at all, that is not a grooming outcome. Say so plainly, stop, and route to `know-spec:discovery`. Never absorb a broken premise by editing items around it.

## The capture contract

An answer that lives only in a conversation is not an answer. Every outcome gets written onto the item it belongs to, as a dated append.

Three headings, and which one you use is the outcome:

- `## Resolution, YYYY-MM-DD` when the question is answered and the item can close.
- `## Grooming note, YYYY-MM-DD` when the item changed but stays open.
- `## Decision needed, YYYY-MM-DD` when the answer is not yours to give. See Routing below.

Inside, in this order:

1. **The decision in the first line, in bold, with who made it.** A reader scanning the item should not have to parse a paragraph to learn what was settled.
2. **The consequences, explicitly, including the ones that are "nothing changes."** An unstated non-consequence gets re-derived by the next person, which costs the same as the first derivation and produces less confidence.
3. **The reopen trigger, when one exists.** The condition under which this decision should be revisited. Most decisions have none; say nothing rather than inventing one.

**Append, never replace.** The item's original Question, what-must-not-be-assumed line, owner, and blocking references all stay exactly as they were, and the new section goes after them. A reader has to be able to see what was asked and what came back. An item whose question has been overwritten by its answer has lost the more useful half.

**A capture block is not a change log.** It carries the decision and its consequences. It does not narrate what the item used to say, when the correction happened, or which pass measured what. Keep it short enough that someone scanning the item reads it rather than skipping it.

## Correcting a contract: fix the text, do not narrate the fix

When grooming finds a section of a filed item that has gone stale, **rewrite that section so it states what is true now, and stop there.**

Do not leave the change described inside the body. No "corrected on <date>", no "this previously said X", no crossed-out items kept for the record, no explaining which run re-measured which number. The reader is someone deciding what to build, not an auditor of how the item got here, and every sentence about the item's own history is a sentence they read and discard. On a container that many work items inherit, that cost multiplies by the number of them.

Three places the history can go, in order of preference:

1. **Nowhere.** Most change-narration is not worth keeping. The text being correct is the whole point.
2. **A comment**, when it is genuinely narrative someone might want later. This is the one case where a comment is the right home rather than a fallback: narrative is not part of the contract a builder builds from, so it does not belong in the field that is.
3. **A short capture block**, for the decision and its consequences only.

**The distinction that matters:** current state is contract, and how it got there is not. "Zero of the sixteen controls are keyboard-reachable" is contract, because it describes what a builder is fixing. "Re-measured on the 1st and it still holds" is not. A forward-looking pointer is also contract, not history: naming which other item owns a gap prevents duplicate work and belongs in the body.

Note this narrows, and does not contradict, the rule below that a comment is never equivalent to an edit. That rule is about **contract changes**, which always go in the description. Narrative is the exception, and it is the only one.

## The provenance marker is never touched

The last line of every issue `file` created names its source: the document slug, the item's name slug, and the run date. Dedup keys on it, so a re-filing finds what already exists instead of creating a second copy. Do not remove it, do not edit it, and do not let an append land after it. It stays last.

## Read before you write, and verify the read

Editing a description usually means fetching the whole thing and writing the whole thing back. That is safe only while the fetch is complete.

**A truncated fetch followed by a full write silently destroys content.** The failure is quiet, it lands on the contract a builder was going to work from, and nothing in the tracker's response distinguishes it from a successful edit.

So, in order of preference:

1. **Prefer a patch-shaped edit** when the tracker offers one. Nothing to verify if you never hold the whole field.
2. **Otherwise verify the read before writing.** If the fetched description shows any sign of truncation, refuse to write and say so. A note in the wrong place is recoverable; a mangled contract is not.
3. **When a comment is the fallback, the comment says so in its own first line.** Something like "Fold into the contract when this item is next touched." The debt then lives on the item where the next person will see it, rather than in someone's memory. Do not pretend a comment is equivalent to an edit: a comment is not part of the item a builder builds from, and self-contained items are the whole point of how `file` writes them.

Treat a frozen contract as a higher bar than prose. After any rewrite containing a table or a code block, read the result back and confirm the structure survived. Escaping is where these break, not size.

**Read the rendered form, not the stored source.** The characters that break a description do it at render time, so a read-back of the source is correct in exactly the cases you are checking for. `tracker-syntax.md` carries which constructs survive, measured, and the three rules that follow from it.

## One write per target, with everything in view

Answers converge. Work a list of ten items and three of them will change the same downstream item.

**Queue downstream edits rather than applying them as you go. Group the queue by target item. Apply once per target, at the end of the run, with every change to that target in view.**

Two reasons, and the second is the one people miss:

- Parallel writes to one description are last-write-wins, and the losses are silent.
- An item collecting four separate answers deserves one rewrite that accounts for all four, not four sequential rewrites each of which re-reads and re-writes the whole field. Fewer risky writes, and a better result.

**Identifying which items an answer affects is not mechanical, and it does not delegate.** The correct downstream edit frequently is not the one the answer literally implies. An answer of "this capability is free and ungated" may require *splitting* a combined row so one part stops sitting under a paid column, which is an edit that needs the reasoning behind the answer rather than the answer itself. Working out the downstream set is also where you discover things: reading a neighbouring item's contract to find what needs updating is how you learn the item in front of you was redundant all along. Answer and sweep are not cleanly separable, so do the sweep where the reasoning is.

## Routing: when the answer is not the user's to give

A run that can only record answers will stall on the first item that needs somebody else. Most lists contain more of those than of straight answers.

**Routed is a real outcome, and it produces work rather than deferring it.** The item gets its scenario written on as a `## Decision needed` block naming the owner and the exact call, and it gets the routing label the profile names, so the set assembles by query.

The scenario is written whether or not it gets answered in this run. It costs the same either way, and an item carrying a written scenario is worth far more to the person who owns the decision than an item they have to read cold. That person will read it where they already work, which is the tracker, not a file in someone else's working directory.

Order the routed set by how many other items each decision moves. The downstream sweep already computed that number, and it is the sort key nobody working by hand can produce.

## Consequences for the worked example: collect, never trickle

Answers change surfaces. A decision about how saved items behave creates a card treatment that did not exist; a decision about who appears in a list makes three lines of existing copy wrong.

Doing each one as it appears produces a stream of one-line changes and interrupts the run. **Collect them, and hold them to the end.**

**Two batches, not one, because the work is not homogeneous:**

- **Mechanical copy changes.** Deletions, relabels, wording fixes. Reviewable in a minute.
- **Design work.** Anything needing a treatment designed or a behavior decided. This follows whatever exploration and review path the project already has for design.

Mixing them means the reviewer either rubber-stamps the design or nitpicks the copy. Keep them apart.

**Record what produced no change too.** An item that was checked and needed nothing is a result. Without it, the next person re-derives the same nothing.

## What these skills never do

- **Never edit the document.** That is `clarify`, and it is the wrong direction from here.
- **Never create a new item when an existing item owns the work.** New scope discovered during a run is added to the item that already covers that surface. Cutting a second item for it splits the contract across two places, and a builder will find only one.
- **Never treat a launch default as a scope reduction.** Deciding that most of a collection ships unrestricted does not shrink the work of building the restriction; the machinery is the same size regardless of how many objects are marked. Answers about defaults and answers about capability are different answers.
- **Never re-adjudicate something the team decided deliberately.** Check once to rule out an accident, then leave it alone. Asking someone to re-defend their own settled choice is how a run loses the room.
- **Never set priority, and never commit work to an iteration.** Same rule `file` keeps, and for the same reason: those are human decisions made after the work is read.
- **Never mark an item resolved from a tracker search alone.** A matching item is an input to a decision, not the decision.

---

*Authored for this plugin, from a live grooming run against a real backlog: a list of open questions worked one at a time, their answers written back, and the downstream set updated in the same pass. The outcome taxonomies in the two skills, the truncation guard, and the one-write-per-target rule are all findings from that run rather than anticipated design.*
