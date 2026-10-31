# Value review — where the next improvement is, and why

A CLI team run in planning mode, 2026-10-31, asking a different question from the readiness and
adversarial reviews: not "what is wrong" but "what would make one of these tools materially more
valuable to the people who will actually use it."

Run: `.team-runs/20261031T061347Z-834b50fd` (gitignored). Codex and Gemini, lead-excluded, on a
108 KB packet: a written brief (`dev/review/inputs/value-brief.md`), the root README, the
`know-qa-agent` README and its `reference/wcag-mapping.md`, and one deep skill each from
`know-blueprint`, `know-security`, and `know-product-spec`. Packet scrubbed for source-org
identifiers, local paths, and secret-shaped strings before dispatch.

---

## The recommendation

**Teach `know-qa-agent` to report what it did not test.**

It already reports the success criteria it found problems against — `harness/tools/axe.mjs:85-101`
parses them out of axe-core's own rule tags. What it cannot currently say is which criteria it
never looked at, and that is the number an accessibility auditor needs most.

### The measurement

axe-core 4.12.1 — the version pinned in `know-qa-agent/harness/tools/package.json` — ships 105
rules, but **9 are disabled by default** and `axe.mjs:62` runs `axe.run(document, { resultTypes: … })`
with no `rules` or `runOnly` option, so those 9 stay off. **96 rules actually run.**

Those 96 carry tags for 22 distinct success criteria, of which **21 are at level A or AA** in
WCAG 2.2.

WCAG 2.2 lists 87 success criteria. 86 are live and carry a conformance level — **31 at A, 24 at AA,
31 at AAA** — and the 87th, 4.1.1 Parsing, is marked obsolete and removed. So A and AA together are
**55** criteria.

> **The deep tier's axe pass has at least one rule for 21 of the 55 live A/AA success criteria in
> WCAG 2.2. Thirty-four have none** — and "has a rule" is not "fully tests," since several of the
> 21 are only partly machine-decidable.

The 34 with no enabled rule: 1.2.1, 1.2.3, 1.2.4, 1.2.5, 1.3.2, 1.3.3, 1.4.5, 1.4.10, 1.4.11,
1.4.13, 2.1.2, 2.1.4, 2.3.1, 2.4.3, 2.4.5, 2.4.6, 2.4.7, 2.4.11, 2.5.1, 2.5.2, 2.5.4, 2.5.7, 2.5.8,
3.2.1, 3.2.2, 3.2.3, 3.2.4, 3.2.6, 3.3.1, 3.3.3, 3.3.4, 3.3.7, 3.3.8, 4.1.3. That list includes
1.4.11 Non-text Contrast, 2.4.3 Focus Order, 2.4.7 Focus Visible, 2.1.2 No Keyboard Trap, and
3.3.1 Error Identification — core auditor concerns, every one.

**One scope limit that must travel with this number: 21 of 55 is axe's coverage, not the plugin's.**
The baseline tier has the agent check keyboard reachability, visible focus, alt text, and form
labels heuristically; `contrast.mjs` decides 1.4.3 deterministically; and the `aria-widgets` focus
area adds keyboard-conformance checks of composite widgets against the ARIA Authoring Practices.
So a criterion on the list of 34 may still have been looked at — just not by a deterministic rule.
**That distinction is the feature, not a caveat to it:** the useful report separates "a rule failed,"
"a rule passed," "an agent looked heuristically," and "nothing touched this," because those are four
different grades of evidence and today they arrive looking alike.

### A one-line win found while measuring

Of the 9 rules axe ships disabled, five are deprecated and three are AAA. **The ninth is
`target-size` — WCAG 2.2 AA, criterion 2.5.8 Target Size (Minimum) — and it is not deprecated.**
Enabling it is one rule id in the run options and takes A/AA coverage from 21 to 22. Worth doing
with the caveat stated: axe ships it off, so it should be enabled deliberately and its results read
knowing the vendor holds it back.

**How both figures were obtained.** The axe side by calling `axe.getRules()` against a clean
install of the pinned version — no browser, no page, no network. The WCAG side by counting the
conformance-level markers in the W3C Recommendation at `https://www.w3.org/TR/WCAG22/` directly:
86 markers, tallied by level, each paired to the preceding `Success Criterion N.N.N` heading.

**One method note that is itself an argument for the proposal.** axe's per-rule conformance tags
(`wcag2a`, `wcag22aa`) cannot assign a level to an individual *criterion*, because a single rule can
carry several criteria at different levels under one lowest-level tag. Every figure above that is
per-level came from the WCAG document, not from axe. That is precisely why the third tier needs the
criteria table and the first two do not.

### Why this is the right change

