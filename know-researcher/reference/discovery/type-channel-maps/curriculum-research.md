---
research-type: curriculum-research
description: Phase-grouped channel routing for curriculum research — maps domain landscape, practitioner reality, skill decomposition, misconceptions, best practice, field trajectory, competing approaches, and existing programs phases to prioritized discovery channels
active-channels:
  - academic
  - web-search
  - social-signals
  - regulatory
  - domain-specific
---

# Type-Channel Map: Curriculum Research

This map tells the discover skill which channels to query for each phase of curriculum research. Priorities are derived from the curriculum-research credibility hierarchy: peer-reviewed research is highest for foundational claims; practitioner communities (forums, conference talks, professional groups) are high credibility for ground truth on how work actually gets done; government data (labor statistics, occupational frameworks) is high for workforce and industry context.

Synthesis phases are omitted — no new discovery needed for that phase. If the discover skill finds no group match for a phase, report: "No discovery channels mapped for this phase — this phase uses existing sources."

---

## Discovery Group: Domain Landscape

**Covers phases with keywords:** domain landscape, domain overview, field overview, subject matter, key concepts, frameworks, vocabulary, scope, what is this field, boundaries, definitions

**Rationale:** Peer-reviewed research provides the authoritative vocabulary, frameworks, and definitional boundaries for a field. Web-search surfaces current state-of-field summaries, authoritative textbooks, and recent field-defining publications.

**Primary channels:**
- academic — peer-reviewed papers, textbooks, review articles establishing domain vocabulary, frameworks, and field boundaries; highest credibility for foundational subject matter claims
- web-search — authoritative field introductions, university course syllabi, professional association overviews, recent field-defining publications

**Secondary channels (if primary returns fewer than 5 sources):**
- social-signals — professional association discussions, conference proceedings summaries, practitioner definitions of field scope
- domain-specific — educational standards databases for domains where national or professional standards define the curriculum scope (see Domain-Specific Sources section)

---

## Discovery Group: Practitioner Reality

**Covers phases with keywords:** practitioner reality, how practitioners work, daily workflow, real work, actual practice, tools practitioners use, on-the-job, what practitioners do, ground truth

**Rationale:** Practitioner communities (forums, Slack groups, subreddits, professional groups, conference talks with real examples) are high credibility for how work actually gets done — textbooks and academic research often lag or misrepresent current practice. This is the highest-priority group for curriculum design accuracy.

**Primary channels:**
- social-signals — practitioner forums (Reddit, Stack Overflow, Discord, Slack communities), professional group discussions, conference talk threads, practitioner blogs with specific workflow descriptions; highest credibility for ground truth on daily practice
- web-search — practitioner-authored workflow guides, "day in the life" articles, conference talks by working practitioners, professional association practice guides

**Secondary channels (if primary returns fewer than 5 sources):**
- academic — published practitioner case studies with verifiable outcomes; high for real-world practice evidence when available
- regulatory — occupational frameworks, O*NET task descriptions, BLS occupational outlook with role descriptions; high for structured workforce context

---

## Discovery Group: Skill Decomposition

**Covers phases with keywords:** skill decomposition, component skills, skill map, what must someone be able to do, behavioral skills, competencies, tasks, sub-skills, skill structure, prerequisite

**Rationale:** Accurate skill decomposition requires both textbook knowledge (what competencies are defined in the literature) and practitioner testimony (what skills practitioners actually use). Both channels carry complementary high credibility for this phase.

**Primary channels:**
- academic — competency frameworks in the literature, published skill taxonomies, peer-reviewed studies identifying skill components; highest credibility for formally defined competencies
- social-signals — practitioner discussions about what skills matter most, job posting analysis threads, community debates about skill prerequisites; high for real-world skill signal

**Secondary channels (if primary returns fewer than 5 sources):**
- web-search — job descriptions and postings (signal required skills), professional certification syllabi, interview prep resources that reveal expected skill sets
- domain-specific — professional credentialing databases and certification frameworks for formally codified skill requirements (see Domain-Specific Sources section)

---

## Discovery Group: Misconceptions and Failure Patterns

**Covers phases with keywords:** misconceptions, common mistakes, what beginners get wrong, failure patterns, plateau, wrong beliefs, common errors, misunderstandings

