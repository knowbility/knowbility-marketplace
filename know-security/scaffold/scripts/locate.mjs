#!/usr/bin/env node
/**
 * The locator. Produces candidates and a work list. **Never a verdict.**
 *
 * This file is the direct descendant of an `enumerate.mjs` that tried to build a *complete
 * denominator* of every surface and store, so that a coverage gate could report "N of M
 * surfaces are guarded." Two external reviews found the same defect repeatedly: regex over
 * arbitrary source produces a plausible sample, not a complete set, so every gap in the
 * patterns became a false claim about coverage.
 *
 * The patterns were never the problem. The **contract** was. So the contract changed:
 *
 *   - Nothing here decides anything. No severity, no pass, no fail, no coverage.
 *   - Nothing here is written to disk. There is no generated file to trim, no hash to
 *     forge, and no state to tamper with.
 *   - What it could not read is emitted as `unread`, which is an **assignment for the
 *     reviewer** rather than a hole in a claim. Incompleteness is now the output.
 *
 * That is the whole difference between a lie and a map. The sibling QA plugin states the
 * same rule as "install posture, don't script judgment": its scripts compute exact contrast
 * ratios and emit measurements with `needs-review` markers, never severities. The agent
 * judges. This does the same for source code.
 *
 *   node security/scripts/locate.mjs           human-readable summary
 *   node security/scripts/locate.mjs --json    the full map, for an agent
 *
 * Zero dependencies. Writes nothing. Never touches a network.
 */

import { realpathSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { filesMatching, readOr, readJsonOr, lineAt, stripComments } from './lib/scan.mjs';

const SCHEMA = 'knowbility.security.locate/1';

/**
 * Cap per sink category so the output stays readable. Truncation is always REPORTED — a
 * silent cap reads as "that's all of them," which is the same lie in miniature that this
 * whole file was rewritten to stop telling.
 */
const MAX_PER_CATEGORY = 150;

/**
 * HTTP route registration idioms.
 *
 * Every pattern requires a **literal path argument**. Without it, `cache.get(target)` and
 * `labels.get(revision)` register as routes — both appear in the first real codebase this
 * ran against, and a map lookup reported as an endpoint is the kind of noise that gets a
 * security tool switched off inside a week.
 */
const HTTP_METHOD = '(get|post|put|patch|delete|head|options|all)';
const ROUTE_PATTERNS = [
  {
    name: 'method-call',
    re: new RegExp(`\\b([A-Za-z_$][\\w$]*)\\s*\\.\\s*${HTTP_METHOD}\\s*\\(\\s*['"\`](/[^'"\`]*)['"\`]`, 'gi'),
    methods: (m) => [m[2].toUpperCase()],
    path: (m) => m[3],
  },
  {
    // Property order is not fixed in real code, so match either arrangement.
    name: 'route-object',
    re: /\.route\s*\(\s*\{(?=[^}]*method\s*:\s*['"`]([A-Z]+)['"`])(?=[^}]*(?:url|path)\s*:\s*['"`](\/[^'"`]*)['"`])/gis,
    methods: (m) => [m[1].toUpperCase()],
    path: (m) => m[2],
  },
  {
    name: 'next-app-route',
    re: /export\s+(?:async\s+)?(?:function|const)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g,
    methods: (m) => [m[1]],
    path: (_m, file) => `/${file.replace(/^app\//, '').replace(/\/route\.\w+$/, '')}`,
    fileMatch: /(^|\/)app\/.*\/route\.(ts|tsx|js|jsx|mjs)$/,
  },
  {
    name: 'trpc',
    re: /\b([A-Za-z_$][\w$]*)\s*:\s*[\w.]*\.(query|mutation)\s*\(/g,
    methods: (m) => [m[2] === 'query' ? 'QUERY' : 'MUTATION'],
    path: (m) => `/${m[1]}`,
  },
  {
    name: 'graphql-resolver',
    re: /\b(Query|Mutation)\s*:\s*\{([^}]*)\}/gs,
    expand: (m) =>
      [...m[2].matchAll(/^\s*([A-Za-z_$][\w$]*)\s*[:(]/gm)].map((f) => ({ method: m[1].toUpperCase(), path: `/${f[1]}` })),
  },
  {
    // Python decorators, so a Flask or FastAPI project is not silently empty.
    name: 'python-decorator',
    re: /@\w+\.(route|get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']([^)]*)\)/g,
    // EVERY method in the list, not just the first. `methods=['GET','POST']` previously
    // yielded only GET, silently dropping a write path out of the map.
    methods: (m) => {
      if (m[1] !== 'route') return [m[1].toUpperCase()];
      const decl = m[3].match(/methods\s*=\s*[[(]([^\])]*)[\])]/);
      if (!decl) return ['GET'];
      const found = [...decl[1].matchAll(/["'](\w+)["']/g)].map((x) => x[1].toUpperCase());
      return found.length ? found : ['GET'];
    },
    path: (m) => m[2],
  },
];

/** Non-HTTP data paths — where "we checked the API" stops being enough. */
const JOB_PATTERNS = [
  { name: 'cron', re: /\b(?:cron|schedule|scheduleJob)\s*\(\s*['"`]([^'"`]+)['"`]/g, kind: 'job', label: (m) => `cron ${m[1]}` },
  // Queue consumers only. A bare `.on('event', …)` is an EventEmitter listener, and matching
  // it filled the map with UI and lifecycle handlers.
  { name: 'queue-consumer', re: /\.(?:process|consume|subscribe)\s*\(\s*['"`]([\w:.-]+)['"`]\s*,\s*(?:async\s*)?\(/g, kind: 'job', label: (m) => `consumer ${m[1]}` },
  { name: 'cli-command', re: /\.command\s*\(\s*['"`]([^'"`]+)['"`]/g, kind: 'cli', label: (m) => `command ${m[1]}` },
];

/**
 * Dangerous sinks — where a value stops being data and starts being an instruction, or
 * leaves the system.
 *
 * These are DELIBERATELY loose. A sink is a place worth reading, not a finding: the reviewer
 * traces each one's origin before classifying anything, per the finding contract's confirm
 * procedure. Being loose here is cheap; being narrow would hide work.
 *
 * `check` maps each category to the check IDs in the reviewer's catalog, so the work list
 * arrives pre-routed.
 */
const SINK_PATTERNS = [
  // SQL splits into two signals, because "a query happens here" is not interesting and
  // "a query is BUILT here" is. A SQLite-backed app had 177 `.prepare()` calls, essentially
  // all of them correctly parameterized with `?`; reporting all 177 buries the two that
  // interpolate. `.prepare(` still has to be in the name list at all — better-sqlite3 and
  // node:sqlite are entire data layers that expose none of the `.query`/`.raw` names, and
  // omitting it reported zero SQL sinks for that same app.
  //
  // sql-dynamic: a query-ish call whose argument is interpolated or concatenated.
  { category: 'sql-dynamic', check: 'INJ-01', re: /\.(?:query|execute|exec|raw|unsafe|queryRaw|executeRaw|prepare)\s*\(\s*[^)]{0,400}?(?:\$\{|["'`]\s*\+|\+\s*[A-Za-z_$])/gi },
  // sql-escape-hatch: the methods that exist specifically to bypass the safe path. Always
  // worth reading, interpolated or not — an escape hatch in a codebase that parameterizes
  // everywhere else is the Compare-with-neighbours signal (INJ-08).
  { category: 'sql-escape-hatch', check: 'INJ-08', re: /\.(?:raw|unsafe|literal|whereRaw|havingRaw|joinRaw|orderByRaw|queryRaw|executeRaw)\s*\(|\bsql\s*`/gi },
  // The lookbehind is load-bearing. `\bexec\s*\(` matches `/^([A-Z_]+):/.exec(msg)` — a
  // RegExp method call, not a shell — which produced three false positives out of four on
  // first contact. Shell exec is a bare or namespaced call; regex exec is always a method on
  // a value, so "not preceded by a dot" separates them.
  { category: 'shell', check: 'INJ-02', re: /(?<![.\w])(?:exec|execSync|execFile|execFileSync|system|popen|Popen|check_output)\s*\(|\bchild_process\b|\bspawn\s*\([^)]*shell\s*:\s*true|shell\s*=\s*True/g },
  { category: 'dynamic-eval', check: 'INJ-03', re: /\beval\s*\(|new\s+Function\s*\(|\brender_template_string\s*\(|\bTemplate\s*\(\s*[A-Za-z_$]/g },
  { category: 'deserialize', check: 'INJ-06, INJ-07', re: /\b(?:pickle\.loads?|yaml\.load|Marshal\.load|unserialize|readObject)\s*\(|yaml\.load\s*\([^)]*\)/g },
  { category: 'filesystem', check: 'INJ-05', re: /\b(?:readFile|readFileSync|createReadStream|sendFile|writeFile|writeFileSync|unlink|open)\s*\(|\bpath\.join\s*\(|\bos\.path\.join\s*\(/g },
  { category: 'html-sink', check: 'XSS-01, XSS-02', re: /dangerouslySetInnerHTML|\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML\s*\(|document\.write\s*\(|v-html|\|\s*safe\b|\{\{\{/g },
  // Server-rendered HTML built from a template literal — a backtick opening a literal that
  // contains BOTH a tag and an interpolation. This is the dominant XSS shape in plain
  // Node web apps and the React-oriented patterns above see none of it: the first real
  // codebase had 50 of these and zero `innerHTML`. The reviewer's job per XSS-01 is to check
  // each interpolation against the project's own escape helper, so one candidate per literal
  // is the right granularity — it reads the whole literal.
  { category: 'html-template', check: 'XSS-01, XSS-04', re: /`(?=[^`]*<[a-zA-Z])(?=[^`]*\$\{)/g },
  { category: 'outbound', check: 'SSRF-01, PII-04', re: /\b(?:fetch|axios|got|request|urlopen|HttpClient)\s*\(|axios\.(?:get|post|put|patch|delete)\s*\(|requests\.(?:get|post|put|patch|delete)\s*\(/g },
  { category: 'llm', check: 'PII-04', re: /\b(?:anthropic|openai|bedrock|vertex|gemini|claude)\b[^\n]{0,40}\.(?:messages|chat|completions|generate|invoke)|\bmessages\s*:\s*\[/gi },
  { category: 'analytics', check: 'PII-04', re: /\b(?:analytics|segment|mixpanel|amplitude|posthog|datadog|sentry|rollbar|bugsnag)\b[^\n]{0,30}\.(?:track|capture|identify|event|log|captureException)/gi },
  { category: 'log', check: 'PII-02, SEC-04, LOG-03', re: /\b(?:log(?:ger)?|console)\s*\.\s*(?:log|info|warn|error|debug|trace|fatal)\s*\(|\bprint\s*\(|\bputs\s+/g },
  { category: 'crypto', check: 'CRYPTO-01..05, AUTHN-01, AUTHN-02', re: /\bcreate(?:Cipher|Decipher|Hash|Hmac|Sign|Verify)\w*\s*\(|\b(?:md5|sha1|createCipheriv?)\s*\(|\b(?:bcrypt|scrypt|argon2|pbkdf2)\w*\s*\(|hashlib\.\w+\s*\(/gi },
  // Only redirects with a NON-literal target. genesis-wiki has 216 `reply.redirect('/path')`
  // calls, every one of them a fixed internal path — flagging those buries the one that takes
  // a `next` parameter, which is the only open-redirect candidate in the file. Requiring a
  // non-literal is the same discipline as requiring a literal in ROUTE_PATTERNS, inverted:
  // match where the interesting thing is, not where the syntax is.
  { category: 'open-redirect', check: 'XSS-03', re: /\b(?:redirect|redirectTo|sendRedirect)\s*\(\s*(?!['"`])[A-Za-z_$({]|\blocation(?:\.href)?\s*=\s*(?!['"`])[A-Za-z_$({]/g },
];

/**
 * Frameworks this locator can read, grouped by language.
 *
 * The point is not detection for its own sake. If a project uses something here and no
 * surface came from a file importing **that framework**, the locator is blind to that
 * framework, and it says so.
 */
const FRAMEWORKS = [
  { name: 'fastify', lang: 'js', handled: true, dep: /^fastify$/, imp: /from\s+['"]fastify['"]|require\(['"]fastify['"]\)/ },
  { name: 'express', lang: 'js', handled: true, dep: /^express$/, imp: /from\s+['"]express['"]|require\(['"]express['"]\)/ },
  { name: 'koa', lang: 'js', handled: true, dep: /^koa$/, imp: /from\s+['"]koa['"]/ },
  { name: 'hono', lang: 'js', handled: true, dep: /^hono$/, imp: /from\s+['"]hono['"]/ },
  { name: 'next', lang: 'js', handled: true, dep: /^next$/, imp: /from\s+['"]next\// },
  { name: 'trpc', lang: 'js', handled: true, dep: /^@trpc\//, imp: /from\s+['"]@trpc\// },
  { name: 'flask', lang: 'py', handled: true, dep: /^flask$/i, imp: /^\s*from\s+flask\s+import|^\s*import\s+flask/m },
  { name: 'fastapi', lang: 'py', handled: true, dep: /^fastapi$/i, imp: /^\s*from\s+fastapi\s+import/m },
  // Known and NOT handled. Naming them is the point — silence here was the original failure.
  { name: 'django', lang: 'py', handled: false, dep: /^django$/i, imp: /^\s*from\s+django/m },
  { name: 'nestjs', lang: 'js', handled: false, dep: /^@nestjs\//, imp: /from\s+['"]@nestjs\// },
  { name: 'rails', lang: 'rb', handled: false, dep: /^rails$/i, imp: /Rails\.application\.routes/ },
  { name: 'sinatra', lang: 'rb', handled: false, dep: /^sinatra$/i, imp: /require\s+['"]sinatra['"]/ },
  { name: 'spring', lang: 'java', handled: false, dep: /spring-boot/, imp: /@RestController|@RequestMapping/ },
  { name: 'laravel', lang: 'php', handled: false, dep: /^laravel\//, imp: /Route::(get|post|put|delete)/ },
  { name: 'gin', lang: 'go', handled: false, dep: /gin-gonic/, imp: /gin\.(Default|New)\(\)/ },
  { name: 'echo', lang: 'go', handled: false, dep: /labstack\/echo/, imp: /echo\.New\(\)/ },
];

const SERVERISH_PATH = /(^|\/)(routes?|api|handlers?|controllers?|endpoints?|resolvers?|jobs?|workers?|tasks?|cron)(\/|\.)/i;
const MOUNT_CALL = /(?:\.(?:register|use|addRoute|route|mount)\s*\(\s*([A-Za-z_$][\w$]*)?|\b(register\w*Routes?|add\w*Routes?|define\w*Routes?|create\w*Router)\s*\()/g;

/**
 * A registration-shaped call with a computed path, on a receiver PROVEN to be a router in
 * this same file.
 *
 * The receiver constraint is the whole thing. Matching any `.get(` with a non-literal first
 * argument flags every `Map.get(key)`, `cache.get(id)`, and `set.delete(x)` in a codebase —
 * twelve files in the first project this ran against, none of them routers. That is the same
 * false positive the literal-path requirement exists to prevent, reintroduced one layer up.
 */
function dynamicRoutesOn(text, receivers) {
  if (receivers.size === 0) return 0;
  const alt = [...receivers].map((r) => r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const re = new RegExp(`\\b(?:${alt})\\s*\\.\\s*${HTTP_METHOD}\\s*\\(\\s*(?!['"\`]/)[A-Za-z_$\`]`, 'gi');
  return [...text.matchAll(re)].length;
}

const DEFAULT_SOURCE = [
  'src/**/*.{ts,tsx,js,jsx,mjs,cjs,py,rb,go,java,php}',
  'app/**/*.{ts,tsx,js,jsx,mjs,py,rb}',
  'pages/**/*.{ts,tsx,js,jsx}',
  'lib/**/*.{ts,js,mjs,py,rb}',
  'server/**/*.{ts,js,mjs,py,go}',
  'api/**/*.{ts,js,mjs,py,go}',
  'packages/**/*.{ts,tsx,js,jsx,mjs}',
  'apps/**/*.{ts,tsx,js,jsx,mjs}',
];
const DEFAULT_MIGRATIONS = ['**/migrations/**/*.sql', 'db/**/*.sql', 'prisma/schema.prisma', '**/schema.sql'];
const MANIFESTS = ['package.json', 'requirements.txt', 'pyproject.toml', 'Gemfile', 'go.mod', 'pom.xml', 'composer.json'];

const SELF = /^security\/scripts\//;

/**
 * Paths whose contents are presumed benign until read — known-benign classes 1, 3, and 5 of
 * the finding contract.
 *
 * They are NOT excluded from the map. They are LABELLED, because "this candidate is in a
 * test factory" is exactly the context the reviewer needs to classify it, and silently
 * dropping them would hide a real credential committed into a fixture directory.
 */
const BENIGN_PATH = [
  { label: 'test', re: /(^|\/)(test|tests|__tests__|spec|e2e)\/|\.(test|spec)\.\w+$/i },
  { label: 'fixture', re: /(^|\/)(fixtures?|factories|seeds?|mocks?|__mocks__|testdata)\//i },
  { label: 'vendored', re: /(^|\/)(vendor|third_party|node_modules|\.venv|venv)\//i },
  { label: 'generated', re: /(^|\/)(dist|build|out|coverage|__generated__)\/|\.min\.(js|css)$|\.generated\.\w+$/i },
  { label: 'example', re: /\.example$|\.sample$|(^|\/)examples?\//i },
  { label: 'docs', re: /\.(md|mdx|rst|txt)$|(^|\/)docs?\//i },
];

function benignLabel(file) {
  for (const b of BENIGN_PATH) if (b.re.test(file)) return b.label;
  return null;
}

/** Dependency names from every manifest, parsed rather than regexed over raw text. */
function dependencyNames(root) {
  const names = [];
  const pkg = readJsonOr(join(root, 'package.json'), null);
  if (pkg) names.push(...Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }));

  // `requirements.txt: Django==5.2.1` was previously tested against raw file text with an
  // anchored regex, so it never matched. Split to bare names first.
  const req = readOr(join(root, 'requirements.txt'), '') ?? '';
  for (const line of req.split('\n')) {
    const n = line.trim().replace(/^-e\s+/, '').split(/[=<>!~;[\s]/)[0];
    if (n && !n.startsWith('#')) names.push(n);
  }
  const gemfile = readOr(join(root, 'Gemfile'), '') ?? '';
  for (const m of gemfile.matchAll(/^\s*gem\s+['"]([^'"]+)['"]/gm)) names.push(m[1]);
  const gomod = readOr(join(root, 'go.mod'), '') ?? '';
  for (const m of gomod.matchAll(/^\s+([\w.\-/]+)\s+v\d/gm)) names.push(m[1]);
  const pyproject = readOr(join(root, 'pyproject.toml'), '') ?? '';
  for (const m of pyproject.matchAll(/^\s*["']?([A-Za-z][\w.-]*)["']?\s*[=><~]/gm)) names.push(m[1]);
  // Coarse fallback for manifests with no parser above.
  const rest = MANIFESTS.filter((f) => !['package.json', 'requirements.txt', 'Gemfile', 'go.mod', 'pyproject.toml'].includes(f))
    .map((f) => readOr(join(root, f), '') ?? '')
    .join('\n');
  return { names: [...new Set(names)], rawRest: rest };
}

function scanFiles(root, config) {
  const files = filesMatching(root, config.source_globs ?? DEFAULT_SOURCE).filter((f) => !SELF.test(f));
  const surfaces = [];
  const jobs = [];
  const sinks = [];
  const unread = [];
  const truncated = [];
  const seen = new Set();
  const texts = new Map();
  const producedBy = new Map();
  const receiversOf = new Map();
  const exportsOf = new Map();
  const perCategory = new Map();

  const addSurface = (kind, method, path, file, index, text) => {
    // Identity includes the file AND the line. Two routers in one file register the same
    // method and path, and collapsing them let a guarded registration vouch for an unguarded
    // sibling. Mount prefixes are not visible at the registration site.
    const line = lineAt(text, index);
    const id = kind === 'http' ? `http:${method} ${path}@${file}:${line}` : `${kind}:${path}@${file}:${line}`;
    if (seen.has(id)) return;
    seen.add(id);
    const entry = { id, kind, method, path, file, line, benign: benignLabel(file) };
    (kind === 'http' ? surfaces : jobs).push(entry);
  };

  for (const file of files) {
    const raw = readOr(join(root, file), '');
    if (!raw) continue;
    // Match against comment-stripped source, offsets preserved. A commented-out route
    // registered as a real surface, and in the other direction a comment reading
    // `// authorize` satisfied a guard. Both were real defects.
    const text = stripComments(raw, file);
    texts.set(file, text);
    let produced = 0;
    const receivers = new Set();

    for (const p of ROUTE_PATTERNS) {
      if (p.fileMatch && !p.fileMatch.test(file)) continue;
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(text)) !== null) {
        if (p.name === 'method-call' && m[1]) receivers.add(m[1]);
        if (p.expand) {
          for (const e of p.expand(m)) { addSurface('http', e.method, e.path, file, m.index, text); produced += 1; }
        } else {
          for (const method of p.methods(m, file)) { addSurface('http', method, p.path(m, file), file, m.index, text); produced += 1; }
        }
      }
    }
    for (const p of JOB_PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(text)) !== null) { addSurface(p.kind, p.kind.toUpperCase(), p.label(m), file, m.index, text); produced += 1; }
    }

    for (const p of SINK_PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(text)) !== null) {
        const n = (perCategory.get(p.category) ?? 0) + 1;
        perCategory.set(p.category, n);
        if (n > MAX_PER_CATEGORY) continue;
        const line = lineAt(text, m.index);
        sinks.push({
          category: p.category,
          check: p.check,
          file,
          line,
          excerpt: (raw.split('\n')[line - 1] ?? '').trim().slice(0, 160),
          benign: benignLabel(file),
        });
      }
    }

    producedBy.set(file, produced);
    receiversOf.set(file, receivers);
    exportsOf.set(file, [...text.matchAll(/export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
  }

  // No silent caps. If a category was truncated, the reader is told what they are not seeing.
  for (const [category, n] of perCategory) {
    if (n > MAX_PER_CATEGORY) truncated.push({ category, shown: MAX_PER_CATEGORY, total: n });
  }

  const accounted = new Set();
  for (const [file, count] of producedBy) {
    if (count > 0) for (const name of exportsOf.get(file) ?? []) accounted.add(name);
  }

  for (const [file, count] of producedBy) {
    const text = texts.get(file) ?? '';

    // A registration with a non-literal path. Checked in EVERY file, including ones that
    // produced surfaces — one recognized route used to suppress every miss beside it, and
    // mixed-idiom files are exactly where the misses are.
    const dynamic = dynamicRoutesOn(text, receiversOf.get(file) ?? new Set());
    if (dynamic > 0) {
      unread.push({ file, reason: `${dynamic} route registration(s) with a computed path — read this file and enumerate them by hand` });
      continue;
    }
    if (count > 0) continue;

    const serverish = SERVERISH_PATH.test(file) || FRAMEWORKS.some((f) => f.imp.test(text));
    if (!serverish) continue;

    MOUNT_CALL.lastIndex = 0;
    const mounted = [...text.matchAll(MOUNT_CALL)].map((m) => m[1] ?? m[2]).filter(Boolean);
    const unresolved = mounted.filter((n) => !accounted.has(n));
    if (unresolved.length > 0) {
      unread.push({ file, reason: `mounts ${unresolved.slice(0, 3).join(', ')} — nothing located accounts for what that serves` });
    } else if (mounted.length === 0) {
      unread.push({ file, reason: 'looks like it serves traffic but registers nothing recognizable' });
    }
  }

  return { surfaces, jobs, sinks, unread, truncated, texts };
}

/**
 * Which frameworks this project uses, and whether we read any routes from **each one**.
 *
 * Scoped per framework on purpose. An earlier version gated on a project-wide
 * `httpBy.size === 0`, so a single Express health route silenced a wholly unread Fastify
 * application. That is the same mistake as the hard-coded "canary" it replaced — one
 * recognized thing vouching for everything — just one level up.
 */
function detectFrameworks(root, texts, surfaces) {
  const { names, rawRest } = dependencyNames(root);
  const producing = new Set(surfaces.map((s) => s.file));
  const found = [];

  for (const fw of FRAMEWORKS) {
    const declared = names.some((d) => fw.dep.test(d)) || fw.dep.test(rawRest);
    const importers = [...texts.entries()].filter(([, t]) => fw.imp.test(t)).map(([f]) => f);
    if (!declared && importers.length === 0) continue;

    // Did any file importing THIS framework produce a surface?
    const readFrom = importers.filter((f) => producing.has(f));
    found.push({
      name: fw.name,
      lang: fw.lang,
      handled: fw.handled,
      declared,
      importers: importers.length,
      surfaces_read_from_its_files: readFrom.length,
    });
  }
  return found;
}

/**
 * Stores.
 *
 * Migrations are REPLAYED IN ORDER rather than filtered. The rebuild idiom
 * `CREATE x_new; DROP x; RENAME x_new TO x` defeats a filter — it sees `x` dropped and
 * `x_new` renamed away and removes both, so a live table disappears.
 */
function locateStores(root, config) {
  const live = new Map();
  const files = filesMatching(root, config.migration_globs ?? DEFAULT_MIGRATIONS);

  for (const file of files.sort()) {
    const raw = readOr(join(root, file), '');
    if (!raw) continue;
    const text = stripComments(raw, file);

    // Schema-qualified names captured whole. `CREATE TABLE public.users` previously reported
    // as `table:public` and left the real table out entirely.
    const stmt = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`']?((?:[A-Za-z_]\w*\.)?[A-Za-z_]\w*)["`']?|DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?["`']?((?:[A-Za-z_]\w*\.)?[A-Za-z_]\w*)["`']?|ALTER\s+TABLE\s+["`']?((?:[A-Za-z_]\w*\.)?[A-Za-z_]\w*)["`']?\s+RENAME\s+TO\s+["`']?((?:[A-Za-z_]\w*\.)?[A-Za-z_]\w*)["`']?/gi;
    let m;
    while ((m = stmt.exec(text)) !== null) {
      const [, created, dropped, from, to] = m;
      if (created) live.set(created, { file, line: lineAt(text, m.index), columns: [] });
      else if (dropped) live.delete(dropped);
      else if (from && to) { const prior = live.get(from) ?? { file, line: lineAt(text, m.index), columns: [] }; live.delete(from); live.set(to, prior); }
    }
    for (const p of text.matchAll(/^\s*model\s+([A-Za-z_]\w*)\s*\{/gm)) live.set(p[1], { file, line: lineAt(text, p.index), columns: [] });

    // Column names, so the PII lens has something to start from. Names are a STARTING POINT
    // only — the reviewer establishes what data a column actually holds from its origin, not
    // from its name. A column called `name` is sometimes a hostname.
    for (const m2 of text.matchAll(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`']?((?:[A-Za-z_]\w*\.)?[A-Za-z_]\w*)["`']?\s*\(([\s\S]*?)\n\s*\)/gi)) {
      const t = live.get(m2[1]);
      if (!t) continue;
      for (const c of m2[2].matchAll(/^\s*["`']?([a-z_][\w]*)["`']?\s+[A-Za-z]/gim)) {
        if (!/^(primary|foreign|unique|constraint|check|index|key)$/i.test(c[1])) t.columns.push(c[1]);
      }
    }
  }

  const stores = [...live.entries()]
    .map(([name, at]) => ({ id: `store:table:${name}`, kind: 'store', subkind: 'table', name, file: at.file, line: at.line, columns: at.columns }))
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const s of config.declared_stores ?? []) {
    stores.push({
      id: `store:${s.kind ?? 'external'}:${s.name}`,
      kind: 'store',
      subkind: s.kind ?? 'external',
      name: s.name,
      file: s.declared_in ?? 'security/config.json',
      line: 0,
      columns: [],
      note: s.note ?? null,
    });
  }
  return stores;
}

export function locate(root, config = {}) {
  const { surfaces, jobs, sinks, unread, truncated, texts } = scanFiles(root, config);
  const stores = locateStores(root, config);
  const frameworks = detectFrameworks(root, texts, surfaces);

  for (const fw of frameworks) {
    if (!fw.handled) {
      unread.push({ file: `(project uses ${fw.name})`, reason: `${fw.name} is not an idiom this locator reads — none of its routes are below. Read them by hand.` });
    } else if (fw.importers > 0 && fw.surfaces_read_from_its_files === 0) {
      unread.push({ file: `(project uses ${fw.name})`, reason: `${fw.name} is imported in ${fw.importers} file(s) and no route was read from any of them — this project registers routes some other way` });
    } else if (fw.declared && fw.importers === 0) {
      unread.push({ file: `(project declares ${fw.name})`, reason: `${fw.name} is a declared dependency but imported nowhere the source globs reach — check the globs in security/config.json` });
    }
  }

  return {
    schema: SCHEMA,
    generated_at: new Date().toISOString(),
    _note:
      'A MAP OF CANDIDATES, NOT A COMPLETE INVENTORY. Nothing here is a finding, a severity, or a verdict — the reviewer reads the code and decides. `unread` is the work list: those files could not be parsed and are where an unnoticed problem is most likely to be.',
    counts: {
      surfaces: surfaces.length,
      jobs: jobs.length,
      stores: stores.length,
      sinks: sinks.length,
      unread: unread.length,
    },
    frameworks,
    surfaces,
    jobs,
    stores,
    sinks,
    unread,
    truncated,
  };
}

function main() {
  const root = process.cwd();
  const config = readJsonOr(join(root, 'security', 'config.json'), {});
  const out = locate(root, config);

  if (process.argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify(out, null, 2)}\n`);
    return;
  }

  const c = out.counts;
  const lines = [
    `${c.surfaces} surface(s), ${c.jobs} job(s), ${c.stores} store(s), ${c.sinks} sink(s)`,
    out.frameworks.length
      ? `frameworks: ${out.frameworks.map((f) => f.name + (f.handled ? '' : ' [not read]')).join(', ')}`
      : 'no known framework detected',
  ];
  const byCat = new Map();
  for (const s of out.sinks) byCat.set(s.category, (byCat.get(s.category) ?? 0) + 1);
  if (byCat.size) lines.push(`sinks: ${[...byCat].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ')}`);
  for (const t of out.truncated) lines.push(`TRUNCATED: ${t.category} — showing ${t.shown} of ${t.total}`);
  if (c.unread) {
    lines.push('', `${c.unread} file(s) could not be read — START HERE:`);
    for (const u of out.unread.slice(0, 20)) lines.push(`  ${u.file} — ${u.reason}`);
    if (out.unread.length > 20) lines.push(`  … and ${out.unread.length - 20} more (use --json)`);
  }
  lines.push('', 'This is a map of candidates, not an inventory. Nothing above is a finding.');
  process.stdout.write(`${lines.join('\n')}\n`);
}

// Resolve symlinks before comparing. A bare `file://${process.argv[1]}` comparison fails
// whenever the path traverses a symlink — on macOS `/var` → `/private/var` — so running this
// from a temp directory silently skipped main() and exited 0.
if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) main();
