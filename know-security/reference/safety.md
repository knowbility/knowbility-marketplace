# Safety

This document is short because the plugin made it short.

## The boundary

**Nothing in this plugin sends a request to the system under review.** No probing, no
credentials, no crafted input, in any code path. The gate reads source and reasons about it;
the reviewer agent reads source and reasons about it.

That much is enforced **by absence**, which is the strongest form available: there is no HTTP
client, no request grammar in any config file, and no way to express a payload. You cannot
disable what does not exist.

### The one honest exception, stated rather than hidden

This document used to say "nothing in this plugin touches a network… in any code path." That
was **false**, and an external review caught it: the `DEP-01` check instructs the agent to run
the project's own dependency auditor — `npm audit`, `pip-audit`, `bundle audit` — and those
contact a package registry unless forced offline. A tool whose subject is unverified claims
cannot carry one in its own safety document.

The accurate statement is narrower and it is the one that matters:

> **Nothing here contacts the system under review.** The only network access is an ecosystem
> dependency auditor talking to its own package registry, invoked by name, doing what running
> it by hand would do.

Two rules follow, and they are binding:

- **Prefer the offline path when the auditor has one** (`npm audit --offline`, a local advisory
  database). When it does not, or the offline run fails, say so in the report rather than
  silently reaching the network.
- **The auditor is never given a credential**, never pointed at a private registry by this
  plugin, and never run against anything but the project's own manifest.

If a deployment forbids outbound traffic entirely, drop `deps` from the lens list. The report
then states that `DEP` did not run — which is the degrade this plugin applies to every absent
tool, and it is the correct behavior rather than a limitation.

## Why there is no prober

An active prober was designed and cut before implementation. The reasoning, kept here
because it is the kind of decision that gets quietly reversed:

**A probe that finds nothing reports "no vulnerabilities found."** That sells absence of
evidence as evidence of security, and it is the most flattering lie available in this
domain. Every invariant in 0.1.0's scope is establishable by reachability analysis plus a
human verdict, so the capability bought little and cost a great deal: an allowlist, a
consent model, principal handling, evidence redaction, and a genuine legal question about
sending crafted requests at hosts.

Cutting it removed all of that and took the blast radius to zero.

## If a prober is ever added

`reference/adversarial-list.md`, Class G, holds the four questions it must answer *before*
it is built rather than after. Summarized:

1. A probe finding nothing must never render as "secure."
2. A probe blocked by a WAF or rate limiter must never render as "protected."
3. A probe holding an admin credential proves nothing and risks everything.
4. An agent must not write its own probe findings into the register.

And the structural rules that would apply: default-deny allowlist shipped **empty**, not
even localhost — a forwarded port can reach production. Read-only always, with no
`--allow-write` escape hatch, because security probing has no legitimate need to mutate. No
exploit payloads: every invariant in scope is provable with a legitimate request bearing a
legitimate credential. Never store what it sees, since a successful cross-subject read means
holding another subject's data. And it must be a **separate executable from the checker** —
the checker runs in CI on every commit and must never be able to reach a network because of
a bug in something else.

## Credential hygiene

Binding on the reviewer agent and on every skill here: never read, print, echo, or copy the
**value** of a credential. If one is found in source, report the path and the fact of it and
let the human move it.

Findings are committed to the repository, so they name the property that fails — *"surface S
returns another subject's row to an unscoped query"* — and never the steps to exploit it.

## What this is not

There is no hook-based enforcement in this plugin. The sibling QA plugin rejects hooks as
false assurance and it is right; here the risk is inverted and worse, because a hook that
fires automatically is a security check running without anyone asking for it. The gate is a
script someone or something runs deliberately, and `honest-limits.md` says plainly where
each mechanism stops.
