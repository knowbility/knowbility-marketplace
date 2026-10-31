# Value review brief — where is the next real improvement?

This is the task brief for an advisory CLI team run in planning mode. It is written for reviewers
who do not have the checkout, and it carries the facts needed to judge a proposal.

A separate adversarial review of this repository ran on 2026-10-31 and found defects in the
documentation and in one install-UI description. Those are fixed. **This is a different question:
not "what is wrong" but "what would make one of these tools materially more valuable to the people
who will actually use it."**

---

## The organization

**Knowbility is a nonprofit whose work is digital accessibility.** It audits and tests websites and
applications against accessibility standards, trains other organizations to do the same, and runs
programs in that field. Its people are, roughly: accessibility auditors and testers who do client
evaluations, trainers and program staff, communications and fundraising staff, and a small number
of technical staff. Most of them are not software engineers. Few of them work in a terminal.

**That matters because all six plugins in this marketplace were built somewhere else.** They were
written for general software and business work, then ported here and de-branded so Knowbility owns
and configures them. Not one of them was designed for an accessibility organization. Five of the
six have no accessibility-specific capability at all. The sixth has some, deliberately bounded.

So the honest description of the current state is: **six competent general-purpose tools, sitting
in an organization whose work is specific.** The question this review exists to answer is where
that distance is worth closing, and how.

---

## What the six plugins are

Each is independent. None requires another. Versions are current as of this brief.

### `know-qa-agent` (0.1.1) — 10 skills, 1 agent, ~11,900 lines

Drives a real browser against a web application and tests it, correlating what is on screen with
the console, network, and DOM underneath. A deterministic Node engine tracks the test matrix so
requested coverage cannot silently disappear. Skills: `start` (plain-English front door), `init`,
`gen` (write a spec from a description or by exploring the app), `run`, `check` (verify a phase's
deliverables), `pair` (human watches and directs a visible browser while the agent captures
evidence), `monitor` (recurring smoke tests via a scheduling feature), `report` (cross-session
trend and theme synthesis, files findings into a tracker), `guide`, `help`.

Accessibility is in two tiers. Baseline checks ride along in every test: keyboard reachability,
visible focus, alt text presence, form labels, obvious contrast problems. A deeper tier, **opt-in
per test**, adds the full bundled axe-core ruleset and WCAG AA contrast ratios computed from
resolved colors. `reference/wcag-mapping.md` (in this packet) states exactly what that output is
and is not.

### `know-researcher` (1.18.1) — 12 skills, 2 agents, 3 hooks, ~15,400 lines

The largest and most mature. Phased research where every claim is audited back to a source note and
every note to a declared source. Skills: `init`, `start-phase`, `discover` (type-aware source
discovery across a 3-tier search stack), `process-source`, `cross-ref`, `check-gaps`,
`phase-insight`, `summarize-section` (drafts from evidence into `drafts/`), `audit-claims` (the
gate: verifies every claim against its cited note, then promotes the draft to `outputs/`),
`graph-analysis` (which claims are load-bearing, where evidence is weakest), `review-corpus` (an
independent adversarial review of a finished corpus), `progress`. Numbers are registered once in a
canonical figures file so they cannot drift between a note and a summary. A hook blocks any write
to `outputs/` without a passing audit row.

### `know-product-spec` (0.1.0) — 10 skills, ~4,000 lines

Interviews a person and writes a product spec an engineer can build from. `discovery` (in this
packet) tests whether the thing is worth building at all and can conclude it should not be, or that
the answer is not software. Then `interview` (how it behaves, every state and failure), `write`
(assemble the document), `decompose` (test the spec by converting it to workstreams and tasks in
trace mode — every task must cite the spec section it came from, and anything uncitable is recorded
as a product decision the document failed to make), `clarify`, `file` (into a tracker), `groom`,
`ui-review`, `start`, `help`.

### `know-security` (0.1.0) — 4 skills, 1 agent, ~4,400 lines

An adversarial security and privacy reviewer that reads code the way someone trying to reach the
data would. `security-review` (in this packet) for recently-changed code, `security-sweep` for a
whole codebase, `security-audit` for the state of open findings, `security-init`. It never probes a
running system, holds no credentials, and runs no exploit. It does contact the package registry for
dependency checks.

### `know-blueprint` (0.1.0) — 4 skills, ~1,800 lines

Needs nothing installed; reads and writes Markdown only, so it is the one any staff member can use
immediately. A guided interview turns how someone actually works into a process model — triggers,
data movement, decision criteria, exceptions, approval authority — and rates every step **Automate,
Monitor, or Human**. Four jobs: `discover` (surface candidate processes when you cannot yet name
them), `design` (model a process handed to you that nobody runs yet), and `capture` in quick
(~15 min) or deep (~45-60 min) mode for a process you already run. `blueprint-capture/SKILL.md` is
in this packet.

### `know-photo-generator` (0.1.0) — 2 skills, ~2,500 lines

