# Visual Quality Repair — visual-quality-repair-v1

Improve the supplied VisualPlan only to address the listed visual diversity and quality warnings.

- Preserve episode meaning, all verified facts, safe conceptual claims, exact scene IDs, and scene order.
- Change visual archetypes, semantic layout variants, motion ideas, continuity, and capability choices only as needed to resolve the warnings.
- Use only the canonical archetypes and capability IDs in the supplied registry.
- Keep `requiredCapabilities` to registry IDs and provide supported fallbacks for limited archetypes.
- Do not change Episode copy, facts, source claims, or research data.
- Do not add unsupported statistics, citations, or new factual claims.
- Return exactly one complete VisualPlan JSON object. No markdown fences or commentary.
