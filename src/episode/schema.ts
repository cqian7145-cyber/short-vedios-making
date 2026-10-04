import { z } from 'zod';
const text = z.string().min(1).max(1000);
const id = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/);
const number = z.number().finite();
const accent = z.enum(['gold', 'red', 'cyan']);
const pair = z.tuple([text, text]);
const networkId = id.optional();
const path = z.string().min(1).max(4000).regex(/^[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]+$/, 'Expected SVG path geometry only');
const base = { id, durationSeconds: number.positive(), transition: z.strictObject({ overlapSeconds: number.nonnegative().optional(), direction: z.enum(['left', 'right']).optional() }).optional(), subtitle: text.optional(), claimIds: z.array(z.string().regex(/^claim-[a-z0-9-]{2,80}$/)).max(30).optional(), intent: z.strictObject({ focus: text.optional(), accent: accent.optional(), density: z.enum(['sparse', 'balanced', 'dense']).optional(), camera: z.enum(['slowPushIn', 'slowPullBack', 'driftLeft', 'driftRight', 'parallax']).optional() }).optional() };
const network = z.strictObject({ id, nodes: z.array(z.strictObject({ id, label: text, x: number, y: number })).min(1), edges: z.array(z.strictObject({ id, from: id, to: id, path: path.optional(), label: text.optional(), role: z.enum(['base', 'added']).optional() })), routes: z.array(z.strictObject({ id, label: text, path, accent: accent.optional() })), addedEdgeId: id.optional(), bottleneck: z.strictObject({ x: number, y: number, nodeId: id.optional() }).optional() });
const participants = { participants: pair.optional(), relationshipLabel: text.optional() };
const simulation = z.discriminatedUnion('mode', [
    z.strictObject({ mode: z.literal('networkFlow'), networkId: id, eyebrow: text, metricLabel: text, beforeCaption: text, afterCaption: text, from: number, to: number, unit: z.string(), baselineRouteCounts: z.record(id, number.int().nonnegative().max(200)), redistributedRouteCounts: z.record(id, number.int().nonnegative().max(200)), addedEdgeId: id, newRouteId: id, bottleneckLabel: text }),
    z.strictObject({ mode: z.literal('bidding'), eyebrow: text, metricLabel: text, participants: z.tuple([z.strictObject({ id, label: text, accent: accent.optional() }), z.strictObject({ id, label: text, accent: accent.optional() })]), bids: z.array(z.strictObject({ bidderId: id, amount: number.nonnegative() })).min(2).max(100), prizeValue: number.positive(), currencyPrefix: z.string().max(8), relationshipLabel: text, exceedsLabel: text })
]);
export const EpisodeSceneSchema = z.discriminatedUnion('type', [
    z.strictObject({ ...base, type: z.literal('hook'), content: z.strictObject({ networkId, eyebrow: text, headline: text, emphasis: text, question: text, ...participants }) }),
    z.strictObject({ ...base, type: z.literal('setup'), content: z.strictObject({ networkId, eyebrow: text, title: text, routeLabel: text.optional(), destinationLabel: text.optional(), ...participants }) }),
    z.strictObject({ ...base, type: z.literal('history'), content: z.strictObject({ eyebrow: text, year: text, name: text, mark: text, formula: text, formulaAnnotation: text }) }),
    z.strictObject({ ...base, type: z.literal('diagram'), content: z.strictObject({ networkId: id, eyebrow: text, title: text, footnote: text, highlightNodeId: id.optional(), highlightEdgeId: id.optional(), annotations: z.array(z.strictObject({ label: text, detail: text.optional(), anchorNodeId: id })) }) }),
    z.strictObject({ ...base, type: z.literal('simulation'), content: simulation }),
    z.strictObject({ ...base, type: z.literal('comparison'), content: z.strictObject({ networkId, eyebrow: text, metricLabel: text, before: number, after: number, unit: z.string(), prefix: z.string().optional(), decimals: number.int().min(0).max(6).optional(), beforeLabel: text, afterLabel: text }) }),
    z.strictObject({ ...base, type: z.literal('reveal'), content: z.strictObject({ networkId, eyebrow: text, headline: text, emphasis: text, highlightNodeId: id.optional(), highlightEdgeId: id.optional(), ...participants }) }),
    z.strictObject({ ...base, type: z.literal('explanation'), content: z.strictObject({ networkId, individualLabel: text, individualStatement: text, systemLabel: text, systemStatement: text, principle: text, bottleneckLabel: text, driverLabels: pair, sharedLinkLabel: text, focusNodeId: id.optional() }) }),
    z.strictObject({ ...base, type: z.literal('ending'), content: z.strictObject({ networkId, concept: text, summary: text, brand: text }) })
]);
export const EpisodeSchema = z.strictObject({ schemaVersion: z.literal(1), id, title: text, fps: z.literal(30), width: z.literal(1920), height: z.literal(1080), metadata: z.strictObject({ topic: text.optional(), language: z.literal('en').optional(), category: text.optional() }).optional(), scenes: z.array(EpisodeSceneSchema).min(1), networks: z.record(id, network) });
export type Episode = z.infer<typeof EpisodeSchema>;
export type EpisodeScene = z.infer<typeof EpisodeSceneSchema>;
