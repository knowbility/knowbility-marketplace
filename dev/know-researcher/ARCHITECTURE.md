# researcher — how it works

This explains what the Researcher plugin does, how it does it, and what it adds on top of the
tool you are already running it in. It is written to be read start to finish by someone who
wants to understand the system, not to be searched by someone who already does.

Two sections are useful even if you never run the plugin. **The idea underneath this** covers
what an agent harness and an agent loop actually are, since researcher is a worked example of
both. **Two shapes of agent** sets it against a productized system like the Hello Alice AI
Advisor, and works out what actually differs between them.

If you maintain the plugin and need exact write-ownership, the current status of every known
limit, or the version each piece landed in, that lives in
[MAINTAINERS.md](MAINTAINERS.md). This document stays clear of all of it.

---

## The idea underneath this: the model is not the whole thing

When you use an AI tool, you are not really choosing a model. You are choosing the environment
built around the model: what it can read, what tools it can reach, what it remembers between
sessions, what it is allowed to do on its own, and where it has to stop and ask you.

That environment is the harness. Claude Code is a harness. So is Cowork. Each one gives a model
a place to work, a set of tools, a way to hold context across many steps, and a way for you to
watch and approve what it does. Call that the **base harness**. It is built and maintained by
the product company, and it makes the model broadly capable.

A base harness does not know your standards. It does not know what counts as a good source in
your field, what "enough evidence" means for the decision you are trying to make, which
judgment calls are yours and not the machine's, or what has to be true before a finding is
allowed to leave the building. That part is yours to build, and the thing you build is a
**personal harness**: the reusable way of working that you wrap around a capable model so that
every project does not start from nothing.

**researcher is a personal harness for research work.** It is not a research assistant that
answers questions. It is a set of rules, files, named steps, and checkpoints that turn a general
model into a research partner whose output you can check without redoing it yourself.

That last phrase is the whole point, so it is worth stating on its own:

> The test for whether you can safely delegate work to an AI is not "can it do this?" It is
> **"can I verify the result without redoing the work?"** Everything in this plugin exists to
> make the answer yes.

### The agent loop

The other half of what a harness provides is a loop. The word sounds technical and the thing it
describes is not:

1. Take in a goal.
2. Decide what to do next.
3. Do it, usually by using a tool.
4. Look at what happened.
5. Decide whether to keep going, change course, ask for help, or stop.

Then repeat. That cycle is the difference between an agent and a chat response. Ask a chat
window to prepare a competitive brief and you get one answer from what the model already knows.
An agent in a harness can search, open the strongest pages, compare them, take notes, notice
what is missing, draft, and come back to you with a question before it goes further.

**The loop does not make any of that trustworthy.** It only gives the system a way to do
multi-step work instead of producing one answer and stopping. Whether the work is any good
depends entirely on what surrounds the loop: the context it can see, the tools it can reach,
the rules it follows, and the points where a person checks it. That is the rest of this
document.

One distinction worth getting straight early, because it is easy to conflate. **researcher's
five-step cycle is not the loop.** The loop belongs to Claude Code or Cowork and it turns many
times inside a single step. The five-step cycle is a fixed itinerary laid over the top of it, so
that a loop which could go anywhere goes somewhere specific and checkable instead.

---

## What the base harness gives you, and what researcher adds

| | The base harness (Claude Code / Cowork) | What researcher adds |
|---|---|---|
| **The model** | Reads, reasons, writes, chooses next steps | Nothing. It uses the model you are running. |
| **The loop** | Plans a step, acts, checks the result, continues | A fixed five-step research cycle the loop runs inside, one phase at a time |
| **Tools** | Web search, file access, running commands | A three-tier source-discovery stack, a position helper, a completion validator |
| **Memory** | Conversation history, project files | A durable set of research files that survive a cleared context, including the agent's in-progress thinking |
| **Permissions** | Approve or deny individual tool calls | A short, named list of moments where the agent must stop and ask you, and a hard gate before any finding is published |
| **Interface** | A chat, a terminal, a workspace | Twelve named commands, so you ask for one checkable piece of work at a time |
| **Standards** | None. It does not know your field. | Source-quality criteria, evidence standards compiled to your audience, and eleven research-type playbooks |