**It is the house rule rendered as a feature instead of a disclaimer.**
`reference/wcag-mapping.md` already says the output is "coverage, not conformance" and that "a
criterion absent from the output is **untested**, which is not the same as satisfied." The code says
it too, in a comment at `harness/tools/axe.mjs:82-84`. Both are prose next to a result that still
reads like a clean bill of health. Printing the untested set turns the caveat into the output.

**It is the missing upstream of work already scoped.** Phase 4 annotates findings with the criteria
they map to. Phase 5 consumes human evidence per criterion to assemble a conformance report.
Neither produces the list of criteria a person still has to go test — which is Phase 5's input
contract, and no plugin here advertises producing it.

**Three of its four grades need no maintained table at all:**

| Grade | What it says | Where the data comes from |
|---|---|---|
| A rule failed | "Automation found a problem here." | Already computed today |
| A rule ran and passed | "Necessary, not sufficient — a person still decides." | Derivable now from axe metadata — **no table** |
| An agent looked heuristically | "Someone's judgment, not a deterministic result." | The baseline tier and the `aria-widgets` checks already run; they are just not attributed per criterion |
| Nothing touched it | "No evidence of any kind. Go test this." | The complement against a WCAG criteria list — **the only table** |

That last table is the whole maintenance obligation: criterion number, title, and level — 55 rows
for A/AA, 86 if AAA is included. It carries no mapping logic, only the criteria list itself, and
WCAG revised in 2008, 2018, and 2023.

### What it would cost, honestly

A script reading `axe.getRules()`, one static criteria table, and a section in the report. The
maintenance obligation above. It touches no new service, needs no credentials, and works on both
hosts. The risk worth naming: the untested list is long and reads as discouraging, which is exactly
what makes it accurate — and the wording has to make "untested" sound like work remaining rather
than a defect found.

---

## What the reviewers actually said, and where they were wrong

**Both picked the `know-photo-generator` house style. Treat that as anchoring, not convergence.**
The brief named that gap explicitly and concretely — the one unambiguous hole in the packet — and
both reviewers returned it. Both also described it as a content change rather than a plugin change
(Gemini: "a content/configuration change, not a change to the plugin's engine or skills"). It was
already an open item for Knowbility to decide, so the run added little beyond confirming it is the
most visible gap. It remains worth doing; it is not a plugin improvement.

**Gemini's second-ranked alternative is the finding, and its own stated reason for ranking it
second does not hold.** It proposed that the `report` skill identify uncovered criteria and
generate a manual-test checklist, then ranked it below the photo work because of "a significant
maintenance burden… updated whenever the standard is revised." Its own uncertainties section
guessed the way out: "If one could be consumed from a dependency (like axe-core's own rule
metadata), the maintenance cost would be significantly reduced." That is what the code already
does, and the measurement above closes the question. Its objection costs the proposal one static
table, not a standards-tracking programme.

**Codex declined to propose anything here.** It held that QA's "pairing, evidence capture,
deduplication, and reporting already exist" and that criterion presentation is already scoped — a
reasonable reading of the brief, but Phase 4 presents what was found and Phase 5 consumes human
evidence; neither names what was never tested.

Its second reason, quoted exactly, was: *"Its documented unverified cold-install journey deserves
validation before another capability is added (`know-qa-agent/README.md:299–303`)."* That is a
careful statement about what the document says about itself, and it is accurate.

**An earlier draft of this review turned that into "`know-qa-agent` has never been driven against a
live site from a cold install," and that claim is not supportable by anyone — Codex, this review, or
the repository.** What the repository records is narrower and carries a qualifier that got dropped:
`know-qa-agent/README.md` says "it has not yet been driven against a live site from a cold install
**here**," and `AGENTS.md:29` says "Not yet driven against a live site from a cold install **here**."
Both are claims about this port and this repository's verification log. Neither is a claim about
whether the software works, and **`know-qa-agent` is a port of a plugin that was already in regular
use before the migration** — the port changed the namespace and the branding, not how it runs. The
record being empty here is not evidence of anything about the tool.

**Consequence: this weakens the sequencing argument rather than strengthening it.** What is
genuinely unverified is the *packaging* of the port — that `/know-qa:init` installs the harness and
a run completes under the new namespace from a clean install. The port was already checked by
manifest validation, module resolution across every harness tool, an engine spec compile, and a
dynamic-reference sweep. So a live-site run is a cheap sanity check worth doing, not a precondition
that gates the recommendation.

Codex also kept proposal discipline tightly: it refused to assert a value case without a named
operator, a frequency, and a measured cost, and said so rather than filling the gap with a
plausible feature. That restraint is correct and the recommendation above inherits the same debt —
no Knowbility auditor has been asked whether the untested list is what they want.

---

## Two things found in the code during this review

Neither reviewer could see these; the relevant internals were not in the packet.

