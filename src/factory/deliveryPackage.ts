import {copyFile, link, mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import type {NormalizedEpisode} from '../episode/normalizeEpisode';
import type {Episode} from '../episode/schema';
import type {FactPack} from '../research/schemas';
import type {VisualPlan} from '../visual/schemas';
import {buildSceneTimeline} from '../engine/timeline';
import type {ClaimTrace, FactoryReport} from './factoryTypes';
import type {RenderStrategyResult} from './renderStrategy';

const stringsIn = (value: unknown): string[] => {
  if (typeof value === 'string') return value.trim() ? [value.trim()] : [];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === 'object') return Object.entries(value).filter(([key]) => key !== 'claimIds').flatMap(([, child]) => stringsIn(child));
  return [];
};

export function buildClaimTrace(episode: Episode, factPack: FactPack): ClaimTrace {
  const verifiedClaims = new Map(factPack.verifiedClaims.map((claim) => [claim.id, claim]));
  return {
    episodeId: episode.id,
    method: 'verified-claim-ids-v1',
    scenes: episode.scenes.map((scene) => {
      const claimIds = [...new Set(scene.claimIds ?? [])];
      const missing = claimIds.filter((claimId) => !verifiedClaims.has(claimId));
      if (missing.length) throw new Error(`Episode scene ${scene.id} references claims outside verifiedClaims: ${missing.join(', ')}`);
      const sourceIds = [...new Set(claimIds.flatMap((claimId) => verifiedClaims.get(claimId)?.sourceIds ?? []))];
      return {sceneId: scene.id, text: [...stringsIn(scene.content), ...(scene.subtitle ? [scene.subtitle] : [])], claimIds, sourceIds, attributionStatus: claimIds.length ? 'linked' : 'unmapped'};
    }),
  };
}

const sceneHeading = (scene: NormalizedEpisode['scenes'][number]): string => {
  const content = scene.content;
  if ('headline' in content) return content.headline.replace(/\s+/g, ' ').slice(0, 70);
  if ('title' in content) return content.title.slice(0, 70);
  if ('concept' in content) return content.concept.slice(0, 70);
  if ('principle' in content) return content.principle.slice(0, 70);
  if ('metricLabel' in content) return content.metricLabel.slice(0, 70);
  if ('name' in content) return content.name.slice(0, 70);
  return scene.id;
};

