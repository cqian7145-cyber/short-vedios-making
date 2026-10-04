# VisualPlan Structural Repair — repair-visual-plan-v1

Repair the supplied VisualPlan after local schema or semantic validation failed.

- Preserve the episode meaning, supported facts, and exact scene order.
- Fix only the listed VisualPlan validation violations.
- Use only the canonical capability IDs present in the supplied capability registry.
- Use exact existing Episode `sceneId` values, with the same count and order.
- Keep visual archetypes in archetype fields and capability IDs only in `requiredCapabilities`.
- Add a valid `fallbackArchetype` when the selected primary archetype is limited.
- Do not edit Episode copy, facts, source claims, or research data.
- Do not rewrite valid concept choices unnecessarily.
- Respect all VisualPlan field and array limits.
- Return JSON only. Do not include markdown fences or commentary.
