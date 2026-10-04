import type {LLMProvider} from '../ai/provider';
import type {ResearchProvider} from '../research/provider';
import type {Episode} from '../episode/schema';
import type {FactPack} from '../research/schemas';
import type {VisualPlan, VisualDiversityReport} from '../visual/schemas';
import type {ResolvedVisualStrategy} from './renderStrategy';

export type FactoryOptions = {
  id: string;
  topic?: string;
  durationSeconds?: number;
  durationWasProvided?: boolean;
  model?: string;
  maxSources?: number;
  force?: boolean;
  draft?: boolean;
  skipRender?: boolean;
  resume?: boolean;
  briefPath?: string;
  factsPath?: string;
};

export type FactoryStageName = '01 PREFLIGHT' | '02 CONTENT BRIEF' | '03 RESEARCH PLAN' | '04 RESEARCH' | '05 FACT PACK' | '06 VERIFIED EPISODE' | '07 VISUAL PLAN' | '08 QUALITY GATES' | '09 RENDER' | '10 DELIVERY PACKAGE';
export type FactoryStageStatus = 'started' | 'succeeded' | 'failed' | 'skipped' | 'reused';
export type FactoryStageRecord = {stage: FactoryStageName; status: FactoryStageStatus; at: string; durationMs?: number; message?: string};

export type ClaimTraceScene = {sceneId: string; text: string[]; claimIds: string[]; sourceIds: string[]; attributionStatus: 'linked' | 'unmapped'};
export type ClaimTrace = {episodeId: string; method: 'verified-claim-ids-v1'; scenes: ClaimTraceScene[]};

export type FactoryReport = {
  id: string;
  topic: string;
  duration: number;
  model: string;
  researchProvider: string;
  sourceCount: number;
  verifiedClaimCount: number;
  unverifiedClaimCount: number;
  publicationReady: boolean;
  sceneCount: number;
  visualDiversityScore: number;
  uniqueArchetypes: number;
  visualFallbacks: string[];
  episodeValidation: 'passed' | 'failed';
  renderStatus: 'pending' | 'rendered' | 'skipped' | 'failed';
  outputPath: string | null;
  releaseStatus: 'releaseCandidate' | 'draft' | 'blocked';
  draftLabel?: 'DRAFT — NOT PUBLICATION READY' | 'DRAFT — REVIEW REQUIRED';
  stageDurationsMs: Partial<Record<FactoryStageName, number>>;
  stages: FactoryStageRecord[];
  llmCallCount: number;
  researchPlannedQueryCount: number;
  researchQueryCount: number;
  visualQaRepairAttempts: number;
  tokenUsage: {inputTokens: number; outputTokens: number; totalTokens: number};
  claimTracePath: string;
  createdAt: string;
  warnings: string[];
  errors: string[];
};

export type FactoryResult = {
  runDirectory: string;
  deliveryDirectory: string;
  report: FactoryReport;
  episode: Episode;
  factPack: FactPack;
  visualPlan: VisualPlan;
  visualDiversity: VisualDiversityReport;
  visualStrategies: Record<string, ResolvedVisualStrategy>;
  outputPath: string | null;
};

export type FactoryDependencies = {
  projectRoot?: string;
  llm?: LLMProvider;
  research?: ResearchProvider;
  render?: (input: {episodePath: string; outputPath: string; strategies: Record<string, ResolvedVisualStrategy>; onProgress?: (progress: number) => void}) => Promise<string>;
  renderStills?: (input: {episodePath: string; outputDirectory: string; frames: readonly number[]; strategies: Record<string, ResolvedVisualStrategy>}) => Promise<string[]>;
  env?: NodeJS.ProcessEnv;
  now?: () => Date;
};
