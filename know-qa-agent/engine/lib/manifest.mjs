import { resolve } from 'node:path';
import { sha256, simpleGlobMatch, slug } from './util.mjs';

function resolveEnvironment(specs, requestedName, urlOverride) {
  const profiles = specs.flatMap((spec) => spec.environments);
  const selected = requestedName
    ? profiles.find((profile) => profile.name === requestedName)
    : profiles[0];
  if (requestedName && !selected) throw new Error(`Environment "${requestedName}" not found.`);
  const baseUrl = urlOverride || selected?.base_url || specs.find((spec) => spec.base_url)?.base_url;
  if (!baseUrl) throw new Error('No base URL resolved from --url, environment, or spec.');
  return {
    name: selected?.name ?? null,
    base_url: baseUrl,
    credentials_present: Boolean(selected?.credentials),
    timeouts: selected?.timeouts ?? {},
    flags: selected?.flags ?? {},
  };
}

function scenarioArea(scenario, specPath, areas) {
  for (const area of areas) {
    const match = area.match ?? {};
    const tag = match.tag ?? `area:${area.key}`;
    const matched = scenario.tags.includes(tag)
      || (match.tags ?? []).some((item) => scenario.tags.includes(item))
      || (match.specs ?? []).some((pattern) => simpleGlobMatch(specPath, pattern));
    if (matched) return area;
  }
  return null;
}

function detectCycles(scenarios) {
  const byId = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const visiting = new Set();
  const visited = new Set();
  function visit(id, path = []) {
    if (visiting.has(id)) throw new Error(`Dependency cycle: ${[...path, id].join(' -> ')}`);
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of byId.get(id)?.depends_on ?? []) visit(dependency, [...path, id]);
    visiting.delete(id);
    visited.add(id);
  }
  for (const scenario of scenarios) visit(scenario.id);
}

