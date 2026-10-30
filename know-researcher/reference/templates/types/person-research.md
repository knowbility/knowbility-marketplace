# Person Research

**Finding Tags:**
- **CONFIRMED** — Multiple independent sources confirm this claim or data point
- **DISPUTED** — Sources disagree or the person's claims don't match external evidence
- **UNVERIFIABLE** — Can't confirm with public sources; may require direct conversation or references
- **OUTDATED** — Information that was once accurate but may have changed (flag date)
- **SELF-REPORTED** — Claim originates from the person themselves with no independent verification
- **GAP** — Important information that isn't publicly available

**Staleness Threshold:** 3 years — career arcs move slowly but roles and affiliations change

**What to Analyze:**
- Identity and career arc — who are they, what's their professional trajectory, what are the major chapters of their career?
- Expertise and credibility — what evidence supports their claimed expertise? Published work, patents, speaking engagements, demonstrated outcomes, peer recognition.
- Track record — what have they built, led, or shipped? What were the outcomes? Distinguish between "was there when it happened" and "made it happen."
- Public positions and thought leadership — what have they said publicly? Talks, articles, interviews, social media. Are their positions consistent over time? Any controversial stances?
- Reputation and peer perception — what do people who've worked with them say? Awards, endorsements, references, but also criticism, disputes, or pattern of conflict.
- Network and affiliations — who do they associate with professionally? Board seats, advisory roles, investments, institutional affiliations. What does the network reveal about their position in their field?
- Financial and legal footprint — SEC filings if they're an officer/director, litigation, patents, corporate registrations, disclosed investments. Only what's in public record.
- Red flags and risk factors — gaps in timeline, inconsistencies between claimed and verifiable history, legal issues, patterns of short tenures, repeated conflicts, or claims that don't hold up.

**Source Credibility Hierarchy:**
- SEC filings, court records, patent filings, corporate registrations → highest credibility for verifiable facts
- Published work (books, peer-reviewed papers, named conference talks with recordings) → high for expertise validation
- Third-party profiles (Crunchbase, PitchBook, Bloomberg) → high for career data and funding involvement
- News coverage and investigative journalism → high for public record, moderate for characterization
- Interviews, podcasts, recorded talks by the person → high for stated positions (they said it publicly), low for factual claims (self-reported)
- LinkedIn profile → useful for career timeline structure, LOW credibility for claims about impact or role scope. Treat as self-reported unless independently verified.
- Personal website, blog, portfolio → useful for work samples and stated positions, low for factual claims about outcomes
- Twitter/X, public social media → useful for real-time positions and network signals, low for factual claims
- Glassdoor, Blind, anonymous reviews → moderate for pattern detection (multiple similar reports carry weight), low for individual claims
- Testimonials, endorsements, reference quotes on personal site → not independent evidence. Treat as marketing.
- AI-generated summaries without sources → not a source, do not use

**Boundaries:**
- This project uses only publicly available information. Do not attempt to access private records, hack accounts, or social engineer information.
- Do not research personal life (family, health, relationships) unless the person has made it publicly relevant to their professional identity.
- **Third parties are protected by default — real specificity, not real identity.** The commissioned research subject is in scope by name; everyone else who surfaces in the record is not. Private individuals encountered along the way (colleagues, family members, former co-workers quoted in reviews, anonymous posters) are anonymized in drafts and outputs — role and context stay ("a former direct report," "a co-founder who departed in 2019"), names and identifying detail go — unless the person is a public figure acting in their public capacity, or a source note records explicit permission. Source notes may keep identifying links for traceability; the deliverable does not expose them. The downstream default when no permission record reaches the writing step is always anonymize — the fail direction is over-anonymization, never exposure.
- **Pronouns are a sourced fact like any other — they/them until the record says otherwise.** Use they/them for the subject and for every other individual who surfaces, unless a source records the person's own usage: a self-description, a byline or profile they control, an outlet quoting them, an on-record introduction. A name is not a source. Neither is a photograph, a voice, a job title, or a guess that feels safe because it is common.

  **Observed, and it is the reason this rule is written down.** A synthesis run wrote eighteen gendered pronouns into a draft whose entire corpus — plan, notes, cross-reference, coverage record — contained **zero**. Nothing in the evidence supported either answer, and the draft asserted one on every line.

  This is not a style preference sitting in a boundaries list. It is the same defect this type exists to prevent, arriving where it costs most: **an unsourced claim about a real, named person, stated as settled fact throughout a document written about them.** A wrong pronoun in a briefing is a factual error about that individual, and unlike a wrong date nobody re-checks it — it reads as something the researcher established rather than something they filled in. The fail direction here matches anonymization's: **they/them costs nothing when it turns out to be right, and asserting wrongly is not recoverable by a later correction that the reader never sees.**

  When a source does record the person's usage, follow it and let the source note carry the record, the same way any other sourced attribute is carried.
