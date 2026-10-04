# Content Brief Repair — repair-content-brief-v1

Repair the supplied ContentBrief JSON after local schema validation failed.

- Preserve the original topic and idea.
- Fix only schema/validation violations reported below.
- Respect every field length, required field, enum, numeric bound, and array limit in the supplied schema.
- Keep values concise; do not use paragraph-length fields.
- Do not add research claims, citations, facts, or unsupported specifics.
- Do not rewrite the whole concept unnecessarily.
- Return JSON only, with no Markdown or explanation.