The base harness makes the model capable. researcher makes it accountable.

---

## The problem it is built for

Ask a capable model to research something and it will produce something useful. The trouble
starts one step later, when you try to act on it.

You cannot tell which sentences came from a source and which came from the model's general
knowledge. A number that was measured on nine depots over one summer is now a claim about the
whole region, and nothing in the output marks the moment it widened. Three sources agreed, but
two of them were reprinting the third. Nobody went looking for evidence that the conclusion was
wrong, so of course none appeared. The recommendation sounds decisive because decisive is how
fluent writing sounds.

None of these are lying. They are the normal failure modes of compressing a lot of material
into a short answer, and they are invisible in the output itself. That is what makes them
expensive: you find them when someone acts on the work.

researcher's answer is to slow one part down. Every claim has to trace back to a specific note,
every note to a declared source, and nothing reaches the finished-work folder until an audit
has walked that chain. The cost is real. The return is that you can read the output and check
the parts that matter instead of rebuilding all of it.

---

## The working cycle

Research runs one **phase** at a time. A phase is a chunk of the question with its own
sub-questions, defined in the research plan when the project is set up. Phases are sequential:
each one finishes its full cycle before the next begins.

Every phase runs the same five steps.

**1. Collect.** `/know-research:discover` searches for sources and writes a candidate list. It does
not process anything. You look at the list and say which ones to take, and that human step is
deliberate: choosing which evidence goes in is the judgment the whole system is built to
protect. Then `/know-research:process-source` reads each chosen source and writes a structured note
for it, recording what was claimed, how good the source is, and for every number, what it
actually measured.

**2. Connect.** `/know-research:cross-ref` reads across all the notes so far and looks for the same
claim appearing more than once, claims that contradict each other, and agreement that is not
really agreement because the sources share an origin. It also measures whether new sources are
still telling you new things.

**3. Assess.** `/know-research:check-gaps` asks whether what you have is enough to answer the
phase's questions. This is a separate question from whether you have gathered sources, which is
why it is a separate step with a separate owner. It reads the saturation signal from step 2 and
crosses it with coverage. If a question is both well-searched and still not adequately
answered, that is a decision for you, not a loop the agent keeps running.

**4. Synthesize.** `/know-research:summarize-section` writes the draft. This is where the reasoning
happens, and it is the step with the most rules on it, because it is where evidence turns into
conclusions. Ranges stay ranges. Qualifiers stay attached. Every load-bearing "so what" is
labelled with what stands behind it. Every load-bearing claim has to show that somebody looked
for evidence against it.

**5. Verify.** `/know-research:audit-claims` walks the finished draft against the notes it cites,
check by check, through a fixed battery. If it passes, the draft is promoted to `outputs/`,
which is the only way anything gets there. If it fails, it says what failed and where.

Three more commands run alongside the cycle without being part of it, and none of them change
anything: `/know-research:progress` shows where the project stands, `/know-research:phase-insight` reports
how strong the current phase's evidence is, and `/know-research:graph-analysis` looks at the shape of
the evidence base as a whole. `/know-research:start-phase` opens the next phase and carries forward
what matters from the last one. `/know-research:init` sets the project up once.

There is a twelfth command, `/know-research:review-corpus`, and it belongs to the end of the project.
It is covered further down.

### Why it is named steps rather than one big prompt

A long, perfect prompt is brittle. It works until the day the work is slightly different, and
then it fails in a way that is hard to see, because there was never a checkpoint where you could
tell whether it was still on track.

Named steps behave differently. Each one does a single thing you can check when it finishes. If
the gap check says coverage is thin, that is a specific claim about a specific question, and you
can disagree with it. If the audit fails on one claim, you know which claim. The value is not the
names. It is that the work arrives in pieces you can inspect.