**1. `axe.mjs` already names the gap in a comment** (`harness/tools/axe.mjs:82-84`): "axe implements
rules for only a subset of the success criteria, so a criterion with no failing rule here is
UNTESTED, which is not the same as satisfied." The honest boundary is understood at the point of
production. It just is not printed.

**2. `pair/SKILL.md:97` points an auditor at two chat-app-specific tools as if they were general.**
It lists `inspect-chat.mjs` and `inspect-labels.mjs` alongside `audit.mjs` and `fingerprint.mjs` as
tools that "help" dig for a corroborating fact. Both are leftovers from one worked example in the
source product: `inspect-labels.mjs` detects avatar initials and tinted message bubbles with
hardcoded colour defaults, and `inspect-chat.mjs` compares live chat message styling against a
mockup. `docs/HARNESS-GUIDE.md:143-144` describes both accurately; the skill does not. An auditor
in a paired accessibility session would reasonably reach for something named "inspect-labels"
expecting accessible names and get chat-avatar detection.

`audit.mjs`, by contrast, is genuinely accessibility-relevant and general: form-field labelling,
images missing alt, icon buttons with no accessible name, duplicate IDs, heading outline.

---

## The proposals, ranked

### 1. `know-qa-agent`: report the coverage, not just the findings

As above. Four grades of evidence named separately — rule failed, rule passed, agent looked
heuristically, nothing touched it — and the list of 34 A/AA criteria no enabled rule reaches.
Enable `target-size` in the same change. Pair it with a live-site run under the new namespace to
confirm the port's packaging, alongside rather than in front.

**Cost:** a script reading `axe.getRules()`, one 55-row criteria table, a report section, one rule
id in the run options. **Known by:** an auditor can say what they still have to go test without
reading the axe docs.

### 2. `know-product-spec`: the interview never asks an accessibility question

**This is the finding I would not have had if I had trusted the advisory report.** It said the
plugin was "purposeful and bounded as supplied." Reading it shows a structural asymmetry:

| | Security | Accessibility |
|---|---|---|
| Elicited by `interview`? | Yes — "what this changes about the runtime surface" | **No question at all** |
| Section in the PRD skeleton? | §20, dedicated | None |
| Mandatory explicit "no change"? | Yes — "so review never has to infer it" | No |
| Scored by `decompose`? | Within scope | **No dimension covers it** |
| Checklist available? | — | Yes, 11 items — used only *after* the spec exists |

