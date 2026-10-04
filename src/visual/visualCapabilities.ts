import type {VisualArchetype} from './schemas';

export type CapabilityStatus = 'supported' | 'limited' | 'unsupported';
export const visualCapabilities: Record<VisualArchetype | 'external_design', {status: CapabilityStatus; primitives: string[]; fallback: VisualArchetype}> = {
  network: {status: 'supported', primitives: ['NetworkStage', 'Node', 'Edge', 'FlowParticles'], fallback: 'process_flow'},
  agents: {status: 'supported', primitives: ['AgentToken', 'VehicleToken'], fallback: 'object_world'},
  physical_system: {status: 'limited', primitives: ['Counter', 'VehicleToken', 'NetworkStage'], fallback: 'agents'},
  geometric: {status: 'supported', primitives: ['GlowPath', 'HighlightRing', 'Formula'], fallback: 'process_flow'},
  probability: {status: 'supported', primitives: ['ProbabilityBar', 'Counter'], fallback: 'data_curve'},
  data_curve: {status: 'supported', primitives: ['MiniChart', 'Counter'], fallback: 'scale_comparison'},
  timeline_archive: {status: 'supported', primitives: ['Timeline', 'Formula'], fallback: 'process_flow'},
  object_world: {status: 'limited', primitives: ['Node', 'AgentToken', 'VehicleToken'], fallback: 'agents'},
  process_flow: {status: 'supported', primitives: ['Arrow', 'GlowPath', 'FlowParticles'], fallback: 'network'},
  field_wave: {status: 'limited', primitives: ['GlowPath', 'AtmosphericParticles'], fallback: 'geometric'},
  scale_comparison: {status: 'supported', primitives: ['Counter', 'MiniChart', 'ProbabilityBar'], fallback: 'data_curve'},
  spatial_map: {status: 'limited', primitives: ['NetworkStage', 'GlowPath', 'Label'], fallback: 'process_flow'},
  external_design: {status: 'unsupported', primitives: [], fallback: 'object_world'},
};

export const visualCapabilitySummary = Object.entries(visualCapabilities).map(([name, capability]) => ({name: name.replace(/_/g, '-'), ...capability}));