---

## What it remembers, and why

Long research runs across many sessions. Context gets cleared. The single most common way an AI
research session goes wrong is that the agent reconstructs where it is from the conversation
instead of from the files, and reconstruction is lossy. It picks the wrong next step, and then
it hedges, because a guess feels uncertain and uncertainty asks permission.

So the plugin's rule is blunt: **your position in the workflow is a fact on disk, not a memory.**
There is a script that computes it, and the agent runs the script rather than remembering.

Two different things get carried between sessions, and the distinction matters.

**The position** lives in `STATE.md`: which phase is active, which of the five steps is current,
how many sources have been processed, and a `Next Action` line that is always a command you
could actually run. This is read at the start of every session and written after anything
significant.

**The thinking** lives in `commonplace.md`: the hypotheses the agent is holding, the half-formed
reads, the thing that seemed interesting three sources ago. This is picked back up at the start
of the next phase. Carrying the position without the thinking gets you a partner who knows where
the bookmark is and has forgotten the argument.

The rest of the durable files each hold one kind of record.

| File | What it holds |
|---|---|
| `research-plan.md` | The assignment: the phases and the questions each one has to answer |
| `sources/notes/` | One structured note per source, including what each figure measured and how far it travels |
| `sources/registry.md` | The ledger of what has been processed |
| `discovery/*-candidates.md` | Each batch of found sources, tagged as they are worked through |
| `discovery/exclusions.md` | Sources considered and not taken, and why |
| `negative-searches.md` | Searches run specifically to find contradicting evidence, including the ones that came back empty |
| `assumptions.md` | Judgments made on thin evidence, each with what would confirm or break it, and whether that has been tested |
| `reference/decision-ledger.md` | An append-only record of decisions: corrections, resolutions, accepted gaps, and your explicit directives. Nothing in it is ever edited; a later entry supersedes an earlier one. |
| `reference/canonical-figures.json` | Every number that appears in more than one phase, so it cannot quietly change between them |
| `reference/claim-graph.json` | Claims as nodes with edges to the sources and figures behind them |
| `reference/evidence-standard.md` | Your audience's rules for what counts as adequate evidence, compiled at setup and enforced at the audit |
| `cross-reference.md`, `gaps.md` | The current read on patterns and coverage. Regenerated every run. |
| `drafts/` → `outputs/` | Work in progress, and work that has passed the audit |
| `audits/`, `gate-log.md` | What each audit checked and what it found |

The ones that regenerate are cheap and disposable. The ones that append are the record.

---

## Who decides what

Three roles, and the split follows what each is actually good for.

**You are the principal investigator.** You are accountable for the work, so you make the calls
that carry consequence: which sources go in, what a material contradiction means, whether to
carry a flagged claim anyway, and whether anything gets published.

**The agent is the coordinator.** It holds the position, runs the cycle, sequences the batch,
and updates the shared files. It works in the conversation with you and stays interruptible,
which is a deliberate constraint: the coordinator is never handed off to a background process,
because you have to be able to interrupt it.

**Specialists are separate, isolated agents,** and researcher ships two. The integrity agent
checks provenance and consistency on work the coordinator just produced. The corpus reviewer
runs the end-of-project review. What a specialist adds is not extra knowledge, since it reads
the same reference guides everyone else does. What it adds is **independence**. You cannot audit
your own work in the same context that produced it.

A useful way to think about the split, borrowed from how people talk about delegating to AI
generally:

- **Automate** the work that is routine and easy to check: computing position, counting
  agreements, tagging processed sources, running the battery.
- **Augment** the work where the machine moves fast and you supply judgment: finding candidates,
  drafting a section, spotting contradictions.
- **Anchor** the work where the value is your accountability: what the research is for, which
  evidence counts, what the finding means for the decision, and whether it ships.

The stop list below is that third category, written down.

---

## Where it stops and asks you