**Rationale:** Both academic research (studies on learning difficulties and misconceptions in the domain) and practitioner communities (first-hand observation of where learners struggle) provide high-credibility evidence for this phase. Academic sources identify systematically studied misconceptions; practitioner sources surface undocumented but common errors.

**Primary channels:**
- academic — published research on learning difficulties, misconception studies, cognitive error patterns in the domain; highest credibility for evidence-based misconception identification
- social-signals — practitioner forums where experienced practitioners discuss common beginner mistakes, "what I wish I knew" threads, teaching communities discussing student failure patterns

**Secondary channels (if primary returns fewer than 5 sources):**
- web-search — practitioner-authored guides to common mistakes, blog posts from credible practitioners documenting failure patterns, instructional design research on misconception types

---

## Discovery Group: Current Best Practice and Field Trajectory

**Covers phases with keywords:** best practice, current standard, accepted approach, field trajectory, what's changing, emerging practices, declining approaches, recent developments, state of the art, what's new

**Rationale:** Academic research establishes what evidence-supported best practice is; it is highest credibility for distinguishing evidence-backed practice from trend-following. Web-search and social-signals surface the current practitioner-facing discourse about what's emerging and what's declining.

**Primary channels:**
- academic — recent peer-reviewed papers establishing or questioning current best practice; systematic reviews and meta-analyses; highest credibility for evidence-based practice determination
- web-search — industry publications, professional association announcements, recent practitioner-authored best practice guides with clear authorship

**Secondary channels (if primary returns fewer than 5 sources):**
- social-signals — practitioner community discussions about what's changing, conference talk announcements revealing emerging topics, professional group debates about best practice
- regulatory — professional body standards updates, government occupational framework revisions (O*NET updates); high for officially recognized shifts in field standards

---

## Discovery Group: Competing Approaches and Existing Programs

**Covers phases with keywords:** competing approaches, methodologies, schools of thought, existing programs, other courses, certifications, what others teach, program landscape, curriculum comparison, alternative methods

**Rationale:** Web-search is best for discovering what other programs, courses, and certifications cover — program pages, syllabi, and course catalogs live on the open web. Social-signals surfaces practitioner opinions about which approaches are valued, which are criticized, and which certifications carry real-world weight.

**Primary channels:**
- web-search — program websites, course catalog pages, certification syllabi, curriculum comparison articles, bootcamp and training program overviews
- social-signals — practitioner discussions about which certifications are valued, blog posts from credible practitioners comparing approaches, community debates about which methodology is superior

**Secondary channels (if primary returns fewer than 5 sources):**
- academic — published comparative studies of pedagogical approaches or methodology evaluations; high credibility when available
- domain-specific — educational repositories (OpenStax, OER Commons) for existing open curriculum covering the topic (see Domain-Specific Sources section)

---

## Domain-Specific Sources

Curriculum research uses the Educational Resources type hook from the domain-specific playbook. Execute these hooks when the discover skill determines domain-specific coverage is needed for the current phase.

**Applicable type hooks:**

**Academic standards databases (domain landscape, skill decomposition, existing programs phases):**
```
tvly search:
  query: "{subject} standards framework {grade_level_or_professional_level}"
  include_domains: ["corestandards.org", "nextgenscience.org", "iste.org", "ed.gov", "achieve.org"]
  search_depth: "advanced"
  max_results: 5
```

**Open Educational Resources — existing programs (competing approaches, existing programs phases):**
```
tvly search:
  query: "{topic} open educational resource curriculum"
  include_domains: ["oer.commons.org", "merlot.org", "openstax.org", "opened.com", "khanacademy.org"]
  search_depth: "advanced"
  max_results: 5
```

**Professional credentialing databases (skill decomposition, existing programs phases):**
```
tvly search:
  query: "{field} certification requirements competencies"
  include_domains: ["shrm.org", "pmi.org", "isaca.org", "isc2.org", "comptia.org"]
  search_depth: "advanced"
  max_results: 5
```
Substitute the appropriate credentialing body domain for the curriculum's professional domain.

**Note:** The above query templates are examples — substitute the actual subject, topic, and field from the research project. For professional domains not covered by the default credentialing sites, expand to the domain's recognized professional body.