The eight question areas in `interview/SKILL.md:48-55` cover every state, every action and its
write target, every failure, reachability, data, copy, measures, and runtime surface. None asks
the keyboard path, the focus order, what an error announces, or what a screen reader conveys.
`skeleton.md:77` bolts three generic items onto acceptance criteria ("focusable named controls,
correct roles, correct heading level"). Meanwhile `reference/surface-review.md:36` already carries
the full list — keyboard access, focus order and visibility, accessible names, semantic structure,
form labeling, error identification and recovery, status announcements, contrast, resizing, reduced
motion, touch targets — and only `ui-review` reads it, against work already filed.

**The sharp edge: a PRD with no accessibility content can score 3 — "explicit and testable" — on
all seven `rubric.md` dimensions.** Dimension 4, Behavior contract, covers states, actions,
failures, and reachability, and stops there. So the grader endorses the omission, and accessibility
arrives later as a review finding against a spec that never required it. In the organization whose
work this is, that is the wrong way round.

**The change:** add an accessibility contract question area to `interview`'s "What to ask", pointed
at the list already in `surface-review.md`; widen `skeleton.md:77`'s standing criteria to match it;
and give dimension 4 an accessibility clause so `decompose` can score its absence.
**Cost:** near zero maintenance — it cross-references a list the plugin already ships, rather than
introducing a second copy of the standard. **Known by:** a spec written here produces accessibility
tasks at decompose time instead of accessibility findings at review time.
**House rule:** eliciting a requirement is not determining conformance, but the wording must keep
that straight — "the spec requires keyboard operability" is a requirement; it says nothing about
whether the built thing has it.

### 3. `know-qa-agent`: let `pair` capture the human evidence, not just the defects

`pair` is already built the right way round for this and I did not notice until I read it. A human
directs a visible browser, their judgment becomes a first-class finding placed "on top of the
evidence underneath it," it handles SSO-gated real deployments, and it writes a resumable session
state and a report. That is the shape of a manual accessibility pass: the person decides, the tool
records.

What it cannot record is the thing that makes the record useful: a finding carries no success
criterion, no method (screen reader, keyboard-only, magnification, reduced motion), and no declared
page set. And a person *can* assert what no automated pass may — that a criterion is satisfied —
but there is nowhere to put it.

That matters because **Phase 5's input contract is exactly this evidence, and no plugin here
advertises producing it.** Phase 4 annotates what automation found. Phase 5 assembles human
evidence into a report. The step in between — a person testing with a screen reader and the result
being recorded in a form a document can consume — has no home.

**Cost:** fields on the finding contract and the session state, plus the page-set declaration.
Higher than proposals 1 and 2 and it should follow Phase 5's requirements conversation, since the
shape of the evidence depends on what the report needs. **House rule:** safe by construction —
every determination comes from the person at the keyboard, and the tool's job is to write down who
decided what, how, and on which pages.

### 4. `know-qa-agent`: replace the two chat-app leftovers in `pair`'s tool list

`pair/SKILL.md:97` offers `inspect-chat.mjs` and `inspect-labels.mjs` as general corroboration
tools. They are not: `inspect-labels.mjs` finds avatar initials and tinted message bubbles with
hardcoded colour defaults, `inspect-chat.mjs` compares chat message styling to a mockup. Both are
leftovers from one worked example.

The better fix than deleting the mention is **a real `inspect-a11y.mjs`** — accessible name, role,
and state for a selector or the focused element, which Playwright can report directly. That is what
an auditor reaches for mid-session, it is what the misleading name already promises, and it is the
corroborating-fact tool `pair` is missing.

### 5. Fill the `know-photo-generator` house style

Including disability representation. Not engineering; a decision and a content pass, already
Knowbility's to make. Both advisors ranked this first — see the anchoring note above for why I do
not.

**Plugins to leave alone:**

- **`know-blueprint`** — the one "leave alone" verdict here that is checked rather than assumed.
  `skills/blueprint-capture/SKILL.md:152-162` rates accessibility judgment Human by default and
  covers decorative images, alt text, reading order, accessible names, caption and transcript
  adequacy, and conformance determinations, with an overrule recorded alongside the rating it would
  otherwise have carried. (That it also covers exceptions, approval authority, and revalidation is
  still the advisory report's citation of lines 226-271, which I have not read.)
- **`know-researcher`** — most mature, internals deliberately outside the packet, no unmet task
  identified. "Leave alone" here means "not examined," not "examined and found complete."
- **`know-security`** — same status, and it should be stated as such: I read its skill descriptions
  and nothing else. Its scope looks deliberate and no accessibility surface suggests itself, but
  that is a judgment from the outside.

`know-product-spec` was on this list in the first draft, carried over from the advisory report.
Reading it moved it off. See proposal 2 — which is the argument for not writing a verdict you have
not checked.

## Self-audit of this review's own claims

Prompted by a correction: one claim here rested on an assumption, so every other load-bearing claim
got checked the same way. Four were wrong or unsupported.

| Claim as first written | Verdict |
|---|---|
| "`know-qa-agent` has never been driven against a live site from a cold install" | **Wrong.** Sources say "not yet … **here**." Dropped qualifier; corrected in the previous commit. |
| "axe-core ships 105 rules … 23 of 56 A/AA criteria" | **Wrong, and it overstated coverage.** 9 rules are disabled by default and `axe.mjs` does not re-enable them. 96 run, covering **21 of 55**. |
| "`know-product-spec`: purposeful and bounded as supplied" | **Wrong.** Relayed from the advisory report without reading the plugin. It has a real gap — proposal 2. |
| "a port of a plugin that was already in regular use" (my own correction) | **Unsupported.** It is a port, and the predecessor is installed on this machine. Frequency of use is not mine to assert, and the argument does not need it. |
| "`know-blueprint`: accessibility default is already correct" | **Holds, now verified** at `blueprint-capture/SKILL.md:152-162`. Was a relay when written. |
| "WCAG 2.2: 86 live criteria, 55 at A/AA" | **Holds.** Counted from the conformance-level markers in the W3C Recommendation, two ways, agreeing; 4.1.1's obsolete status read directly. |
| "`inspect-labels.mjs` is chat-app-specific" | **Holds** — read the file. But "leftover from the source product" is inference; its header says only "from one worked example." |
| "nothing in the marketplace generates Phase 5's input" | **Narrowed.** Checked `know-qa-agent`'s skills and spec format. 42 skills exist across six plugins and I have read perhaps a third, so the honest claim is that no plugin advertises it and `know-qa-agent` does not produce it. |

**The pattern in all four misses is the same:** a secondary source read as a primary one. A
repository's status note read as a fact about the software, a documented rule count read as the
count that runs, an advisor's summary read as a reading of the plugin. The two figures that survived
unscathed are the two I obtained by running the thing — `axe.getRules()` and a tally of the W3C
document — which is the whole argument for doing that first.

## What nobody has established

No Knowbility auditor, communications staff member, or program lead has been asked about any of
this. Every value claim above is read off the artifacts and the standard, not off an observed
workaround. Phase 4 and Phase 5 are already waiting on the same conversation, so the cheapest next
move is to put all of it in front of the same person once.
