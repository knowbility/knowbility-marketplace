# Discovery sweep — recall cues and prioritization

Read-only doctrine the `blueprint-discover` skill loads at runtime. It holds the recall cues that
surface an operator's recurring work, and the three lenses that turn a raw list into a prioritized
starting portfolio. The skill points here; it never copies this content into the conversation.

## What discovery is for

The operator can't name a process they don't see as a process. Most recurring work lives below that
threshold — habitual, tacit, never written down. Discovery's whole job is to move the operator from
"nothing comes to mind" to "oh, right, that too." It is **recall, not classification**: a set of cues
that jog memory, not a form or a taxonomy to fill in.

The output is a **thin inventory of candidates**, not a set of mini-Blueprints. Discovery recognizes
that work happens; it does not yet understand how it happens. Understanding is capture's job.

## The recall cues

Work through these in small batches (two or three surfaces at a time, then stop and let the operator
answer). **Lead with artifacts and tool traces** — they are the least idealized. What someone
actually produced and touched last week is evidence; what they say they "do" is often the org-chart
story. Anchor every prompt in a **real recent window** (last week, the last month-end, the last time
something went wrong), the discovery analogue of capture's "walk me through the last real run."

- **Artifacts.** What reports, spreadsheets, decks, emails, approvals, reconciliations, or updates
  keep getting produced? Which ones did you produce in the last week or two?
- **Tool traces.** Looking at last week's calendar, sent messages, recurring tasks and reminders,
  and recently edited files — what work patterns show up? (This surfaces the work the operator has
  stopped noticing they do.)
- **Cadence.** What do you do every morning, every week, at month-end, each quarter, once a year?
- **Events.** What kicks off whenever a customer signs, an invoice lands, someone joins or leaves,
  something breaks, or a deadline approaches?
- **Handoffs.** What regularly arrives from someone else that you act on? What do you regularly pass
  onward?
- **Decisions.** What recurring situations make you compare, approve, prioritize, escalate, or grant
  an exception?
- **Monitoring.** What do you check repeatedly so that nothing goes wrong?
- **Recovery.** What recurring mistakes, missing inputs, late work, or weird cases do you end up
  cleaning up?
- **Invisible maintenance.** What do you update, reconcile, organize, renew, provision, archive, or
  keep current — the upkeep nobody assigns but everybody needs?
- **Dependence.** What stalls when you're out, because only you know how it works?

**Stop when nothing new surfaces.** Do not march through every surface for completeness. A sweep that
chases exhaustiveness becomes its own annoying recurring chore — exactly the thing this plugin exists
to relieve. Two or three quiet surfaces in a row means you're done. A thin inventory is a correct
inventory.

## The non-invention line (this is the whole discipline)

Discovery can *recognize* a candidate. It must never *manufacture its boundaries*.

If the operator says "I do something with the monthly numbers," the candidate is
**"Monthly numbers work — exact trigger, outcome, and steps not yet established."** It is **not**
"Monthly Financial Reporting & Variance Analysis." Naming it that way invents a scope, a deliverable,
and a discipline the operator never claimed — the same fabrication that would poison a Blueprint, one
layer earlier. Keep the operator's own words. Where the boundary is fuzzy, say it's fuzzy.

Corollaries:
- **Not every recurring task is a process.** Some are one-step habits. Mark them, don't inflate them.
- **Adjacent activities are not automatically one process.** Don't fuse "reconcile the invoices" and
  "chase late payers" into one candidate because they're both about invoices. If it's unclear whether
  it's one process or two, record it as unclear and mark the next move "split or combine — TBD."
- **Preserve uncertain candidates.** A vague mention you can't pin down stays in the inventory as
  vague, not dropped and not sharpened.

## No autonomy ratings at discovery (locked)

Discovery must **never** assign Automate / Monitor / Human ratings. Those ratings depend on steps,
evidence of success, exception paths, and failure impact — none of which exist yet. Rating a
candidate here would be exactly the "annoying, therefore safe to automate" fallacy the plugin is built
to prevent. Discovery may note **automation interest** or **capture priority**; it must never assert
**automation safety**. The autonomy call belongs to a capture, after the steps are on the table.

## Prioritization — three lenses, no magic score

Don't collapse the inventory into a single number. Rank it through three independent lenses, because
capture is valuable for more than automating chores:

- **Automation opportunity** — frequent, mechanical-looking, time-consuming work. The classic
  "give this to an agent" candidate.
- **Operational exposure** — high consequence when it's late or wrong, key-person dependence, poor
  recovery, unclear authority. Worth capturing for resilience and governance, not speed.
- **Knowledge-loss risk** — tacit work that would be hard for anyone else to reproduce. Worth
  capturing to preserve what's only in one person's head.

Note that a low-frequency, high-risk process can deserve capture before a high-frequency annoying one.
Hours consumed is one signal, not the ranking.

## The recommendation — a small first portfolio

End by recommending **three** starting points, not a ranked list of everything:

1. **One high-payoff automation candidate** (leans on Automation opportunity).
2. **One high-risk or key-person-dependent process** (leans on Operational exposure / Knowledge-loss).
3. **One frequent, easy-to-capture process** that gives an early win.

Give each a one-line reason tied to its lens. Then invite the operator to run a quick or deep capture
on whichever they pick — discovery hands the candidate to capture, it doesn't model it here.
