# know-researcher

**Research you can hand to someone who will check it — every claim traced to a source note, every
note to a declared source, and nothing reaching a final output until it has been audited.**

AI research tools produce confident prose. What they rarely give you is the chain: where a number
actually came from, whether a qualifier got dropped on the way to the summary, whether three
citations trace back to one original study. The output reads authoritative either way, so you end
up trusting it or redoing it.

know-researcher makes the chain visible and enforces it. You describe the research challenge; it
builds a phased plan grounded in preliminary research on your actual subject, then works the cycle
with you — find sources, process them into structured notes, cross-reference, map the gaps,
synthesize, and audit the draft against the notes before it can become a deliverable. Numbers are
registered once and checked everywhere. Claims that nothing supports get flagged rather than
smoothed over.

```
/know-research:init              start a project — four questions, then a plan
/know-research:discover          find candidate sources for the current phase
/know-research:process-source    turn a URL, PDF, or file into a structured note
/know-research:cross-ref         find patterns and contradictions across the notes
/know-research:check-gaps        map coverage against the plan, find the holes
/know-research:summarize-section draft a section from the evidence
/know-research:audit-claims      fact-check the draft; promote it only if it passes
/know-research:start-phase       brief yourself before the next phase
/know-research:phase-insight     which questions are covered, which are thin
/know-research:progress          where the project stands and what to do next
/know-research:graph-analysis    which claims are load-bearing, where evidence is fragile
/know-research:review-corpus     independent adversarial review of the whole corpus
```

## Install

```
/plugin marketplace add knowbility/knowbility-marketplace
/plugin install know-researcher@knowbility
```

## Setup

**Nothing is required.** With no API keys and no command-line tools installed, discovery runs on
Claude's built-in `WebSearch` and `WebFetch`, and every other part of the system works normally.
Candidate files are stamped so you can see when a run came from the built-in floor rather than a
search tool.

Optional tools make discovery sharper, not possible:

| Tool | Install | Key | What it adds |
|---|---|---|---|
| **Tavily CLI** | `pip install tavily-cli` | `tvly login` or `TAVILY_API_KEY` | Domain filtering, topic scoping, time ranges |
| **Firecrawl CLI** | `npm install -g firecrawl-cli` | `firecrawl login` or `FIRECRAWL_API_KEY` | Second search tier, clean content extraction |
| **Exa** | nothing to install | `EXA_API_KEY` | Semantic search in parallel with Tavily |
| **Playwright** | `npm install -g playwright` | none | Last-resort rendering of JavaScript-heavy pages |
| **pdftotext** | `brew install poppler` | none | Local PDFs as text, which uses far less context |
| **Codex CLI** | `npm install -g @openai/codex`, then `codex login` | OpenAI account | A second, independent reviewer for the corpus review. **Read the egress note below before installing it.** |

If you installed `tvly` with pip, pipx, or uv, make sure `~/.local/bin` is on your PATH. A
session-start hook adds the usual locations for you.

**One real dependency, and only for one thing.** The hook that guards the output directory on
Claude Code needs `jq`. macOS 15 and later ship it at `/usr/bin/jq`; on earlier macOS, on many
Linux images, and in containers you install it (`brew install jq`, `apt install jq`). Without it,
writes to `research/outputs/` are refused with a message telling you to install it — the gate fails
closed on purpose, because a promotion nobody can verify is the thing it exists to stop. Everything
else in the plugin runs without `jq`.

## The cycle

Four questions at init — research type, topic, where the project lives, and who the research is
for — and you get a scaffolded project with a phased plan. The audience answer is not filler: it
compiles into an evidence standard the audit gate enforces, so a due-diligence project can be set
up to refuse single-source financial claims outright.

Each phase runs the same loop:

1. **Collect** — `discover` finds candidates across channels chosen for your research type; you
   decide what gets processed; `process-source` turns each one into a structured note.
2. **Connect** — `cross-ref` surfaces patterns, agreements, and genuine contradictions.
3. **Assess** — `check-gaps` measures coverage by *independent* sources that directly answer a
   question, not by how many files you have.
4. **Synthesize** — `summarize-section` drafts from the evidence base.
5. **Verify** — `audit-claims` checks the draft against the notes and promotes it only if it
   passes.