Turns a plain-language scene description into a physics-aware image-generation prompt — camera
body, lens, lighting setup, color grade chosen from a curated reference library — and optionally
renders it through the Gemini API. Needs Python 3 and a Gemini key; rendering is billed per image.
It ships a house-style section that is currently an **unfilled template**: Knowbility has not yet
written its photographic style, including any guidance on representation of disability.

---

## The house rule, because it bounds every proposal

**No plugin here may imply that automated accessibility output is a conformance evaluation, a VPAT,
or an accessibility statement, or that automated passes substitute for assistive-technology or
keyboard-only testing by a person.** This is the rule the organization's own credibility depends
on, and it has been found to bite in three different directions:

1. **Describing an artifact** (`know-qa-agent`): saying output means more than it does.
2. **Declaring nobody needs to look** (`know-blueprint`): an "Automate" rating on a step whose
   output is an accessibility judgment. So a step whose output is an accessibility judgment is
   rated **Human by default**, and a departure from that default is recorded.
3. **Sounding authoritative about a requirement in a way that reads as a verdict on a product**
   (`know-researcher`): a confidence tier rates the sourcing of a claim, never the state of a thing
   in the world. "WCAG 2.2 requires X" and "this product satisfies X" are different claims resting
   on different evidence.

The pattern: the rule is violated whenever a plugin's output could be **mistaken for a person
having exercised the thing**. Ask of any proposal: what could a reader conclude about an
accessibility outcome from this output that no person actually checked?

A corollary that is settled and not open for debate: **automated evidence can prove failure and can
never prove success.** A found contrast failure is a failure. No automated pass can establish that
a criterion is met, where that criterion is not fully machine-decidable. A rule confirms an `alt`
attribute exists; a person decides whether the text is a useful equivalent.

---

## Already scoped — do not propose these

Two improvements are already designed or in requirements. A proposal that rediscovers either is of
no use.

- **Phase 4: per-criterion presentation inside `know-qa-agent`.** Annotating the output that plugin
  already produces with the success criteria each finding maps to, and presenting results
  criterion-by-criterion rather than rule-by-rule. Scoped, waiting on an auditor conversation.
- **Phase 5: a separate conformance reporting plugin.** Takes evidence a person produced
  (assistive-technology testing, keyboard-only traversal, magnification, cognitive-load review, a
  declared page set and sampling rationale, a stated baseline, a named accountable human), combines
  it with `know-qa-agent`'s automated evidence, and assembles an Accessibility Conformance Report
  against the VPAT 2.5Rev template, WCAG edition first. Its job is to assemble a document, never to
  generate determinations; "Not evaluated" is a value it writes. In requirements, nothing built.

**Also out of scope:** proposing a seventh plugin of any kind; documentation defects (reviewed
separately and fixed); CI or release infrastructure; anything requiring a service the organization
would have to buy, run, or keep credentials for.

---

## What constrains feasibility

- **There is no dedicated maintainer.** One person built all of this. Staff who use it are mostly
  not engineers. A proposal whose value depends on ongoing engineering attention will decay.
- **A standards-tracking burden is a real cost.** Anything that hardcodes a criteria table, a rule
  mapping, or a technique list acquires a maintenance obligation when the standard revises. Where
  the current tooling can read metadata from a pinned dependency instead, it does, and that is
  deliberate.
- **Both hosts must work.** Claude Desktop (click-through) and Claude Code (terminal). One feature
  already needs Claude Code only, and that is documented as an exception, not a pattern to copy.
- **Plugins are instructions plus small scripts**, loaded as skills and commands. They can ship
  reference files, hooks, and Node or Python tooling. They cannot ship a server.

---

## The bar for a proposal

Propose few things, well. A proposal is worth something only if it carries all of:

1. **Who.** Which person at this organization, doing which specific task.
2. **What they do today instead**, and why that is worse. A feature nobody is currently working
   around is a guess.
3. **Which plugin changes, and where** — skill, reference file, engine, or hook.
4. **How anyone would know it worked.** Not "users would like it": what observable thing would be
   different.
5. **What it costs**, including the maintenance obligation it creates.
6. **Why it does not break the house rule**, where it touches accessibility output at all.

State plainly if your honest answer is that a plugin is already at the right scope and the valuable
move is to leave it alone. "No change worth making here" is a real finding and more useful than a
plausible feature.

Rank what you propose. If you can only defend one, say which one and say that.

---

## What is in this packet, and what is not

**Included:** this brief; the root `README.md` (what each tool promises, and to whom — included as
a statement of intent, not as an artifact to audit); `know-qa-agent/README.md`;
`know-qa-agent/reference/wcag-mapping.md`; `know-blueprint/skills/blueprint-capture/SKILL.md`;
`know-security/skills/security-review/SKILL.md`; `know-product-spec/skills/discovery/SKILL.md`.

**Not included:** `know-researcher`'s internals (12 skills, largest and most mature);
`know-qa-agent`'s agent definition and its Node engine and browser harness; `know-photo-generator`
entirely; the remaining skills of every plugin. The inventory above is the summary of those.

If a proposal needs something not in the packet, say what you would need to see and what you would
expect to find there. Do not assume the unreviewed parts are missing a capability — assume instead
that you have not seen them, and say so.
