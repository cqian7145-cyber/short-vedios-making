# Recraft API Notes

Verified against Recraft's official API documentation on 2026-10-05.

## Implementation choices

- **Endpoint:** `POST https://external.api.recraft.ai/v1/images/generations`
- **Model:** `recraftv3`. The selected style's V3 model family was confirmed by a
  safe provider compatibility message; Recraft documents model/style family matching
  for custom styles.
- **Style parameter:** `style_id`, sourced only from `process.env.RECRAFT_STYLE_ID`.
- **Request format:** JSON; `n: 1`; output requested with `response_format: b64_json` and
  `image_format: png`.
- **Dimensions:** semantic aspect ratios map to the documented `size` ratio form; default
  is `1:1`, scene validation requests use `16:9`.
- **Response:** first `data` image's `b64_json` is schema-validated and decoded locally.
- **Transparency:** current generation endpoint reference documents no transparency
  parameter. `transparentBackground: true` is rejected explicitly; the provider does not
  guess an undocumented field. The style-validation prompts request quiet composition,
  and dark-background fit is evaluated from actual output.
- **Async behavior:** the selected endpoint returns a synchronous JSON response in the
  documented generation examples; this implementation uses a single direct HTTP request.

The provider never logs the Authorization header, API key, style identifier, or raw
response body. HTTP failures report status only. The user-selected style ID itself is
intentionally omitted from these notes.

Sources: [endpoints](https://www.recraft.ai/docs/api-reference/endpoints),
[image inputs/results](https://www.recraft.ai/docs/api-reference/image-inputs-and-results),
[V4 Styles](https://www.recraft.ai/docs/api-reference/models/recraft-v4-styles),
[styles](https://www.recraft.ai/docs/api-reference/styles).