Phases are sequential and resumable. State lives in `STATE.md`, so clearing context between phases
is encouraged rather than tolerated — nothing important lives in conversation history.

## Research types

Each type brings its own phase structure, finding tags, source credibility hierarchy, staleness
threshold, and validation standards.

| Type | What it does |
|---|---|
| **PRD Validation** | Pressure-test a product requirements document against outside evidence |
| **Exploratory Thesis** | Build the evidence base for a thesis or concept, and find what argues against it |
| **Competitive Analysis** | Map a landscape: players, features, white space, positioning |
| **Company Research (For-Profit)** | Financials, products, market position, leadership, risks |
| **Company Research (Non-Profit)** | Mission, programs, impact, 990 filings, funding, governance |
| **Person Research** | Career, expertise validation, published work, public positions |
| **Market/Industry Research** | Adoption patterns, key players, growth data, barriers, direction |
| **Presentation Research** | Claims, supporting data, counterpoints, and the through line |
| **Curriculum Research** | Domain accuracy, practitioner reality, misconceptions, field currency |
| **Opportunity Discovery** | Where an audience gathers, complains, and pays, and where tools fall short |
| **Customer Safari** | Strategic intelligence from an audience's own observable behavior |

Person Research and Customer Safari anonymize anyone other than the commissioned subject unless
permission is on record. Real specificity, not real identity.

## What keeps it honest

**Canonical figures registry.** Every cross-phase number is registered once. A figure carried into
a later phase must match the registered value, so numbers cannot drift between note, draft, and
synthesis.

**Claim graph.** Each audited claim is a node with edges to its source notes and figures. Revise a
figure and the system traces every downstream claim that depended on it.

**Integrity agent.** Runs after writes, looking for fabricated data, range narrowing ("1-3x"
becoming "2-3x"), stripped qualifiers ("in North America" becoming "globally"), internal
inconsistency, and cross-phase drift.

**Independence-aware coverage.** Three posts citing one study count as one data point. Sources
whose origin cannot be established count as independence-unknown, never as corroboration.

**Contradiction handling.** Genuine conflicts between credible sources block synthesis until you
decide the resolution. They are not averaged away.

**Counter-evidence requirement.** For thesis and PRD work, synthesis is blocked until something
credible challenges the central claim — or until a documented search finds nothing and you
acknowledge it, which stamps the output accordingly. "Nobody disagrees" is a finding you have to
earn by looking.

**Per-claim confidence.** Each claim gets a tier; a section's tier is its weakest claim, so thin
evidence cannot shelter behind strong neighbors.

**The output gate.** Nothing reaches `research/outputs/` except through `audit-claims`. On Claude
Code a hook enforces it. In Claude Desktop, where hooks do not run, it holds structurally because
`audit-claims` is the only skill that writes there.

**Corpus review.** Project completion gates on an independent adversarial read of the whole
evidence base against your stated success criteria, not just per-claim checks.

## What leaves your machine

Discovery calls outside services. Worth knowing before you point this at anything sensitive: the
queries are derived from your research topic, and they go out over the network.

| Service | Used for | What it needs |
|---|---|---|
| **Tavily** | Web, news, financial, and social-signal search | `tvly` CLI, `TAVILY_API_KEY` |
| **Exa** | Semantic search alongside Tavily | `curl`, `EXA_API_KEY`; skipped silently if absent |
| **Firecrawl** | Fallback search and content extraction | `npx firecrawl-cli`, `FIRECRAWL_API_KEY` |
| **OpenAlex** | Academic paper search | No auth; `mailto` parameter for the polite pool |
| **Crossref** | Academic metadata OpenAlex misses | No auth |
| **Unpaywall** | Legal open-access copies of paywalled papers | No auth; email parameter |
| **SEC EDGAR** | Filings by company name or CIK | No auth; identifying `User-Agent`, 5 req/s |
| **ProPublica Nonprofit Explorer** | 990 filings, revenue, governance | No auth |
| **Google Patents** | Patent discovery by assignee or inventor | Reached through an extraction tool |
| **WebSearch / WebFetch** | The always-available floor | Nothing |

| **Codex CLI** (optional) | Tier-1 reviewer for `review-corpus` | `codex` CLI, an OpenAI account |