The default is that the agent proceeds. This is not a preference, it is a fix for a specific
failure: an agent that is unsure asks permission, and an agent that asks permission constantly
reads as a partner who will not drive. "Should I keep going? Should I cross-reference now?" is
not caution. It is uncertainty being handed to you to resolve.

So stopping is a short, closed list. Everything not on it, it does.

1. **Which sources to process** after a discovery run.
2. **Curating sources mid-batch** — a swap, a skip, a reorder.
3. **A material contradiction**, meaning one that would actually move a finding.
4. **A waiver** — your call to carry a flagged claim anyway.
5. **A real access failure**, where a source cannot be fetched and the options need a person.
6. **A genuine strategic fork**, such as a gap result suggesting the phase needs different
   sources entirely.
7. **Promotion to `outputs/`.** The one irreversible action, never automatic.
8. **A material finding from the end-of-project review**, which only you can close.

The test behind the list: would your answer change what happens, and could the agent not have
known it from the files? If the answer is predictably "yes, go on," it was not a question.

---

## How it talks to you

Everything above governs what the agent does. None of it governs how the agent sounds, and that
is a separate problem with its own failure mode:

> The evidence layer can hold perfectly while the conversation quietly fails.

You can have every claim traced, every audit green, every gate honored, and still walk away with
the wrong impression, because the impression was formed in the conversation rather than in the
document. So voice is governed on its own, in its own file, at the plugin level rather than
inside each step. A human researcher does not become a different person when they switch from
finding sources to checking coverage, and neither should this.

The person it is written to sound like is a working researcher who is genuinely good at
explaining things. Someone who can make a hard idea land for everyone in the room without making
anyone feel behind. That person starts where you already are rather than where the topic starts.
They say one idea per sentence. They reach for something concrete the moment an idea turns
abstract, and they never use a term they have not given you. What they never do is perform
expertise, hedge in order to sound careful, or hide a simple point inside a complicated sentence.

### Four ways the conversation fails

**It agrees with you.** The research-specific form of flattery is not "great question." It is
converging on the conclusion you were hoping for. You arrive wanting the thesis to hold, the
market to be big, the candidate to check out. Nothing in the gates stops the *conversation* from
drifting toward where you want to land. And the obvious fix makes it worse: an agent simply told
to push back manufactures skepticism instead, which is the same failure wearing a different hat.

**It sounds like every other answer.** Left alone, a model drifts toward the median response for
a prompt of that shape. Generic caution. Generic "the evidence is mixed." Generic synthesis. The
correction is not picking a direction to lean. It is having an actual method for thinking about
the specific question.

**It narrates instead of checking.** Over a long project the agent's memory of what you have both
been building becomes very strong, and it can quietly turn into a consistent narrator of the
working thesis rather than a useful check on it. Continuity feels like understanding. It is not
the same thing.

**It becomes unreadable.** A turn that is accurate, honest, and impenetrable has failed. If you
spend your attention decoding the prose, you have none left for the research, so you skim, and
you miss the thing that mattered. The test is blunt: **if you have to reread a sentence, that
sentence failed.** Density is not rigor. It is a tax charged for work the writer declined to do.

### The first sentence carries the evidence, not the agreement

Agreement does not mostly live in words like "great." It lives in a turn shape: validate first,
then elaborate. That shape survives every list of banned phrases because it mutates. "You're
right, and…" "Agreed, and that's exactly what the sources show." The problem is that you read the
handshake before you read the substance, and after enough handshakes you cannot tell genuine
agreement from lubricant.

So the rule is positional. The first sentence of a response carries the agent's read of the
evidence. Agreement, where it is earned, arrives later and attached to the specific claim it
covers.

### It grades your idea before it builds on it

When you offer a hunch, an interpretation, or a conclusion you would like to be true, it
classifies before running with it. There are four verdicts:

- **Supported.** Here is what supports it, and which notes.
- **Partly supported.** Here is the part the evidence carries, and here is what the rest needs.
- **Contradicted.** Here is the source that disagrees.
- **Untested.** The evidence base does not speak to that yet. Here is what would settle it.

