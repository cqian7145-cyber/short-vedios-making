import {VISUAL_CAPABILITY_IDS, type VisualArchetype, type VisualCapabilityId} from './schemas';

export type CapabilityStatus = 'supported' | 'limited' | 'unsupported';
export const visualCapabilities: Record<VisualArchetype, {status: CapabilityStatus; capabilities: VisualCapabilityId[]; fallback: VisualArchetype}> = {
  network: {status: 'supported', capabilities: ['network-stage', 'node', 'edge', 'flow-particles'], fallback: 'process_flow'},
  agents: {status: 'supported', capabilities: ['agent-token', 'vehicle-token'], fallback: 'object_world'},
  physical_system: {status: 'limited', capabilities: ['counter', 'vehicle-token', 'network-stage'], fallback: 'agents'},
  geometric: {status: 'supported', capabilities: ['glow-path', 'highlight-ring', 'formula'], fallback: 'process_flow'},
  probability: {status: 'supported', capabilities: ['probability-bar', 'counter'], fallback: 'data_curve'},
  data_curve: {status: 'supported', capabilities: ['mini-chart', 'counter'], fallback: 'scale_comparison'},
  timeline_archive: {status: 'supported', capabilities: ['timeline', 'formula'], fallback: 'process_flow'},
  object_world: {status: 'limited', capabilities: ['node', 'agent-token', 'vehicle-token'], fallback: 'agents'},
  process_flow: {status: 'supported', capabilities: ['arrow', 'glow-path', 'flow-particles'], fallback: 'network'},
  field_wave: {status: 'limited', capabilities: ['glow-path', 'atmospheric-particles'], fallback: 'geometric'},
  scale_comparison: {status: 'supported', capabilities: ['counter', 'mini-chart', 'probability-bar'], fallback: 'data_curve'},
  spatial_map: {status: 'limited', capabilities: ['network-stage', 'glow-path', 'label'], fallback: 'process_flow'},
};

export const visualCapabilitySummary = Object.entries(visualCapabilities).map(([name, capability]) => ({name, ...capability}));

export const isRegisteredVisualCapability = (id: string): id is VisualCapabilityId =>
  VISUAL_CAPABILITY_IDS.includes(id as VisualCapabilityId)
  && Object.values(visualCapabilities).some((entry) => entry.capabilities.includes(id as VisualCapabilityId));
