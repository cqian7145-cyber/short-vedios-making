# Vibe Knowledge — Visual Language

This guide defines the shared visual grammar for every Vibe Knowledge episode. A historical trace, a moving system, and a scientific field should feel like observations made inside one quiet, coherent world.

## Color

- Use near-black and deep navy as the ground: `background.primary`, `background.secondary`, and `background.mid` in `vibeTheme`.
- Set readable type in warm ivory. Secondary copy should step down in opacity before changing hue.
- Reserve warm gold for a measured signal: a key relationship, a timeline point, a changing value, or a conclusion.
- Use muted red or cyan sparingly to distinguish opposing forces, wave components, or an exception.
- Keep glows close to their source. Never let accent color become a large field of light.

## Typography

- Use the system serif fallback for year marks, reflective titles, and formulas; use a neutral sans-serif for body copy; use a system monospace for measurements.
- Follow the shared variants in `src/components/typography/Type.tsx`: hero, title, year, section label, body, caption, subtitle, numeric, and formula.
- Use large years as spatial anchors, with wide margins and deliberate empty space. They should feel printed into a scene, not placed in a card.
- Keep captions small and quiet. Technical numbers are tabular and precise. Give titles room to breathe.
- Keep safe-area and type-size decisions in `vibeTheme`; use safe system font fallbacks and do not add font files.

## Background

- Compose `DarkGradient`, `AtmosphericParticles`, and `SubtleTexture` as separate, low-contrast layers.
- Particles are sparse, deterministic, slow, and subordinate to the subject. Fine grid and paper texture should only emerge when a viewer looks for them.
- Use vignette and glow to guide attention. Preserve subtitle contrast and keep texture away from high-contrast noise.
- Do not add expensive turbulence filters, stacked large blurs, or a dense star field.

## Camera

- Use the shared `CameraDrift` presets: `slowPushIn`, `slowPullBack`, `driftLeft`, `driftRight`, and `parallax`.
- Keep scale changes close to one and travel measured across the full shot. Use motion to reveal relationships, not to announce a transition.
- Camera motion and all particle positions must be derived from Remotion frames. No wall-clock time or unseeded randomness.

## Transitions

- Prefer `SpatialCrossfade` to let the next observation enter the existing scene with a small directional drift.
- Use `AtmosphericFade` as a soft tonal breath between chapters, not a blackout or flash.
- Use `FocusTransition` to guide the eye toward an area while retaining the feeling of shared space.
- Keep the background and camera language continuous. Avoid hard cuts unless the story needs a deliberate discontinuity.

## Subtitles

- Place English subtitles within the shared lower-third safe area. Keep copy to two lines at most.
- Use a quiet opacity and short vertical reveal, then a soft fade. Highlight one short phrase only when it adds meaning.
- For busy diagrams, use a slight text shadow or diffuse local backing. Never use a large caption panel, per-word movement, or karaoke timing.

## Diagrams

- Let paths, particles, pulses, spacing, and changing measurements explain the relationship.
- Prefer a few legible marks over a complete diagram. Give paths visible origin and destination, and let motion show direction.
- Keep labels near the thing they describe. Use the line, color, and type tokens consistently. Keep marks thin and glow restrained.

## Charts

- Treat charts as part of the physical scene: fine axes, a small number of ticks, muted labels, and one highlighted change.
- Show one meaningful variable at a time. Avoid the visual grammar of an analytics tool or an executive dashboard.

## Historical scenes

- Use years, locations, archival marks, manuscript-like rules, and quiet formulas to evoke a period.
- Use abstract diagrams and authored typography. Do not use real-person photos or copied illustrations, logos, marks, or source footage.
- Suggest documents with paper texture and annotation; never frame every fact in a floating card.

## Scientific scenes

- Use a field, wave, orbit, geometry, or distribution as a continuous visual world. Keep the mathematical mark readable and allow negative space around it.
- Show relationships through motion and proportion. Use formulas as small supporting evidence, not as a wall of notation.

## Negative space

- Protect broad quiet areas around the primary subject. Place the secondary cue at a different scale or in a different quadrant.
- Keep the title, subtitle, and diagram inside `vibeTheme.safeArea`. Avoid crowding the edges or filling the whole frame with labels.

## Do / Don’t

**Do:** move slowly; use a strong hierarchy; let one warm accent carry meaning; keep backgrounds quiet; make the world feel continuous; use deterministic frame-based motion.

**Don’t:**

- Use a dashboard layout or card grid.
- Use glassmorphism UI or a purple/blue SaaS aesthetic.
- Use generic neon cyberpunk, a stock icon wall, or copied creator assets.
- Use giant text that covers the whole frame or excessive rounded rectangles.
- Use TikTok caption animation, karaoke subtitles, rapid cuts, wipes, flash, or PowerPoint scenes.
- Add unseeded `Math.random()`, `Date.now()`, `setInterval()`, or `setTimeout()` to rendered animation.
