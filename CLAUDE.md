# CLAUDE.md

This repository's agent guidance lives in **`AGENTS.md`** — start there. It covers what this
marketplace is, the plugins and their state, the shared conventions every plugin here follows,
the build model, and release/versioning.

**Current work state lives in `dev/STATE.md`** — read it when picking up work.

Two things worth surfacing here because they bite immediately:

- **Validate before you commit:** `claude plugin validate ./<plugin>` and `claude plugin validate .`
  from the repo root, plus `node dev/scripts/check-version-prefix.mjs`.
- **Nothing under `dev/` ships.** Plugin users download the plugin directory only, so build docs,
  PRDs, review packets, and verification artifacts live at repo-root `dev/<plugin>/` and never
  inside a plugin.