const formatTime = (frame: number, fps: number): string => {
  const totalSeconds = Math.floor(frame / fps);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

export function generateChapters(episode: NormalizedEpisode): string[] {
  return buildSceneTimeline(episode.scenes).map((entry) => `${formatTime(entry.startFrame, episode.fps)} ${sceneHeading(entry.spec)}`);
}

export function generateYoutubeMarkdown(episode: NormalizedEpisode, factPack: FactPack): string {
  const chapters = generateChapters(episode);
  const title = episode.title.replace(/[\r\n]+/g, ' ').trim();
  const summary = factPack.summary.replace(/[\r\n]+/g, ' ').trim();
  const keywords = [...new Set([episode.title, ...(episode.metadata?.topic ? [episode.metadata.topic] : []), 'counterintuitive knowledge', 'systems thinking', 'decision science'])]
    .flatMap((item) => item.split(/[^\p{L}\p{N}-]+/u)).map((word) => word.trim().toLowerCase()).filter((word) => word.length > 2).slice(0, 18);
  return [
    '# YouTube Metadata Package', '', '## Title Options', `1. ${title}`, `2. Why ${episode.metadata?.topic ?? title.replace(/[?.!]+$/g, '')}`, `3. The Counterintuitive Logic of ${title.replace(/[?.!]+$/g, '')}`,
    '', '## Description', summary, '', 'Sources used in research: see the accompanying source list.', '', '## Chapters', ...chapters,
    '', '## Pinned Comment Draft', 'Which part of this system felt most counterintuitive? Share the point where your intuition changed.',
    '', '## Keywords', keywords.join(', '), '', '## Thumbnail Brief', 'One dominant visual. Use 2–5 words maximum. Show a clear visual paradox with restrained contrast and no unsupported claim.', '',
  ].join('\n');
}

export function generateReviewChecklist(): string {
  return [
    '# Human Review Checklist', '', '## FACTS', '- [ ] Claims reviewed', '- [ ] No unsupported statistics', '- [ ] No fabricated attribution', '',
    '## VISUAL', '- [ ] Signature moment works', '- [ ] No repetitive node graph', '- [ ] Text is readable', '- [ ] Transitions are smooth', '',
    '## YOUTUBE', '- [ ] Title approved', '- [ ] Music added manually', '- [ ] Final audio levels checked', '- [ ] Upload manually', '',
  ].join('\n');
}

export function representativeFrames(input: {durationInFrames: number; signatureSceneIndex: number; episodeSceneCount: number; uniformCount?: number}): number[] {
  const count = input.uniformCount ?? 10;
  const lastFrame = Math.max(0, input.durationInFrames - 1);
  const evenlySpaced = Array.from({length: count}, (_, index) => Math.round(lastFrame * (index + 0.5) / count));
  const signatureFrame = Math.round(lastFrame * Math.max(0, Math.min(1, (input.signatureSceneIndex + 0.5) / Math.max(1, input.episodeSceneCount))));
  return [...new Set([...evenlySpaced, signatureFrame])].slice(0, 12);
}

export function findSignatureSceneIndex(plan: VisualPlan): number {
  const terms = plan.signatureMoment.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 3);
  let bestIndex = Math.floor(plan.scenePlans.length / 2);
  let bestScore = -1;
  plan.scenePlans.forEach((scene, index) => {
    const haystack = `${scene.visualSubject} ${scene.motionIdea}`.toLowerCase();
    const score = terms.reduce((sum, term) => sum + Number(haystack.includes(term)), 0);
    if (score > bestScore) { bestIndex = index; bestScore = score; }
  });
  return bestIndex;
}

export async function writeDeliveryPackage(input: {
  deliveryDirectory: string;
  episode: Episode;
  normalized: NormalizedEpisode;
  factPack: FactPack;
  visualPlan: VisualPlan;
  report: FactoryReport;
  claimTrace: ClaimTrace;
  strategy: RenderStrategyResult;
  outputVideoPath?: string;
  outputPath?: string | null;
}): Promise<void> {
  await mkdir(input.deliveryDirectory, {recursive: true});
  const writeJson = (file: string, value: unknown) => writeFile(path.join(input.deliveryDirectory, file), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  const sourceClaims = [...input.factPack.verifiedClaims, ...input.factPack.uncertainClaims, ...input.factPack.contradictedClaims];
  const sourcesMarkdown = await import('../research/researchPipeline').then(({renderSourcesMarkdown}) => renderSourcesMarkdown(sourceClaims, input.factPack.sources));
  await Promise.all([
    writeJson('episode.json', input.episode), writeJson('visual-plan.json', input.visualPlan), writeJson('fact-pack.json', input.factPack),
    writeJson('claim-trace.json', input.claimTrace), writeJson('factory-report.json', input.report),
    writeFile(path.join(input.deliveryDirectory, 'sources.md'), sourcesMarkdown, 'utf8'),
    writeFile(path.join(input.deliveryDirectory, 'youtube.md'), generateYoutubeMarkdown(input.normalized, input.factPack), 'utf8'),
    writeFile(path.join(input.deliveryDirectory, 'review.md'), generateReviewChecklist(), 'utf8'),
  ]);
  if (input.outputVideoPath && input.outputPath) {
    const deliveryVideo = path.join(input.deliveryDirectory, 'video.mp4');
    try { await link(input.outputPath, deliveryVideo); }
    catch { await copyFile(input.outputPath, deliveryVideo); }
    await writeJson('video-path.json', {path: input.outputPath, deliveryPath: deliveryVideo, strategy: 'hard-link-or-copy'});
  } else {
    await writeJson('video-path.json', {path: input.outputPath, status: 'not-rendered', reason: 'Factory invoked with --skip-render'});
  }
}
