import {appendFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {FactoryReport, FactoryStageName, FactoryStageRecord, FactoryStageStatus} from './factoryTypes';

export const redactFactoryMessage = (message: string, env: NodeJS.ProcessEnv = process.env): string => {
  let safe = message;
  for (const name of ['DEEPSEEK_API_KEY', 'TAVILY_API_KEY', 'OPENAI_API_KEY']) {
    const secret = env[name];
    if (secret) safe = safe.split(secret).join('[redacted]');
  }
  return safe.replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').slice(0, 1500);
};

export function createFactoryReport(input: {id: string; topic: string; duration: number; model: string; claimTracePath: string; now: Date}): FactoryReport {
  return {
    id: input.id, topic: input.topic, duration: input.duration, model: input.model, researchProvider: 'tavily',
    sourceCount: 0, verifiedClaimCount: 0, unverifiedClaimCount: 0, publicationReady: false, sceneCount: 0,
    visualDiversityScore: 0, uniqueArchetypes: 0, visualFallbacks: [], episodeValidation: 'failed',
    renderStatus: 'pending', outputPath: null, releaseStatus: 'blocked', stageDurationsMs: {}, stages: [],
    llmCallCount: 0, researchPlannedQueryCount: 0, researchQueryCount: 0, visualQaRepairAttempts: 0,
    tokenUsage: {inputTokens: 0, outputTokens: 0, totalTokens: 0}, claimTracePath: input.claimTracePath,
    createdAt: input.now.toISOString(), warnings: [], errors: [],
  };
}

export async function writeFactoryReport(runDirectory: string, report: FactoryReport): Promise<void> {
  await mkdir(runDirectory, {recursive: true});
  await writeFile(path.join(runDirectory, '09-factory-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

export async function appendFactoryLog(runDirectory: string, line: string, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  await mkdir(runDirectory, {recursive: true});
  await appendFile(path.join(runDirectory, 'factory.log'), `${redactFactoryMessage(line, env)}\n`, 'utf8');
}

export async function runFactoryStage<T>(input: {
  stage: FactoryStageName;
  runDirectory: string;
  report: FactoryReport;
  now: () => Date;
  env: NodeJS.ProcessEnv;
  reused?: boolean;
  onStatus?: (message: string) => void;
  operation: () => Promise<T>;
}): Promise<T> {
  const start = input.now();
  const started: FactoryStageRecord = {stage: input.stage, status: 'started', at: start.toISOString()};
  input.report.stages.push(started);
  input.onStatus?.(`${input.stage}: started`);
  await appendFactoryLog(input.runDirectory, `${input.stage} started`, input.env);
  await writeFactoryReport(input.runDirectory, input.report);
  try {
    const value = await input.operation();
    const durationMs = Math.max(0, input.now().getTime() - start.getTime());
    const status: FactoryStageStatus = input.reused ? 'reused' : 'succeeded';
    input.report.stages.push({stage: input.stage, status, at: input.now().toISOString(), durationMs});
    input.report.stageDurationsMs[input.stage] = durationMs;
    await appendFactoryLog(input.runDirectory, `${input.stage} ${status} (${durationMs} ms)`, input.env);
    await writeFactoryReport(input.runDirectory, input.report);
    input.onStatus?.(`${input.stage}: ${status}`);
    return value;
  } catch (error) {
    const durationMs = Math.max(0, input.now().getTime() - start.getTime());
    const message = redactFactoryMessage(error instanceof Error ? error.message : String(error), input.env);
    input.report.stages.push({stage: input.stage, status: 'failed', at: input.now().toISOString(), durationMs, message});
    input.report.stageDurationsMs[input.stage] = durationMs;
    if (!input.report.errors.includes(message)) input.report.errors.push(message);
    await appendFactoryLog(input.runDirectory, `${input.stage} failed (${durationMs} ms): ${message}`, input.env);
    await writeFactoryReport(input.runDirectory, input.report);
    input.onStatus?.(`${input.stage}: failed`);
    throw error;
  }
}

export async function recordSkippedStage(input: {stage: FactoryStageName; runDirectory: string; report: FactoryReport; message: string; now: () => Date; env: NodeJS.ProcessEnv; onStatus?: (message: string) => void}): Promise<void> {
  const at = input.now().toISOString();
  input.report.stages.push({stage: input.stage, status: 'skipped', at, message: redactFactoryMessage(input.message, input.env)});
  await appendFactoryLog(input.runDirectory, `${input.stage} skipped: ${input.message}`, input.env);
  await writeFactoryReport(input.runDirectory, input.report);
  input.onStatus?.(`${input.stage}: skipped`);
}