**Untested is the most important verdict in a research product**, and it is the one a fluent model
is least likely to reach for, because "we don't know yet" reads as a non-answer. An untested hunch
is a hypothesis. It gets logged, and then somebody goes looking.

### Pushback has to be sourced

Two things get challenged specifically, because they are the two ways research goes wrong in
conversation rather than on paper.

**Premature certainty**, when you want to conclude before the evidence carries the conclusion. The
pushback names what the notes support, what they do not, and what is still resting on one source.
Never a vague "we should be careful."

**Preferred-conclusion steering**, when a run of choices has all leaned the same direction. You
shape the evidence universe and you shape the conclusions. That is your right, and the ledgers
record it. What the agent does is name the shape neutrally and ask which project it is running.
Observation, not accusation, and once you answer, your answer stands.

Underneath both sits the rule that keeps this from becoming theater:

> Every challenge names where in the material the softness lives. If it cannot point at the
> place, the correct amount of pushback in that moment is zero.

Manufactured skepticism spends your trust on performance. The counterpart matters just as much:
when it looks honestly and the evidence is genuinely solid, **"I tried to break this and it held"
is a real verdict**, delivered as good news with the reasoning shown rather than as a suspiciously
easy pass.

### Confidence stays proportional to the evidence, in both directions

This is the part people get wrong when they tune an agent's voice. Tell it "you're too hedged"
and the naive correction is to hedge less, which just moves the failure to the other end.

The governing variable is confidence proportional to evidence. Unqualified certainty violates it
exactly as much as reflexive hedging does. Overclaiming and underclaiming are the two poles of one
failure, not a good direction and a bad one. The same discipline runs into the written outputs,
where the language is fixed to the count of genuinely independent sources: one source is "a single
source suggests," two is "supported by limited evidence," three or more is "confirmed by multiple
sources." Evidence strength is visible in the sentence rather than left to the reader's
impression.

### It does not make you learn its vocabulary

The plugin has a lot of internal terms. You are not expected to know any of them, and the rule is
that a term gets defined the first time you see it or does not get used. An undefined term
silently turns a decision into a guess, because you cannot evaluate a claim built on a word you do
not know.

So the internal vocabulary gets translated on the way out.

| What it means internally | What you actually hear |
|---|---|
| Lopsided | "this rests on a single independent source" |
| Shared-origin cluster | "these three trace back to one original, so they're one data point" |
| Saturation advisory | "more sources probably won't change this answer" |
| Echo level | "repetition, not confirmation" |
| Independence-unknown | "we can't tell where this one originally came from" |
| Check IDs like C-01 or XREF-02 | never said aloud; the thing gets described instead |

The same instinct governs process talk. You should hear "that's five sources since the last
cross-reference, so that's next," never "updating STATE.md and resetting the counter." The
behaviors are required. Announcing them is not allowed.

---

## The rules it will not break

These hold across the whole system. A change that violates one is almost certainly wrong.

1. **Provenance.** Every claim traces to a note, every note to a declared source. Nothing reaches
   `outputs/` without a passing audit. (There is an honest limit to this, described further down.)
2. **Independence is unknown until shown.** Two sources agreeing is not corroboration until you
   know they are not repeating each other. The default is unknown, never assumed.
3. **Non-invention.** The subject's identity comes from you. Author names come from bylines. No
   number is ever estimated, interpolated, or filled in.
4. **A figure carries what it measured.** A number that keeps its digits and changes what it
   counts has become a different claim. This binds the written draft and the spoken sentence
   equally, and the spoken one is the harder case, because speech compresses and compression
   always runs toward the stronger reading.
5. **Machinery stays backstage.** You hired a research partner, not a pipeline. The behaviors are
   required; announcing them is not allowed. You should hear "that's five sources since the last
   cross-reference, so that's next," never "updating STATE.md and resetting the counter."
6. **Position is computed, not recalled.**
7. **Phases are sequential.** Each finishes its full cycle before the next starts.
8. **Curation is yours; visibility is the plugin's.** What was excluded gets recorded and shown,
   never quietly dropped.
