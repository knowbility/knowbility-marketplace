# Opportunity Discovery

**Finding Tags:**
- **VALIDATED_PAIN** — Multiple independent sources (community posts, reviews, forum threads) confirm people experience and complain about this problem. High-confidence opportunity signal.
- **EMERGING_NEED** — Early signals of a need that is growing but not yet widely discussed. Limited evidence, but direction is clear. Worth monitoring.
- **SATURATED_SPACE** — Multiple existing solutions already address this need. The market is crowded. Differentiation would require a novel angle.
- **UNDERSERVED_GAP** — People describe this problem but existing solutions either don't address it, address it poorly, or are too expensive/complex for this niche. High opportunity signal.
- **WILLINGNESS_TO_PAY** — Evidence that people in this niche actively spend money (or have expressed willingness to spend) to solve this problem. Strongest opportunity indicator when combined with UNDERSERVED_GAP.

**Staleness Threshold:** 2 years — market opportunities are time-sensitive

**What to Explore:**
- Niche identity and boundaries — who exactly are these people? Demographics, psychographics, defining constraints. What makes this niche a niche rather than a broad market?
- Watering holes and communication patterns — where do these people gather online and offline? Which communities, forums, subreddits, Slack/Discord groups, conferences, newsletters? This determines where evidence lives.
- Recurring pain points and complaints — what do they complain about repeatedly? What frustrates them about their current tools, workflows, or situation? Look for frequency and emotional intensity.
- Current spending and tool stack — what do they already pay for? What tools, services, and subscriptions do they use? What does their current workflow look like? This reveals both budget and replacement opportunity.
- Workarounds and DIY solutions — what have they built or cobbled together to solve problems no product addresses? Spreadsheets, scripts, manual processes, duct-tape integrations. These are the strongest signals of unmet demand.
- Willingness to pay signals — where do people express that they would pay for a solution? Look for "shut up and take my money" posts, feature requests with upvotes, crowdfunding patterns, bounties.
- Existing solution landscape — who is already building for this niche? What do those solutions cover, miss, or get wrong? Where are users dissatisfied despite having options?
- Opportunity sizing and feasibility — how large is the niche? Is it growing or shrinking? Can a viable business be built serving this audience at their price sensitivity?

**Source Credibility Hierarchy:**
- Community posts where people describe their own problems in their own words (Reddit, Indie Hackers, niche forums, Discord servers, Twitter/X threads) → highest credibility for pain point identification. Unprompted complaints are gold.
- User reviews and product feedback on existing tools (G2, Capterra, Product Hunt comments, app store reviews) → high for understanding what current solutions get wrong
- Survey data with disclosed methodology and sample size (niche surveys, community polls with >50 responses) → high for quantifying pain and willingness to pay
- Job postings, freelancer profiles, and portfolio sites for the niche → high for understanding workflows, tool stacks, and budget signals
- Industry reports on the broader market this niche inhabits (Gartner, Forrester, IBISWorld) → moderate for sizing; low for niche-specific pain because they rarely go deep enough
- Competitor websites, landing pages, and pricing pages → moderate for understanding what exists; low for claims about effectiveness
- Vendor marketing, case studies, and testimonials → low credibility for actual user problems. Useful only for mapping what solutions claim to do.
- AI-generated summaries without sources → not a source, do not use

**Boundaries:**
- This project is opportunity research, not product design. The output is a ranked list of opportunity areas with evidence. Do not produce wireframes, feature specs, PRDs, or go-to-market plans.
- Do not fabricate demand. If evidence of a pain point is thin or only comes from a single source, tag it as EMERGING_NEED, not VALIDATED_PAIN. A vivid anecdote is not the same as a pattern.
- Do not conflate your own assumptions with user evidence. Every pain point must trace to at least one source where a real person described the problem. "It seems like they would need X" is not evidence.
- Distinguish between problems people complain about and problems people would pay to solve. Complaints are necessary but not sufficient — look for willingness-to-pay signals before ranking an opportunity highly.

**Typical shape (non-binding):** 6-8 phases, adapted by the plan generator based on niche specificity and available evidence. Typical structure:
- Phase 1: Niche definition and audience profiling (who are they, how many, what defines them)
- Phase 2: Watering hole mapping and community discovery (where they talk, what platforms, what formats)
- Phase 3: Pain point extraction and complaint analysis (what they complain about, frequency, intensity)
- Phase 4: Current tool stack and spending patterns (what they pay for now, what they use, workflow gaps)
- Phase 5: Existing solution audit (who builds for this niche, what gets good/bad reviews, where solutions fall short)
- Phase 6: Demand validation and willingness to pay (evidence people would pay, pricing signals, market sizing)
- Phase 7: Synthesis — opportunity ranking with evidence map, gap analysis, and recommended exploration areas

The plan generator should collapse phases when the niche is narrow (e.g., combine phases 2 and 3 if the niche has only one or two community hubs) and expand phases when the niche is broad or spans multiple sub-segments.

**Success Criteria:**
1. The niche is defined with specific boundaries — the reader knows exactly who is in scope and who is adjacent but excluded
2. At least 3 community sources (forums, subreddits, Discord servers, etc.) have been identified and mined for pain point evidence
3. Every pain point tagged as VALIDATED_PAIN traces to complaints from at least 3 independent sources
4. The existing solution landscape includes at least 5 current tools/services with documented user sentiment (positive and negative)
5. Every opportunity ranked in the synthesis has both a pain evidence citation and a willingness-to-pay assessment (confirmed, plausible, or unknown)
6. All outputs have been audited for unsupported claims — no opportunity is presented as validated without traced evidence
