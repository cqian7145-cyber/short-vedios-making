import type {NormalizedEpisode} from '../episode/normalizeEpisode';
import type {VisualDiversityReport} from '../visual/schemas';
import {PRODUCTION_DURATION_MAX_SECONDS, PRODUCTION_DURATION_MIN_SECONDS} from './factoryConfig';

export type VisualQAGate = {name: string; status: 'pass' | 'warning' | 'fail' | 'not-applicable'; detail: string};
export type VisualQAReport = {
  score: number;
  uniqueArchetypes: number;
  longestRepeatedRun: number;
  networkSceneRatio: number;
  textDominantSceneRatio: number;
  signatureMomentPresent: boolean;
  productionDuration: boolean;
  gates: VisualQAGate[];
  warnings: string[];
  failures: string[];
  passed: boolean;
  structuralRepairAttempts: number;
};

export function evaluateVisualQA(input: {diversity: VisualDiversityReport; episode: NormalizedEpisode; structuralRepairAttempts?: number}): VisualQAReport {
  const seconds = input.episode.durationInFrames / input.episode.fps;
  const productionDuration = seconds >= PRODUCTION_DURATION_MIN_SECONDS && seconds <= PRODUCTION_DURATION_MAX_SECONDS;
  const diversity = input.diversity;
  const gates: VisualQAGate[] = [];
  const warnings: string[] = [];
  const failures: string[] = [];
  const scoreStatus = productionDuration && diversity.visualDiversityScore < 50 ? 'fail' : productionDuration && diversity.visualDiversityScore < 65 ? 'warning' : 'pass';
  gates.push({name: 'diversity-score', status: scoreStatus, detail: `${diversity.visualDiversityScore}/100${productionDuration ? ' for a 120–180 second release' : ' (production threshold applies at 120–180 seconds)'}`});
  if (scoreStatus === 'fail') failures.push(`Visual diversity score ${diversity.visualDiversityScore} is below the release floor of 50.`);
  if (scoreStatus === 'warning') warnings.push(`Visual diversity score ${diversity.visualDiversityScore} is below the recommended 65.`);

  const requiredMetrics: Array<{name: string; passed: boolean; detail: string}> = [
    {name: 'unique-archetypes', passed: diversity.uniqueArchetypes >= 4, detail: `${diversity.uniqueArchetypes}; release target is at least 4`},
    {name: 'repeated-archetype-run', passed: diversity.longestRepeatedRun <= 2, detail: `${diversity.longestRepeatedRun}; release maximum is 2`},
    {name: 'network-scene-ratio', passed: diversity.networkSceneRatio <= 0.5, detail: `${Math.round(diversity.networkSceneRatio * 100)}%; release maximum is 50%`},
    {name: 'text-dominant-ratio', passed: diversity.textDominantSceneRatio <= 0.6, detail: `${Math.round(diversity.textDominantSceneRatio * 100)}%; release maximum is 60%`},
    {name: 'signature-moment', passed: diversity.signatureMomentPresent, detail: diversity.signatureMomentPresent ? 'present' : 'missing or generic'},
  ];
  for (const metric of requiredMetrics) {
    const status = productionDuration ? (metric.passed ? 'pass' : 'fail') : 'not-applicable';
    gates.push({name: metric.name, status, detail: metric.detail});
    if (productionDuration && !metric.passed) failures.push(`${metric.name}: ${metric.detail}.`);
  }
  if (productionDuration && diversity.uniqueArchetypes > 6) warnings.push(`Visual plan uses ${diversity.uniqueArchetypes} archetypes; 4–6 is the preferred production range.`);
  if (!productionDuration && seconds < PRODUCTION_DURATION_MIN_SECONDS) warnings.push(`At ${seconds.toFixed(1)} seconds, production diversity gates for 120–180 second episodes are informational only.`);
  warnings.push(...diversity.warnings);
  return {
    score: diversity.visualDiversityScore,
    uniqueArchetypes: diversity.uniqueArchetypes,
    longestRepeatedRun: diversity.longestRepeatedRun,
    networkSceneRatio: diversity.networkSceneRatio,
    textDominantSceneRatio: diversity.textDominantSceneRatio,
    signatureMomentPresent: diversity.signatureMomentPresent,
    productionDuration,
    gates,
    warnings: [...new Set(warnings)],
    failures: [...new Set(failures)],
    passed: failures.length === 0,
    structuralRepairAttempts: input.structuralRepairAttempts ?? 0,
  };
}
