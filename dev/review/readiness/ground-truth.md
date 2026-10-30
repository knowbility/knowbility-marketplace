# Ground truth

Mechanically extracted from the repository. Every invocable name, version, and shipped
path that actually exists. Check the documentation against this, not against itself.

## Marketplace catalog

- marketplace name: `knowbility`  (so install syntax is `<plugin>@knowbility`)
- owner: Knowbility
- registered plugins: 4

  - `know-product-spec` from `./know-product-spec`
  - `know-qa-agent` from `./know-qa-agent`
  - `know-security` from `./know-security`
  - `know-photo-generator` from `./know-photo-generator`

## know-qa-agent

- manifest name: `know-qa-agent`
- version: `0.1.0`
- install command: `/plugin install know-qa-agent@knowbility`

**Skills (directory → frontmatter `name:` → how a user types it):**

- `skills/check/` → `name: know-qa:check` → user types **`/know-qa:check`**
- `skills/gen/` → `name: know-qa:gen` → user types **`/know-qa:gen`**
- `skills/guide/` → `name: know-qa:guide` → user types **`/know-qa:guide`**
- `skills/help/` → `name: know-qa:help` → user types **`/know-qa:help`**
- `skills/init/` → `name: know-qa:init` → user types **`/know-qa:init`**
- `skills/monitor/` → `name: know-qa:monitor` → user types **`/know-qa:monitor`**
- `skills/pair/` → `name: know-qa:pair` → user types **`/know-qa:pair`**
- `skills/report/` → `name: know-qa:report` → user types **`/know-qa:report`**
- `skills/run/` → `name: know-qa:run` → user types **`/know-qa:run`**
- `skills/start/` → `name: know-qa:start` → user types **`/know-qa:start`**

**Shipped top-level entries:**

- `.claude-plugin/`
- `CHANGELOG.md`
- `README.md`
- `agents/`
- `docs/`
- `engine/`
- `examples/`
- `harness/`
- `hooks/`
- `reference/`
- `skills/`

## know-product-spec

- manifest name: `know-product-spec`
- version: `0.1.0`
- install command: `/plugin install know-product-spec@knowbility`

**Skills (directory → frontmatter `name:` → how a user types it):**

- `skills/clarify/` → `name: know-spec:clarify` → user types **`/know-spec:clarify`**
- `skills/decompose/` → `name: know-spec:decompose` → user types **`/know-spec:decompose`**
- `skills/discovery/` → `name: know-spec:discovery` → user types **`/know-spec:discovery`**
- `skills/file/` → `name: know-spec:file` → user types **`/know-spec:file`**
- `skills/groom/` → `name: know-spec:groom` → user types **`/know-spec:groom`**
- `skills/help/` → `name: know-spec:help` → user types **`/know-spec:help`**
- `skills/interview/` → `name: know-spec:interview` → user types **`/know-spec:interview`**
- `skills/start/` → `name: know-spec:start` → user types **`/know-spec:start`**
- `skills/ui-review/` → `name: know-spec:ui-review` → user types **`/know-spec:ui-review`**
- `skills/write/` → `name: know-spec:write` → user types **`/know-spec:write`**

**Shipped top-level entries:**

- `.claude-plugin/`
- `CHANGELOG.md`
- `README.md`
- `reference/`
- `skills/`
- `tools/`

## know-security

- manifest name: `know-security`
- version: `0.1.0`
- install command: `/plugin install know-security@knowbility`

**Skills (directory → frontmatter `name:` → how a user types it):**

- `skills/security-audit/` → `name: security-audit` → user types **`/know-security:security-audit`**
- `skills/security-init/` → `name: security-init` → user types **`/know-security:security-init`**
- `skills/security-review/` → `name: security-review` → user types **`/know-security:security-review`**
- `skills/security-sweep/` → `name: security-sweep` → user types **`/know-security:security-sweep`**

**Commands (path → how a user types it):**

- `commands/know-security/audit.md` → user types **`/know-security:audit`**
- `commands/know-security/init.md` → user types **`/know-security:init`**
- `commands/know-security/review.md` → user types **`/know-security:review`**
- `commands/know-security/sweep.md` → user types **`/know-security:sweep`**

**Shipped top-level entries:**

- `.claude-plugin/`
- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `agents/`
- `commands/`
- `reference/`
- `scaffold/`
- `skills/`

## know-photo-generator

- manifest name: `know-photo-generator`
- version: `0.1.0`
- install command: `/plugin install know-photo-generator@knowbility`

**Skills (directory → frontmatter `name:` → how a user types it):**

- `skills/photo-generate/` → `name: photo-generate` → user types **`/know-photo-generator:photo-generate`**
- `skills/photo-setup/` → `name: photo-setup` → user types **`/know-photo-generator:photo-setup`**

**Commands (path → how a user types it):**

- `commands/know-photo/generate.md` → user types **`/know-photo:generate`**
- `commands/know-photo/setup.md` → user types **`/know-photo:setup`**

**Shipped top-level entries:**

- `.claude-plugin/`
- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `commands/`
- `reference/`
- `scripts/`
- `skills/`

## Repository root (not shipped to plugin users)

- `.DS_Store`
- `.ai/`
- `.claude-plugin/`
- `.github/`
- `.gitignore`
- `AGENTS.md`
- `CLAUDE.md`
- `LICENSE`
- `README.md`
- `dev/`
- `know-photo-generator/`
- `know-product-spec/`
- `know-qa-agent/`
- `know-security/`