- Do not make character judgments. Report what the evidence shows and let the reader draw conclusions.
- Flag the difference between what the person claims and what can be independently verified. Self-reported accomplishments are data, not evidence.
- If the person has a thin public footprint, say so. Do not fill gaps with inference. A short report with clearly marked gaps is more valuable than a long report padded with speculation.
- This is research, not opposition research. The goal is an accurate picture, not a case for or against the person.

**Typical shape (non-binding):** 6-10 phases, adapted by the plan generator based on the person's public profile depth and the reason for research. Typical structure:
- Phase 1: Career arc and identity (establish the timeline, roles, companies, transitions)
- Phase 2: Expertise validation (published work, patents, demonstrated outcomes, peer recognition)
- Phase 3: Track record deep dive (what did they actually do at each major role? outcomes vs. claims)
- Phase 4: Public positions and thought leadership (talks, writing, interviews, social media presence)
- Phase 5: Reputation and peer perception (what others say — awards, criticism, patterns)
- Phase 6: Network and affiliations (board seats, advisory roles, investors, institutional connections)
- Phase 7: Financial and legal footprint (only for individuals with public filings — SEC, litigation, patents)
- Phase 8: Red flags and risk assessment (inconsistencies, gaps, patterns that warrant attention)
- Phase 9: Synthesis — comprehensive profile, credibility assessment, key findings, open questions

For less public individuals, the plan generator should collapse phases where source material won't exist (e.g., skip the financial/legal phase for someone with no SEC filings) and deepen the phases where material is available.

**Thin-profile detection (mid-research):** If during any phase the agent finds that all or nearly all findings are SELF-REPORTED with no independent corroboration available, this is likely a thin-profile individual — someone not prominent enough for independent coverage. When this happens:
- Name it explicitly: "This person has a thin public footprint. Independent verification of career claims is not available through public sources."
- Distinguish between a _researchable gap_ (more searching could fill it) and a _structural limitation_ (the information simply doesn't exist in public sources for someone at this profile level). Don't send the agent chasing sources that won't exist.
- Recommend synthesizing what's available with clear SELF-REPORTED tags rather than leaving the phase open indefinitely.
- Flag this finding to the user — it's often the most important thing person research reveals, especially for hire/invest/partner decisions.
- Re-evaluate the remaining phase plan: phases designed for prominent individuals (thought leadership, peer perception, financial footprint) may need to be collapsed or skipped now that profile depth is established.

**Success Criteria:**
1. Career timeline is verified against multiple sources — not just the person's own LinkedIn or bio
2. Every expertise claim is tagged: independently confirmed, self-reported only, or unverifiable
3. Track record distinguishes between "was present" and "was responsible" with evidence
4. Public positions are documented with direct quotes and sources, not paraphrased
5. Red flags are evidence-based and specific, not speculative
6. Gaps in the public record are explicitly identified — what couldn't be found and why it matters
7. All outputs have been audited for unsupported claims
8. The synthesis gives a clear, balanced picture that neither inflates nor deflates the person's profile
9. Every factual claim traces to a processed source
