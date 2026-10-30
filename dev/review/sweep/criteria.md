# De-branding sweep: criteria

Four Claude Code plugins were forked from two other organizations' private plugin marketplaces,
with clearance, and are being migrated into a third organization's marketplace. The requirement is
that the migrated plugins carry **no identifying or operational detail from either source
organization**, and that nothing in them is a secret or a real person's data.

Your job is to find what is still there.

## What counts as a finding

1. **Identity** — a source organization's name, product name, brand, internal team name, or an
   employee or contractor's name.
2. **Location** — an internal or non-public hostname, deployment URL, wiki or document identifier,
   repository path, tracker site, board, project key, sprint, or epic.
3. **Secrets or credentials** — anything key-shaped, token-shaped, or password-shaped, and any
   real commit sha, account id, tenant id or cloud id.
4. **Real people's data** — an email address, display name, handle, or avatar belonging to a real
   person rather than a placeholder.
5. **Operational assumption** — a default, a code path, a documented workflow, or a reference file
   that only makes sense for one source organization's product or process, and that would mislead
   or silently misbehave for a different organization. This class is the subtlest and the most
   important: it does not look like a leak, it looks like a feature.

## What does NOT count

- `example.com`, `example.org`, `localhost`, `127.0.0.1`, RFC-reserved values.
- Obviously fictional placeholder names in a document that declares itself a fixture or a worked
  example.
- Third-party public URLs (a vendor's documentation, an API console, a schema registry).
- Generic industry or technical vocabulary that merely happens to resemble a brand.
- The destination organization's own name and domain. That is correct and expected.

## What you are given, and its limits

- `candidates.md` — every line in all four plugins matching any of a set of broad extraction
  patterns, with the patterns themselves listed so you can judge their coverage. 355 lines from 66
  files.
- `inventory.md` — every file in all four plugins with its size, and whether the extraction
  scanned it.

The full trees are roughly 1.26 MB of text and do not fit in this packet, so you are seeing an
extraction rather than the source. **Treat the extraction itself as the primary thing under
review.** An extraction can only find what its patterns describe, so the most valuable finding you
can produce is a class of identifier these patterns would miss entirely.

## Report

1. **Confirmed findings** — cite `file:line` from `candidates.md` and say which class it falls in
   and why it is not a placeholder.
2. **Missed pattern classes** — identifier classes the extraction patterns in `candidates.md`
   cannot catch. Be concrete: name the pattern you would add and what it would catch. Consider
   especially things that are identifying without containing a proper noun, a digit, or an `@`.
3. **Files you would need to read** — from `inventory.md`, name the specific files where a
   leftover of class 5 (operational assumption) would most plausibly hide and be invisible to any
   line-level extraction, and say what you would look for in each.
4. **Coverage** — state plainly what you could and could not assess from this packet. Do not
   describe the tree as clean; you have not seen the tree.

Rank by severity. A secret or a real person's data outranks a brand name in a comment. If you find
nothing in a class, say so explicitly rather than omitting the class.