9. **Carry the thinking, not just the position.**
10. **The record is append-only where it matters.** Decisions supersede; they do not get edited
    into looking like they were always that way.
11. **A recorded unknown beats a blank field.** "The source did not publish its methodology" is a
    finding. An omitted field reads as a question nobody asked.

---

## The judgment calls, and how each one is made

This is the intellectual center of the plugin, and it is the part that took the longest to get
right.

Research is full of judgments that normally live only in an experienced researcher's head. Is
this enough evidence to stop looking? Do these three sources actually agree? Does this finding
matter? Has anyone tried to break this conclusion? An expert makes these calls without noticing
they are calls.

An AI given the same work and no encoded criterion does one of two things. It drifts, deciding
silently and moving on. Or it stalls, handing the judgment back to you every single time. Both
are failures, and they look nothing alike, which is why they took so long to see as the same
problem.

Each of these judgments now has a home. They are handled in different places, in different ways,
because they are genuinely different kinds of question and building "one judgment system" would
have been a mistake.

**Where am I?** Computed from the files by a helper script, with a fallback to reading the state
files directly. Not remembered, not inferred from the conversation.

**Is this enough to stop looking?** Two measurements that used to fight each other. The
cross-reference step computes saturation: for each question, how much of what new sources say is
confirming what you already had. The gap check computes adequacy: whether the question is
actually answered. They are related and they are not the same, and the rule between them is that
**adequacy governs the stop, saturation governs the route.** A well-searched question is not
answered just because searching stopped paying. When a question is saturated and still
inadequate, that is a decision handed to you with three named options, and the phase holds there
until you take one.

**Do these sources really agree?** Handled in the cross-reference step, before synthesis rather
than after. A pattern from one source is a claim, not a pattern. Sources that share an origin,
share wording, or trace back to the same underlying study are clustered rather than counted.

**Does this matter, and who says so?** This one is subtle. The audit checks facts, so a
perfectly cited fact could carry an uncited priority: the sentence traced fine, and the reason it
was in the recommendation did not. Now every load-bearing "so what" gets labelled at the moment
it is written, as one of three things — something the evidence supports, something the analyst
inferred, or something you told them to prioritize. The audit then checks each label against what
actually stands behind it. Mislabelling an inference as evidence-supported is a serious finding.

**Has anyone tried to break this?** Every load-bearing claim has to carry one of three things: a
credible source that disputes it, a documented search for opposing evidence that came back empty,
or an honest statement that the claim cannot be disconfirmed through the channels this project
mapped, with what would have been needed. The third option is the important one, because without
an honest exit the requirement gets satisfied dishonestly. Separately, assumptions record whether
their break-test was ever actually run, not just what the test would be.

**Do the numbers support the rule built on top of them?** A decision rule reads as rigorous
because it contains an operator. "Adopt when time-to-value drops below thirty days" sounds
measurable. If every figure in the corpus measures *the share of teams reporting any reduction*,
then no figure measures *the size of the reduction*, and the rule cannot be evaluated at all. The
synthesis step checks that at the rule and says so, and separately checks that two figures with
overlapping populations state how they relate rather than sitting side by side implying
arithmetic nobody established. Anything more complicated than those two patterns is explicitly
handed to a human expert rather than settled, because study-design critique with partial context
is worse than no critique at all.

---

## Two rounds of checking

The audit at step 5 checks claims one at a time. It is thorough at that, and it is structurally
blind to a whole class of failure, because some problems only exist at the level of the finished
body of work.

Completion criteria that were never actually met. A conclusion that outruns the evidence when you
read the whole thing but not any single paragraph. A position reversed between phase two and
phase six with both versions still standing. A project can pass every per-claim check and still
not be ready for anyone to act on. That has happened, which is why the second round exists.

**The end-of-project review** dispatches an independent reviewer against a fixed battery of
checks. It is cold, meaning it has not seen the project's history. It is read-only. It reads only
what the manifest hands it, so it cannot go looking for context that would make a weak corpus
look stronger. Its output is a receipt and a report, both immutable, and a verdict computed by a
validator rather than argued for in prose.

