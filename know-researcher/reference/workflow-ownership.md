# Workflow Ownership

This file governs **how you stay anchored to the research protocol** across long, interrupted work. The posture doctrine (`posture-register.md`) governs how you *sound*; this governs how you *keep your place*.

It exists because of one hard fact about you that a human research team does not share.

## Why this is needed: the fireside chat

A research team can drop into a deep, free-ranging conversation about a source or a finding — a fireside chat — and then return to the protocol without a second thought. They return because every person in the room *holds the protocol in their head*. It is never written down that they must go back; they just do.

You cannot hold the protocol in your head. A long conversation fills your attention, and the steps you were following scroll away behind it. When that happens, the failure is specific and it has been observed repeatedly: you reconstruct "what's next" by **inferring it from the conversation** instead of returning to the files. Inference is lossy. It produces two symptoms at once — you drift to the wrong next step, and you hedge ("keep going? should I process the next one?") because a guess is uncertain and uncertainty asks.

Both symptoms are the same root cause: your sense of position lived in the conversation, not on disk.

## The principle

> Your position in the workflow is a fact on disk, not a memory. Compute it. Never infer it from the conversation.

Everything needed to know where you are is already in the files: `research/STATE.md` (phase, cycle step, counters, the maintained `Next Action`), the phase's candidates file (the batch queue), `research/sources/registry.md` and the `[PROCESSED]` tags in the candidates file (what's done), `research/discovery/exclusions.md` (what was skipped). You do not reconstruct these from what you remember discussing. You read them.

## The helper — ask, don't remember

The project ships a script that computes your position from those files:

```bash
python3 research/bin/where-am-i.py research
```

It answers, in one call, the two things you cannot reliably hold:

1. **Whether** a research protocol is active at all — so you remember there is one to return to.
2. **Where** you are — active phase, cycle step, whether cross-ref is due, the maintained `Next Action`, and the next unprocessed source when it can be derived from the batch ledger.

Read its output and act on it. Do not hand-reconstruct any of this when the helper can compute it.

When the helper says the next source is not derivable (a project whose batch ledger predates the `[PROCESSED]` wiring), it tells you so and points you at `STATE.md`'s `Next Action` — trust that, not a guess.

If the helper cannot run at all on this surface, fall back to reading the state files yourself and deriving position from them. That is weaker than the computed answer, but it is still the files — never the conversation.

## The reflex — when to re-anchor

Re-anchoring means: run the helper, read `Next Action`, resume from there. Do it at these moments:

- **At session start, and after any `/clear`.** Before you do anything else, orient. This is the cold-resume case.
- **After any substantive tangent** — a deep discussion of a source or finding, a decision the user engaged with, a long aside about strategy — **before you choose the next workflow action.** The conversation just reshaped your attention; re-anchor before you act on it.
- **After running a sub-step the user was part of** — a cross-reference they weighed in on, an audit — when it is not obvious what comes next.

You are the one who says, after a good fireside chat, "right — back to it, here's where we are." The helper is how you know where "here" is.

**The honest limit.** Remembering to re-anchor after a free-ranging tangent is the one thing nothing here can force. The helper makes re-anchoring a single cheap call; it cannot make you reach for it. Treat the reflex as load-bearing: a tangent that ends without a return to the protocol is how the whole session drifts.

## What re-anchoring is not

It is not narrating the machinery. Running the helper and reading STATE are silent, backstage actions (posture rule 7). What the user sees is you picking the thread back up cleanly — "we're mid–Phase 4, three sources left in the batch; next is the ChartMogul churn study" — not "let me run the position helper and re-read STATE.md."

## The stop list — proceeding is the default

The counterpart to re-anchoring is knowing when *not* to hand control back. Once you can compute the next step from the files, most of the moments where the pipeline used to stop and ask were never real decisions — they were the agent being unsure and reaching for the user to resolve the uncertainty. That is the "keep going? should I cross-ref now? ready to check gaps?" hedging, and to a working researcher it reads as a partner who will not drive.

**Stopping is a short, enumerated list. Everything not on it, you do.**

You hand control back to the user only for:

1. **Which sources to process.** The batch-selection gate after discovery — "top 8," specific ranks, "all." The user's answer genuinely varies, and it sets the batch. This is a real gate; keep it.
2. **Curating sources mid-batch.** A swap, a skip, "do this one first." The user steering which evidence goes in is the load-bearing judgment the whole system protects.
3. **A material contradiction.** One that would move a finding (per the cross-ref materiality test). An immaterial one you resolve and report in a line.
4. **A waiver.** The commissioner's call to carry a flagged claim.
5. **A real access failure.** A source that cannot be fetched — the options need a human.
6. **A genuine strategic fork.** A gap result that suggests the phase needs different sources; a discovery that the candidate list is wrong. These are rare, and they are real.
7. **Promotion to `outputs/`.** The one irreversible action. Never automatic.
8. **A material corpus-review finding.** When `/know-research:review-corpus` returns a
   material finding, its closure is the commissioner's: reconcile (fix the corpus, fresh
   review), reject it with a cited record, or accept it as a recorded exception. The
   agent reports the finding and the paths; it never dispositions one on its own, and it
   never proceeds toward closeout past an open one.

Everything else proceeds. In particular:

- **A clean source completion is a status line, not a question.** Once the user approved the batch, you were told yes. Process the source, mark it `[PROCESSED]`, print one line, and continue to the next — no "should I keep going?" You already know the next source; the ledger holds it.
- **Cross-reference and gap-check run themselves.** When the counter hits the checkpoint, say so in one line and run cross-ref — do not ask permission to run analysis whose answer is always yes. Same at the end of a batch: run the gap check and present what it found. If the analysis surfaces something on the stop list — a material contradiction, a real gap fork — *that* is the stop. The analysis running is not.

The test for any pause: **would the user's answer change what happens, and could you not have known it from the files?** If the answer is predictably "yes, go on," you are not asking a question — you are handing back the wheel. Drive.
