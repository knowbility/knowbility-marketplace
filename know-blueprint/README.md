# know-blueprint

**Turn how you actually work into a written process — with every step marked for where automation
is safe and where a person has to stay in the loop.**

Ask someone how they do a thing they do every week and you get the idealized version. The
micro-steps, the workarounds, the "oh, except when" — those stay in their head, because nobody can
write them down from memory. That is why the procedure for the work your organization is best at is
usually the procedure nobody has written.

know-blueprint fixes that by interviewing you. It walks you through the most recent real run of the
process, asks the questions that surface the tacit detail, and writes a structured **Blueprint**:
trigger, steps, decision criteria, exception paths, who can approve, what "done" looks like, and
what a bad run costs.

```
/know-blueprint:guide       not sure which of these you need — start here
/know-blueprint:discover    you can't yet name your processes
/know-blueprint:capture     model one process you already run
/know-blueprint:design      model one you've been handed but nobody runs yet
```

## Install

```
/plugin marketplace add knowbility/knowbility-marketplace
/plugin install know-blueprint@knowbility
```

## Setup

**None.** No API key, no account, no command-line tool, no installed dependency. It reads and
writes Markdown files and nothing else, so it behaves identically in Claude Code and in Claude
Desktop.

Blueprints save to a `blueprints/` folder in whatever project you run the capture in. To put them
somewhere else, copy `templates/CLAUDE.md` into your project root and set `blueprints_dir`.

## The four jobs

The dividing line is whether the process **already exists**: capture is for work you run, design is
for work you don't yet.

| | |
|---|---|
| **`discover`** | A short sweep that surfaces your recurring work into a **Process Inventory** — candidates in your own words, plus which few to tackle first. For when the honest answer to "which process?" is "I'm not sure what I'd even call them." |
| **`capture`** | Model **one** process you already run. Quick mode (~15 min) gets the trigger, main steps, outputs, and a first-cut rating per step. Deep mode (~45-60 min) adds decision criteria, exception paths, approval authority, evidence, timing, and risk. |
| **`design`** | Model a process you've been **handed but nobody runs yet**. There is no real run to extract, so it *proposes* a flow — built only from your stated goal, your real constraints, and the nearest process you actually run, never from generic best practice — and labels every step as proposed, not observed. |
| **`guide`** | Explains the four jobs and routes you to the right one. Or just ask "how does this work?" |

A designed process graduates to a captured one once you have run it a few times. Design proposes,
reality corrects, capture records.

## Every step gets rated

- **Automate** — repetitive, low-risk, reversible, easy to validate.
- **Monitor** — it can proceed, but a person watches through alerts, sampling, or periodic audit.
- **Human** — the step affects money, compliance, legal exposure, customer trust, safety, or
  brand-sensitive judgment. A person decides, every time.

One question decides placement: *if this step were done wrong with no review, what would happen?*

Checkpoints are deliberately sparse. Review everywhere produces reviewer fatigue, and a process
that pauses at every step is one people route around.

### Accessibility judgment defaults to Human

Any step whose output is an accessibility determination — is this image decorative, does this alt
text convey the right thing, is this reading order correct, does this control have an accessible
name that makes sense to someone using it — is rated **Human** by default, and the Blueprint says
why. A tool can find a missing alt attribute. Whether the alt text is *right* is a judgment about
what a person needs, and no automated pass settles it.

You can overrule that default. The Blueprint records that you did, and what the rating would
otherwise have been.

## What this is not

**The ratings are a reviewed draft, not a safety certification.** They come out of one interview
with one person. They hold until the person who owns the risk has gone through them one at a time
and said which ones they would move. Until that happens the Blueprint's status line says so, and
it will not hand you an automation plan built on unvalidated ratings without recording that you
asked for it anyway.

**It never invents.** When it does not know where data comes from, who has authority, or what a
threshold is, it writes that down as an open question instead of filling the gap with something
plausible. It also will not quietly sharpen a vague answer into a precise one — if you said "above
$5k," the Blueprint says "above $5k," and the question of what happens exactly at $5k goes to open
questions where someone can answer it.

**It documents and rates; it does not build the automation.** What you get is the modeling layer —
the thing you need before wiring any process to an agent, and the thing you need anyway to train
somebody new.

**A Blueprint is not a conformance evaluation, a VPAT, or an accessibility statement**, and
capturing a remediation process tells you nothing about whether any artifact that process produced
conforms to anything.

## What hasn't been exercised here

This plugin was ported into this marketplace and its files were verified, but **no interview has
been run end to end in this repository**. The disciplines described above are enforced by the
skills' own rules; the gate definitions that test them are in
`dev/know-blueprint/eval/`, which also explains why they cannot be run here yet.
