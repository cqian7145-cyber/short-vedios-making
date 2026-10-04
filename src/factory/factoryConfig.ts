export const DEFAULT_FACTORY_DURATION_SECONDS = 150;
export const MIN_FACTORY_DURATION_SECONDS = 30;
export const MAX_FACTORY_DURATION_SECONDS = 600;
export const PRODUCTION_DURATION_MIN_SECONDS = 120;
export const PRODUCTION_DURATION_MAX_SECONDS = 180;
export const DEFAULT_FACTORY_MAX_SOURCES = 20;
export const MIN_NODE_MAJOR = 20;

export const FACTORY_STAGES = [
  '01 PREFLIGHT', '02 CONTENT BRIEF', '03 RESEARCH PLAN', '04 RESEARCH', '05 FACT PACK',
  '06 VERIFIED EPISODE', '07 VISUAL PLAN', '08 QUALITY GATES', '09 RENDER', '10 DELIVERY PACKAGE',
] as const;

export const EPISODE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{1,79}$/;

export const FACTORY_PATHS = {
  runs: 'runs',
  research: 'research',
  generated: 'generated',
  episodes: 'episodes/generated',
  output: 'output',
  deliveries: 'deliveries',
  qa: 'qa',
} as const;