What goes out above the last row is mostly a **search query derived from your topic** — but not
only that, and the difference matters if the topic is sensitive:

- **Extraction sends a URL and pulls the page back.** Tavily's and Firecrawl's extract modes, and
  the built-in `WebFetch`, fetch a specific address you have already seen in search results.
- **Three services get an identifier.** OpenAlex takes a `mailto` parameter and Unpaywall an email,
  both for polite-pool access; SEC EDGAR requires a `User-Agent` that identifies the tool.
- **The floor tier does not go through Bash.** `WebSearch` and `WebFetch` are Claude's own tools, so
  when no search CLI is installed — the default — those calls are not visible as shell commands.
  Everything else is a CLI or `curl` invocation through Bash, where you can read exactly what was
  requested.

No file from your project is uploaded by any of it. What leaves is queries, URLs, and the
identifiers above.

**The last row is different, and it is the one to think about.** The corpus review runs two
independent reviewers. Tier 2 is this plugin's own reviewer agent, running on Claude like the rest
of the session. Tier 1 is the OpenAI Codex CLI, and it does not receive a search query — it is
pointed at your project root and **reads the whole research corpus**: your notes, your drafts, your
state, your plan. That is the point of it, an independent cross-family read of the same evidence,
and it is why its findings are worth having. It also means the corpus goes to a second model
provider.

So: **Tier 1 is opt-in by installation.** With the Codex CLI absent, `review-corpus` runs Tier 2
only, records the missing tier as a failed attempt so the review's composition stays visible rather
than silently halved, and the completion gate still works. Nothing degrades quietly. If a corpus
contains client material, material under NDA, or anything else that should not reach a second
provider, do not install the Codex CLI for that work — and if it is already installed, know that a
`final` review will use it.

If a research topic itself is confidential, that is a decision to make before running discovery,
not after.

## Claude Code and Claude Desktop

The workflow is the same on both. Four mechanics differ, and none needs configuration — the plugin
detects the surface:

- **The `outputs/` hook** is Claude Code only. In Desktop the gate holds as a structural rule.
- **The `.claude/settings.json` pre-allow** that init writes is a Claude Code permission file.
  Desktop applies its own model and ignores it; nothing breaks, you just see more prompts.
- **The `PreCompact` save warning** is Claude Code only.
- **Plan generation** runs inline in the main context on both surfaces. On Claude Code you can
  optionally delegate it to a fresh subagent.

A full first phase triggers a lot of Bash permission prompts in default-prompt mode, mostly during
init's preliminary research and discovery's per-channel queries. Init pre-allows the plugin's own
tools, and Claude Code's Auto mode removes most of the rest. The writes that matter are gated by
the plugin itself, not by per-prompt confirmation, so the risk surface is the same either way.

## What this is not

**Confidence tiers rate evidence, not products.** A tier says how well the sources support a claim.
It says nothing about whether a thing in the world is in a good state. **A sourced finding about an
accessibility requirement is a reading of the standard, not a conformance determination about any
product** — researching what WCAG 2.2 requires, however well sourced and however high the
confidence tier, is not an evaluation of whether anything conforms. That evaluation involves
assistive technology and a person, and this plugin neither performs nor substitutes for it.

**It is not a summarizer.** It does not ask Claude what it knows and format the answer. It sends
Claude to find sources, structures them, and audits against them. That is slower, and it is the
whole point.

**It does not make your sources good.** It records credibility, independence, staleness, and
directness, and it refuses to treat weak evidence as strong. It cannot conjure a primary source
that does not exist, and a well-audited output built on thin evidence will tell you it is thin
rather than fix it.

**The audit checks sourcing and consistency, not judgment.** It catches a claim nothing supports, a
number that drifted, a qualifier that vanished. Whether the research asked the right question in
the first place is still yours.

## What hasn't been exercised here

This plugin was ported into this marketplace and its files were verified: the invocation namespace
resolves, the corpus-review validator runs, and the output gate was tested with and without its one
dependency. But **no research project has been run end to end in this repository.** No live
discovery call has been made from here, and no corpus has been reviewed.

The architecture and the decision ownership are written up in `dev/know-researcher/`, which came
across with the port.
