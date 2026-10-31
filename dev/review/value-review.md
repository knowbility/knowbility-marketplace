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

axe-core 4.12.1 — the version pinned in `know-qa-agent/harness/tools/package.json` — ships **105
rules**, carrying tags for **29 distinct success criteria**. Of those 29: one is 4.1.1 Parsing,
which WCAG 2.2 marks obsolete and removed; five are AAA; and **23 are at level A or AA**.

WCAG 2.2 lists 87 success criteria, of which 86 are live and carry a conformance level: **31 at A,
24 at AA, 31 at AAA**. So A and AA together are **55** criteria.

> **axe-core 4.12.1 has at least one rule touching 23 of the 55 live A/AA success criteria in
> WCAG 2.2.** Thirty-two have no automated rule at all — and "has a rule" is not "fully tests,"
> since several of the 23 are only partly machine-decidable.

Those 32 criteria are the list an auditor needs and cannot currently get.

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
contract, and nothing in the marketplace generates it.

**Two of its three tiers need no maintained table at all:**

| Tier | What it says | Where the data comes from |
|---|---|---|
| Criteria with a failing rule | "Automation found a problem here." | Already computed today |
| Criteria with a rule that found nothing | "A rule ran and passed. Necessary, not sufficient." | Derivable now from axe metadata — **no table** |
| Criteria with no axe rule at all | "Nothing automated has told you anything. Go test this." | The complement against a WCAG criteria list — **the only table** |

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

## Ranked

1. **Report untested criteria in `know-qa-agent`.** Highest value to the organization's core work,
   bounded cost, strengthens the house rule rather than straining it. Worth pairing with a
   live-site run under the new namespace, to confirm the port's packaging — but that is a sanity
   check alongside, not a gate in front.
2. **Fill the `know-photo-generator` house style**, including disability representation. Not
   engineering; a decision and a content pass, already Knowbility's to make.
3. **Correct `pair/SKILL.md:97`** so the chat-specific tools are described as what they are, or
   dropped from that list. Small, and it misleads exactly the user this marketplace exists for.

**Plugins to leave alone:** `know-researcher` (most mature, internals not reviewed, no unmet task
identified), `know-security` and `know-product-spec` (purposeful and bounded as supplied),
`know-blueprint` (capture already covers exceptions, authority, and revalidation, and its
accessibility default is already correct).

## What nobody has established

No Knowbility auditor, communications staff member, or program lead has been asked about any of
this. Every value claim above is read off the artifacts and the standard, not off an observed
workaround. Phase 4 and Phase 5 are already waiting on the same conversation, so the cheapest next
move is to put all of it in front of the same person once.
