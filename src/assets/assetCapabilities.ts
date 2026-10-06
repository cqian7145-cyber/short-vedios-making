import type {VisualArchetype} from '../visual/schemas';
import {RECRAFT_ASSET_KINDS, type RecraftAssetBrief} from './assetStrategySchema';

export const recraftCapabilityRegistry = {
  provider: 'recraft' as const,
  allowedAssetKinds: RECRAFT_ASSET_KINDS,
  atomicFirst: true,
  scenePlateAllowedByDefault: false,
  strengths: ['character', 'ordinary object', 'machine', 'vehicle', 'architecture', 'industrial object', 'editorial illustration'],
  highRiskSubjects: ['auction paddle', 'rare specialized handheld tool', 'specialized handheld instrument'],
  proceduralOnlyKinds: [
    'chart', 'formula', 'arrow', 'branching-diagram', 'network', 'timeline',
    'probability-visual', 'coordinate-system', 'precise-flow-diagram',
    'mathematical-geometry', 'text-label', 'number', 'table',
  ],
} as const;

export const ARCHETYPE_STRATEGY_DEFAULTS: Record<VisualArchetype, 'procedural' | 'hybrid' | 'recraft'> = {
  network: 'procedural',
  agents: 'hybrid',
  physical_system: 'hybrid',
  geometric: 'procedural',
  probability: 'procedural',
  data_curve: 'procedural',
  timeline_archive: 'procedural',
  object_world: 'recraft',
  process_flow: 'procedural',
  field_wave: 'procedural',
  scale_comparison: 'procedural',
  spatial_map: 'procedural',
};

export const VISUAL_CAPABILITY_TO_PROCEDURAL_ELEMENT: Record<string, string> = {
  'network-stage': 'network-diagram',
  node: 'diagram-nodes',
  edge: 'relationship-lines',
  'flow-particles': 'flow-particles',
  'agent-token': 'agent-motion',
  'vehicle-token': 'vehicle-motion',
  counter: 'numeric-counter',
  'glow-path': 'highlight-path',
  'highlight-ring': 'focus-ring',
  formula: 'formula',
  'probability-bar': 'probability-visual',
  'mini-chart': 'chart',
  timeline: 'timeline',
  arrow: 'arrow',
  'atmospheric-particles': 'atmospheric-particles',
  label: 'text-label',
};

const HIGH_RISK_PATTERNS = [
  /\bauction\s+paddle\b/i,
  /\brare\s+(?:specialized\s+)?handheld\s+(?:tool|instrument)\b/i,
  /\bspecialized\s+handheld\s+(?:tool|instrument)\b/i,
];

export function semanticRiskForSubject(subject: string, proposed: RecraftAssetBrief['semanticRisk'] = 'low') {
  return HIGH_RISK_PATTERNS.some((pattern) => pattern.test(subject)) ? 'high' : proposed;
}

export function isProceduralOnlyConcept(value: string): boolean {
  return /\b(chart|graph|formula|equation|arrow|branching(?:[- ]diagram|[- ]choice)?|network|timeline|probability|coordinate system|flow diagram|mathematical geometry|text label|number|table)\b/i.test(value);
}

export function proceduralElementsFromCapabilities(capabilityIds: string[]): string[] {
  return [...new Set(capabilityIds.map((id) => VISUAL_CAPABILITY_TO_PROCEDURAL_ELEMENT[id]).filter((value): value is string => Boolean(value)))];
}

export function isInformationalElement(value: string): boolean {
  return /\b(network|diagram|relationship|comparison|chart|graph|formula|equation|arrow|timeline|probability|counter|data|metric|flow|count)\b/i.test(value);
}