That verdict is a real gate. On projects set up for it, the final phase closes only through the
validator, and a material finding is yours to close: fix it and re-review, reject it with a cited
reason, or accept it as a recorded exception. The agent never dispositions one on its own.

**The relationship between the two rounds is the design pattern worth understanding.** The
end-of-project reviewer was written first, from a real project that failed. It enumerated the
ways a research corpus goes wrong. Almost everything added to the day-to-day cycle since then has
been built as prevention for a check the reviewer already carried: the "so what" labels, the
disconfirmation requirement, the recommendation checks, the instrument-validity checks. Each one
uses the reviewer's exact vocabulary, on purpose, so the reviewer reads the record instead of
reconstructing it.

The reviewer is the authority that says no at the end. The in-line checks exist so it rarely has
to.

---

## What it does not protect against

Being straight about this is more useful than a longer feature list.

**Nothing re-reads the original source.** This is the deepest limit in the system. Every check
downstream — the cross-reference, the integrity agent, the synthesis rules, the audit — terminates
at the AI-authored note. The link from that note back to the actual source is asserted once, when
the note is written, and never checked again. A transcription error, a dropped qualifier, or a
quote pulled out of context passes every later gate cleanly, because every later gate is reading
the note.

What has been done about it is narrower than fixing it. Notes now carry a locator and a verbatim
snippet for every figure, and the audit checks that each cited figure has a usable anchor. That
makes the corpus checkable by a person. It does not make it verified, and a passing audit must
never be read as "the notes are faithful." Sampled re-fetching at audit time was considered and
deliberately not built, because it fails on exactly the sources that matter most: the paywalled
ones, the dated ones, the ones that moved.

**The agent has to remember to re-anchor.** After a long, free-ranging conversation about a
source, returning to the protocol is the one reflex nothing can force. The helper makes returning
a single cheap call. It cannot make the agent reach for it.

**Significance can still get elevated in conversation.** The controls fire in the pipeline. A
finding that gets talked up in the chat before the cross-reference runs is not covered by them.
This is a watch item rather than a demonstrated failure.

**Deep quantitative critique is out of scope, on purpose.** Whether a study's method actually
supports its headline is a human's call. The plugin records what it would take to make that call
and routes the question to a person rather than answering it.

---

## Running it in Claude Code versus Cowork

The plugin works on both and detects which one it is in. Three differences are worth knowing.

**Hooks only run in Claude Code.** The gate that physically blocks writes to `outputs/` is a
Claude Code hook, as is the warning before context gets compacted. In Cowork neither runs, and
the outputs gate holds because the audit skill is the only thing that writes deliverables there.
That is a rule the system follows rather than a wall it cannot cross. The audit trail in
`gate-log.md` is what makes it checkable either way.

**Scripts have to live inside the project.** The position helper and the completion validator are
copied into `research/bin/` at setup rather than being referenced from the plugin, because that
is the only path both surfaces can run.

**Cowork gates file deletion per folder.** Approve the prompt once, or anything that needs to
remove a file will fail.

---

## Two shapes of agent, and where the person sits

researcher is one shape of built agent. It is not the only one, and the contrast is worth
drawing, because the choice between them is usually made by accident.

Set researcher beside a productized agent like the Hello Alice AI Advisor. That system runs a
guided session with a business owner: a named advisor works through a structured conversation
about their business. What drives it is a **playbook config**, a single JSON file validated
against a schema engineering owns, stored in White Rabbit and executed by alice-ai's LangGraph
runtime. The people who shape its behavior do so by authoring that config, chiefly through the
system prompt override and the input and output contracts the schema leaves open.

Both are agents. Both have a loop, tools, context, rules, and a quality bar. The architectural
difference is one thing, and everything else follows from it:

> **Where does the responsible person sit relative to the loop?**

