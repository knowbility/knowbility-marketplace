# Provenance

An internal record of where each plugin in this marketplace came from, and of the licensing
reasoning behind the root `LICENSE`. This file lives under `dev/`, so it is never downloaded into a
plugin user's installed cache.

Kelsey Ruger confirmed clearance to migrate every plugin here before any work began.

| Plugin here | Originated in | Original license | Arrived as | Status |
|---|---|---|---|---|
| `know-product-spec` | a private company marketplace | proprietary, cleared for this move | 0.1.0 (reset) | Migrated, pushed |
| `know-qa-agent` | the same private company marketplace | proprietary, cleared for this move | 0.1.0 (reset) | Migrated, pushed |
| `know-photo-generator` | Kenzie Creative marketplace (Kelsey Ruger) | MIT | 0.1.0 (reset from 1.2.0) | Migrated, pushed |
| `know-security` | Kenzie Creative marketplace (Kelsey Ruger) | MIT | 0.1.0 (reset) | Migrated, pushed |
| `know-blueprint` | Kenzie Creative marketplace (Kelsey Ruger) | MIT | 0.1.0 (reset) | Migrated, pushed |
| `know-researcher` | Kenzie Creative marketplace (Kelsey Ruger) | MIT | **1.18.0 (kept)** | Migrated, committed |

Each plugin's own `CHANGELOG.md` records its arrival entry and what was removed from the original,
without naming source-organization internals.

**The two version decisions, since this is where someone will come looking.**
`know-photo-generator` reset from 1.2.0 because its brand-style library was genuinely rebuilt and it
is not a continuation of the original's line. `know-researcher` kept 1.18.0 because nothing about
the research system was rebuilt, and 0.1.0 on a twelve-skill system with eighteen releases behind it
would misrepresent what a first-time reader is installing. Both decisions are recorded in the
plugins' own changelogs; this table exists so the inconsistency reads as deliberate rather than
sloppy.

## The MIT attribution line — decided, and why

The root `LICENSE` reads `Copyright (c) 2026 Knowbility, Inc.` and carries no retained notice from
either source. That is deliberate.

MIT requires that its copyright notice travel with copies of the covered work. Four of these six
plugins were MIT, so the question is real — but **Kelsey Ruger is the copyright holder of those
four**, and a copyright holder relicensing their own work is not a licensee retaining someone
else's notice. He confirmed clearance, and he is on Knowbility's board. The other two were
proprietary rather than MIT, so there was no MIT notice to retain in the first place; they moved
under the same clearance.

So a single Knowbility copyright is correct and sufficient, and adding a courtesy attribution line
would imply a third-party obligation that does not exist. This is recorded here rather than left
unstated so the question gets settled once. It rests on one fact — that Kelsey held the original
copyright — which is his to confirm and which he has.

This is a drafting judgment, not legal advice. If Knowbility's counsel wants a different notice,
the file to change is the root `LICENSE` and the six `license` fields in each
`.claude-plugin/plugin.json` stay `MIT` regardless.

## Why this file exists and why it is here

Forking code with permission is normally recorded. The migration requirement is that the *shipped
plugins* carry no identifying or operational detail from either source organization, which is a
different thing from the repository keeping an honest internal note of origin. Putting the record
under `dev/` satisfies both.

**Kept deliberately, on maintainability grounds.** Six plugins now arrive from two sources with
different original licenses, two different version decisions, and one plugin whose pre-fork history
is preserved verbatim in its changelog. Without this table, the answers to "why is this one 1.18.0,"
"can this file be relicensed," and "who cleared this" live only in one person's memory. That is the
opposite of maintainable for a repository being handed to an organization. It costs one short file
that no plugin user ever sees.
