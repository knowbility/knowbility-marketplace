# Phase 5 — conformance reporting plugin: requirements brief

**Status: scoping. Nothing is being built.** This is the document to hand to a Knowbility auditor,
because the questions at the end are the ones that decide what gets built and none of them can be
answered from this repository.

Written 2026-10-30, after the six-plugin migration closed.

---

## What is settled

**Who it serves.** A Knowbility auditor who has done the testing, assembling an Accessibility
Conformance Report for a client. The output carries Knowbility's determination and a named
auditor. Kelsey confirmed this; the alternatives considered and rejected were a self-service tool
for clients filling out their own VPAT, and internal use on Knowbility's own properties.

**Consequence worth stating plainly: a wrong "Supports" is Knowbility's liability, not a client's.**
That single fact sets the plugin's posture everywhere below.

**Scope at first release.** The WCAG edition only. Revised Section 508, EU (EN 301 549), and
International are additive later — they reuse the same evidence against different criteria tables,
and EN 301 549 in particular adds substantial non-web criteria that deserve their own pass.

**The artifact.** VPAT® is the blank template published by ITI, currently **version 2.5Rev
(April 2025)**, in four editions. A VPAT completed for a specific product is an **ACR**. ITI
membership is not required to use the template. Each criterion takes one of four conformance
levels — Supports, Partially Supports, Does Not Support, Not Applicable — plus remarks.

**The input problem, already documented.** `know-qa-agent/reference/wcag-mapping.md` lists what a
conformance evaluation needs that automated passes cannot supply:

- assistive-technology testing with real screen readers
- keyboard-only traversal of every flow
- testing at magnification and with reduced motion
- cognitive-load review
- a declared page set and sampling rationale
- a stated baseline: WCAG version, conformance level, technologies relied upon
- a human accountable for the determination

**That list is Phase 5's input contract.** The plugin's job is to take evidence a person produced,
combine it with the automated evidence `know-qa-agent` already produces, and assemble a document —
not to generate determinations.

**Why it is a separate plugin and not Phase 4.** Phase 4 is criterion mapping and per-criterion
presentation *inside* `know-qa-agent`, annotating output that plugin already produces. A conformance
document must merge manual and assistive-technology evidence `know-qa-agent` cannot produce, and its
output is quasi-legal. Different inputs, different accountability, different blast radius.

---

## Constraints that are not open questions

These follow from the house rule in the root `AGENTS.md` — no plugin here may imply automated output
is a conformance evaluation. They are stated rather than asked because getting one of them wrong is
how this plugin would damage the organization it is for.

**1. Automated evidence can prove failure. It can never prove success.** This asymmetry is the
design's spine. A found contrast failure is a failure, and automated evidence alone is sufficient to
write **Does Not Support**. The reverse does not hold: no automated pass can establish **Supports**
on any criterion that is not fully machine-decidable, because a rule confirms an `alt` attribute
exists while a person decides whether the text is a useful equivalent. The plugin must enforce this
direction in code, not advise it in prose.

**2. "Not evaluated" is a value the plugin writes.** A criterion with no evidence is untested, which
is not the same as satisfied, and the tooling cannot tell those apart. The plugin must be able to
produce an incomplete ACR that says so, and it must never infer a level from the absence of a
finding. An ACR where every row is filled because the tool filled them is the failure mode to design
against.

**3. Every determination carries its evidence and its author.** Which test, by whom, on what date,
against what page set, with what AT. A determination with no traceable evidence is not promotable.

**4. The document is not final until a named human accepts it, row by row or in a reviewed pass.**
The plugin drafts. A person signs. The draft states its own status until they do — the same pattern
`know-blueprint` uses for its autonomy ratings.

**5. Scope is declared, never inferred.** A conformance claim is about a defined set of pages and
states. The plugin must require the page set and sampling rationale as input and reproduce them in
the output, because a run against one URL at one moment is not a claim about a product.

---

## What only an auditor can answer

Grouped by what each answer decides. These are deliberately about current practice, not about the
tool — the plugin has to fit how Knowbility already works, and guessing here is the specific
mistake that made Phase 4 wait for auditor input in the first place.

### A. The evidence that already exists

1. **When you audit something today, what do you produce?** A spreadsheet, a document, a tool's
   export, notes? If there is a template, a copy of it (with client details removed) is worth more
   than any description.
2. **Where does the automated portion come from today** — axe DevTools, WAVE, ARC, Lighthouse, a
   script, something else? This decides whether `know-qa-agent` output is even the right automated
   input or whether the plugin should ingest another tool's export.
3. **How is AT testing recorded?** Per criterion, per flow, per page, or as prose findings?

*Decides: the whole ingest surface. Get this wrong and the plugin is unusable regardless of how
good the output is.*

### B. The judgment calls

4. **How do you decide between "Partially Supports" and "Does Not Support"?** This varies by shop
   and it is the determination most likely to be challenged. Is there a rule, a convention, or is it
   per-auditor?
5. **What has to be in a remark?** Is there house language, a required structure, things you will
   not say?
6. **Do you state "technologies relied upon," and how specifically?**

*Decides: what the plugin may draft versus what it must leave blank for a person.*

### C. The testing matrix

7. **Which screen reader, browser, and OS combinations do you test?** Fixed house set, or negotiated
   per engagement?
8. **Is the page set chosen by you, given to you by the client, or negotiated?** How is the sampling
   rationale written up?

*Decides: whether the matrix is configuration or per-report input.*

### D. Review and accountability

9. **Who reviews an ACR before it reaches a client?** The auditor alone, a second auditor, someone
   senior?
10. **Whose name appears on it** — an individual, a role, or Knowbility as an organization?

*Decides: the sign-off model, and whether the plugin needs a two-person state at all.*

### E. The question that decides whether to build this

11. **What is painful about producing one of these today?** What takes longest, what gets redone,
    what mistakes does review usually catch?

*If the honest answer is "it is fine, it just takes a while," this may be a template and a checklist
rather than a plugin. That is a real possible outcome and a good one — it costs an afternoon instead
of a month. The questions above are worth answering either way, because they document a process
nobody has written down, which is itself the thing `know-blueprint` exists to do.*

---

## After the answers come back

Run `know-product-spec` on it — `/know-spec:discovery` first, which is built to establish whether a
thing is worth building before any spec exists and will say so when it is not, then
`/know-spec:interview` and `/know-spec:write`. Using this marketplace's own tooling on this
marketplace's next plugin is the right test of both.

One caution for whoever does that: the discovery skill's job is to find the minimal path, and it is
allowed to conclude that the minimal path is not software. Let it.