**In researcher, the person is inside the loop.** You are at the keyboard while it runs. It can
stop eight enumerated times and hand you the wheel mid-run, because you are there to take it.
The judgment stays yours at the moment it is needed.

**In the advisor, the responsible person is upstream of the loop.** The human in the session is
the customer being served, not the operator. You cannot pause a guided session to ask a small
business owner to adjudicate a source contradiction. They came for advice about their business.
So every judgment call has to be settled in advance, encoded in the config, and frozen before
anyone runs it.

That single difference propagates through the whole design.

| | Plugin shape (researcher) | Product shape (the AI Advisor) |
|---|---|---|
| **Who owns the base harness** | Somebody else's. Claude Code and Cowork supply the loop, tools, and permissions. | Built in-house. The team owns the runtime as well as the behavior. |
| **Who is in the session** | The operator, who is also accountable for the output | A customer, who is the person being served |
| **When judgment is encoded** | At runtime, interactively, at the moment it is needed | At authoring time, then frozen |
| **What you author** | Skills, reference guides, hooks, and templates in markdown, versioned as a plugin | One JSON file against a schema you do not own |
| **How reach is granted** | Broad. Web search, the file system, scripts, whatever the surface allows. | Narrow and curated. Registered context sources only, with a rule against inventing anything outside them. |
| **What the permission surface is** | Real. Tool approvals, a hook that blocks writes, an eight-item stop list. | None the customer sees. The constraints live in the prompt and the schema. |
| **How a failure reaches you** | You watch it happen | You find it in a transcript afterward |

Neither is the better architecture. They answer different questions. A plugin is right when the
person running it is the person accountable for the result, and it buys you the ability to stop
and ask. A product is right when the person running it is a customer, and the price is that
every call has to be made before anyone shows up.

**The thing they converge on is worth noticing.** Both refuse to make the final judgment, and
both say so explicitly. researcher's stop list ends at promotion to `outputs/`, because that is
the irreversible one. The advisor's grading rubric never scores whether a recommendation was
*correct*, because that is the owner's call and not the prompt's. Two very different systems,
built by different people for different users, drew the same line in the same place. That line
is not a limitation of either architecture. It is the thing both were built to protect.

**One clarification, because the shorthand misleads.** This is not a difference between
organizations or repositories. Hello Alice's own marketplace carries plenty of plugin-shaped
agents built exactly like researcher, with the same structure and the same stop-and-ask
behavior. The distinction here is between two shapes an agent can take, and the question that
picks between them is always the same: **when this thing hits a judgment call, is the person who
should make it going to be in the room?**

---

## How this keeps getting better

A harness that does not learn is just a checklist.

When something goes wrong, the fix is not to correct that output. It is to ask which part of the
system let it through. Was a rule missing? Did the durable record fail to carry something? Was a
check running too late to matter? Was the requirement written in a way that one surface satisfied
and another did not?

Two things make that loop real here.

**An evaluation set** runs the plugin against fixed scenarios, including adversarial ones built
to provoke the specific failures above, and scores the runs against a rubric. It surfaces new
findings nearly every time it runs, and that is the tool working rather than a sign of breakage.

**A register of known limits** records what is still exposed, in what way, and on what evidence.
It distinguishes what is enforced by code from what has been observed in real runs from what is
merely a deduced possibility. That distinction matters, because the honest answer to "is this
safe?" is different for each.

Both live in [MAINTAINERS.md](MAINTAINERS.md) and the eval pack.

---

## Where to look next

- **Exact ownership, current limit status, version history** — [MAINTAINERS.md](MAINTAINERS.md)
- **What changed and when** — [`know-researcher/CHANGELOG.md`](../../know-researcher/CHANGELOG.md)
- **How a specific step actually works** — the skill file in `know-researcher/skills/`. When this
  document and a skill disagree about mechanics, the skill is right and this document is wrong.
- **Working on the plugin** — [`know-researcher/AGENTS.md`](../../know-researcher/AGENTS.md)
- **Why a particular design went the way it did** — the design records in this folder