export function buildManifest({
  project,
  specInputs,
  sourceContents,
  tags = [],
  areaKeys = [],
  owner = null,
  areasConfig = { areas: [] },
  environmentName = null,
  urlOverride = null,
  runId,
  createdAt,
}) {
  const areas = areasConfig.areas ?? [];
  const explicitlyRequestedAreas = new Set(areaKeys);
  let selectedAreaKeys = [...areaKeys];
  if (owner) {
    selectedAreaKeys = areas.filter((area) => area.owner === owner).map((area) => area.key);
    if (!selectedAreaKeys.length) throw new Error(`No areas owned by "${owner}".`);
  }
  for (const key of selectedAreaKeys) {
    if (!areas.some((area) => area.key === key)) throw new Error(`Area "${key}" not found.`);
  }

  const all = [];
  for (const spec of specInputs) {
    for (const scenario of spec.scenarios) {
      const area = scenarioArea(scenario, spec.source_path, areas);
      all.push({
        ...scenario,
        spec: spec.source_path,
        area: area?.key ?? null,
        owner: area?.owner ?? null,
        area_status: area?.status ?? 'implemented',
      });
    }
  }
  const byName = new Map();
  const bySpecName = new Map();
  for (const scenario of all) {
    const matches = byName.get(scenario.name) ?? [];
    matches.push(scenario);
    byName.set(scenario.name, matches);
    bySpecName.set(`${scenario.spec}\u0000${scenario.name}`, scenario);
  }
  for (const scenario of all) {
    scenario.depends_on = scenario.depends_on_names.map((name) => {
      const localDependency = bySpecName.get(`${scenario.spec}\u0000${name}`);
      const globalMatches = byName.get(name) ?? [];
      const dependency = localDependency ?? (globalMatches.length === 1 ? globalMatches[0] : null);
      if (!dependency && globalMatches.length > 1) {
        throw new Error(`${scenario.name}: dependency "${name}" is ambiguous across specs.`);
      }
      if (!dependency) throw new Error(`${scenario.name}: dependency "${name}" not found.`);
      return dependency.id;
    });
  }
  detectCycles(all);

  let selected = all.filter((scenario) => {
    if (selectedAreaKeys.length && !selectedAreaKeys.includes(scenario.area)) return false;
    if (scenario.area_status === 'not-implemented') {
      if (!explicitlyRequestedAreas.has(scenario.area)) return false;
      if (!scenario.tags.includes('smoke')) return false;
    }
    if (tags.length && !tags.some((tag) => scenario.tags.includes(tag))) return false;
    return true;
  });
  if (!selected.length) throw new Error('Selection resolved to zero scenarios.');

  const selectedIds = new Set(selected.map((scenario) => scenario.id));
  const autoIncluded = [];
  const byId = new Map(all.map((scenario) => [scenario.id, scenario]));
  function includeDependencies(scenario) {
    for (const dependencyId of scenario.depends_on) {
      if (!selectedIds.has(dependencyId)) {
        selectedIds.add(dependencyId);
        autoIncluded.push(dependencyId);
        selected.push(byId.get(dependencyId));
      }
      includeDependencies(byId.get(dependencyId));
    }
  }
  for (const scenario of [...selected]) includeDependencies(scenario);
  selected = all.filter((scenario) => selectedIds.has(scenario.id));

  const environment = resolveEnvironment(specInputs, environmentName, urlOverride);
  const cells = [];
  for (const scenario of selected) {
    const spec = specInputs.find((item) => item.source_path === scenario.spec);
    const variants = scenario.data_variants.length
      ? scenario.data_variants.map((variant) => variant.name)
      : [null];
    for (const browser of spec.browsers) {
      for (const viewport of spec.viewports) {
        for (const persona of spec.personas) {
          for (const variant of variants) {
            const id = [
              scenario.id,
              browser,
              viewport.name,
              slug(persona),
              variant ? slug(variant) : 'default',
            ].join('--');
            cells.push({
              id,
              scenario_id: scenario.id,
              browser,
              cli_browser: browser === 'chromium' ? 'chrome' : browser,
              viewport,
              persona,
              data_variant: variant,
              status: 'pending',
              result_path: `results/${id}.json`,
            });
          }
        }
      }
    }
  }

  return {
    schema_version: '1.0',
    run_id: runId,
    created_at: createdAt,
    project: resolve(project),
    sources: specInputs.map((spec) => ({
      path: spec.source_path,
      sha256: sha256(sourceContents.get(spec.source_path)),
    })),
    selection: {
      specs: specInputs.map((spec) => spec.source_path),
      tags,
      areas: selectedAreaKeys,
      owner,
      auto_included_dependencies: autoIncluded,
    },
    environment,
    scenarios: selected.map((scenario) => ({
      id: scenario.id,
      name: scenario.name,
      spec: scenario.spec,
      tags: scenario.tags,
      depends_on: scenario.depends_on,
      area: scenario.area,
      owner: scenario.owner,
      implementation_status: scenario.area_status,
      status: 'pending',
    })),
    cells,
    evidence_policy: {
      raw_restricted: true,
      sanitized_text_only: true,
      screenshots_require_review: true,
    },
  };
}

export function validateManifest(manifest) {
  const errors = [];
  if (manifest.schema_version !== '1.0') errors.push('schema_version must be 1.0');
  if (!manifest.run_id) errors.push('run_id is required');
  if (!manifest.sources?.length) errors.push('at least one source is required');
  if (!manifest.scenarios?.length) errors.push('at least one scenario is required');
  if (!manifest.cells?.length) errors.push('at least one cell is required');
  const scenarioIds = new Set(manifest.scenarios?.map((scenario) => scenario.id));
  const cellIds = new Set();
  for (const cell of manifest.cells ?? []) {
    if (!scenarioIds.has(cell.scenario_id)) errors.push(`${cell.id}: unknown scenario_id`);
    if (cellIds.has(cell.id)) errors.push(`${cell.id}: duplicate cell id`);
    cellIds.add(cell.id);
  }
  if (errors.length) throw new Error(`Invalid manifest:\n- ${errors.join('\n- ')}`);
  return manifest;
}
