import { parseInlineList, parseScalar, slug, stripAngleUrl } from './util.mjs';

const TERMINAL_SECTIONS = new Set([
  'edge cases to verify',
  'things to watch for',
  'known issues',
]);

function sectionLines(lines, heading) {
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `## ${heading.toLowerCase()}`);
  if (start === -1) return [];
  const output = [];
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^##\s+/.test(lines[index])) break;
    output.push(lines[index]);
  }
  return output;
}

function parseBullets(lines) {
  return lines
    .map((line) => line.match(/^\s*-\s+(.+?)\s*$/)?.[1])
    .filter(Boolean);
}

function parseViewports(lines) {
  return parseBullets(lines).map((item) => {
    const match = item.match(/^(.+?)\s*\((\d+)\s*x\s*(\d+)\)$/i);
    if (!match) throw new Error(`Invalid viewport "${item}"; expected "name (WIDTHxHEIGHT)".`);
    return { name: slug(match[1]), width: Number(match[2]), height: Number(match[3]) };
  });
}

function parseNestedObject(lines, startIndex, baseIndent) {
  const value = {};
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }
    const indent = line.match(/^\s*/)[0].length;
    if (indent <= baseIndent) break;
    const match = line.trim().match(/^([^:]+):\s*(.*)$/);
    if (!match) break;
    value[match[1].trim()] = parseScalar(match[2]);
    index += 1;
  }
  return { value, nextIndex: index };
}

function parseEnvironments(lines) {
  const output = [];
  let current = null;
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      current = { name: heading[1].trim(), timeouts: {}, flags: {} };
      output.push(current);
      continue;
    }
    if (!current) continue;
    const field = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!field) continue;
    const [, key, raw] = field;
    if ((key === 'timeouts' || key === 'flags') && !raw.trim()) {
      const nested = parseNestedObject(lines, index + 1, 0);
      current[key] = nested.value;
      index = nested.nextIndex - 1;
    } else {
      current[key] = parseScalar(raw);
    }
  }
  return output;
}

function parseDataSets(lines, startIndex) {
  const variants = [];
  let current = null;
  let index = startIndex;
  for (; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^##\s+/.test(line)) break;
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      const nextContent = lines.slice(index + 1).find((candidate) => candidate.trim());
      if (nextContent && /^(tags|depends_on):/i.test(nextContent.trim())) break;
      current = { name: heading[1].trim(), values: {} };
      variants.push(current);
      continue;
    }
    if (!current) continue;
    const field = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (field) current.values[field[1]] = parseScalar(field[2]);
  }
  return { variants, nextIndex: index };
}

function parseScenarios(lines, specSlug) {
  const scenarios = [];
  let inScenarios = false;
  let current = null;
  const ids = new Set();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const h2 = line.match(/^##\s+(.+?)\s*$/);
    if (h2) {
      const name = h2[1].trim().toLowerCase();
      if (name === 'test scenarios') { inScenarios = true; continue; }
      if (name === 'data sets' && current) {
        const parsed = parseDataSets(lines, index + 1);
        current.data_variants = parsed.variants;
        index = parsed.nextIndex - 1;
        continue;
      }
      if (TERMINAL_SECTIONS.has(name)) inScenarios = false;
      continue;
    }
    if (!inScenarios) continue;
    const heading = line.match(/^###\s+(.+?)\s*$/);
    if (heading) {
      const name = heading[1].trim();
      const base = `${specSlug}--${slug(name)}`;
      let id = base;
      let suffix = 2;
      while (ids.has(id)) { id = `${base}-${suffix}`; suffix += 1; }
      ids.add(id);
      current = {
        id,
        name,
        tags: [],
        depends_on_names: [],
        data_variants: [],
      };
      scenarios.push(current);
      continue;
    }
    if (!current) continue;
    const tags = line.match(/^tags:\s*(.+?)\s*$/i);
    if (tags) current.tags = parseInlineList(tags[1]);
    const dependency = line.match(/^depends_on:\s*(.+?)\s*$/i);
    if (dependency) current.depends_on_names = parseInlineList(dependency[1]);
  }
  return scenarios;
}

export function parseSpec(content, sourcePath = 'spec.md') {
  const lines = String(content).replace(/\r\n/g, '\n').split('\n');
  const title = lines.find((line) => /^#\s+/.test(line))?.replace(/^#\s+/, '').trim()
    ?? sourcePath.replace(/\.md$/i, '');
  const specSlug = slug(sourcePath.replace(/^.*\//, '').replace(/\.md$/i, ''));
  const baseUrl = stripAngleUrl(sectionLines(lines, 'Base URL').find((line) => line.trim()) ?? '');
  const personas = parseBullets(sectionLines(lines, 'Personas'));
  const viewports = parseViewports(sectionLines(lines, 'Viewports'));
  const browsers = parseBullets(sectionLines(lines, 'Browsers')).map((item) => item.toLowerCase());
  const environments = parseEnvironments(sectionLines(lines, 'Environments'));
  const scenarios = parseScenarios(lines, specSlug);

  if (!scenarios.length) throw new Error(`${sourcePath}: no scenarios found under "## Test Scenarios".`);
  for (const browser of browsers) {
    if (!['chromium', 'firefox', 'webkit'].includes(browser)) {
      throw new Error(`${sourcePath}: unsupported browser "${browser}".`);
    }
  }

  return {
    title,
    source_path: sourcePath,
    spec_slug: specSlug,
    base_url: baseUrl,
    personas: personas.length ? personas : ['default'],
    viewports: viewports.length ? viewports : [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1280, height: 720 },
    ],
    browsers: browsers.length ? browsers : ['chromium'],
    environments,
    accessibility_focus: parseBullets(sectionLines(lines, 'Accessibility Focus')),
    visual_focus: parseBullets(sectionLines(lines, 'Visual Focus')),
    scenarios,
  };
}
