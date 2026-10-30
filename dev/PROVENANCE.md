# Provenance

An internal record of where each plugin in this marketplace came from. This file lives under
`dev/`, so it is never downloaded into a plugin user's installed cache.

Kelsey Ruger confirmed clearance to migrate all four plugins before any work began.

| Plugin here | Originated in | Original license | Migrated |
|---|---|---|---|
| `know-product-spec` | a private company marketplace | proprietary, cleared for this move | pending |
| `know-qa-agent` | the same private company marketplace | proprietary, cleared for this move | pending |
| `know-photo-generator` | Kenzie Creative marketplace (Kelsey Ruger) | MIT | pending |
| `know-security` | Kenzie Creative marketplace (Kelsey Ruger) | MIT | pending |

Each plugin's own `CHANGELOG.md` records its 0.1.0 entry point here and what was removed from the
original, without naming source-organization internals.

## Why this file exists and why it is here

Forking code with permission is normally recorded. The migration requirement is that the *shipped
plugins* carry no identifying or operational detail from either source organization, which is a
different thing from the repository keeping an honest internal note of origin. Putting the record
under `dev/` satisfies both.

If Knowbility would rather the repository carry no source-organization names at all, delete this
file; the clearance record then lives only outside the repo.
