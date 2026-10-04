import {stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {generateContentBrief} from '../src/ai/generateContentBrief';
import {DeepSeekProvider} from '../src/ai/deepseek/DeepSeekProvider';
import {resolveDeepSeekConfig} from '../src/ai/deepseek/config';
import {generateEpisode} from '../src/ai/pipeline';
import {TavilyResearchProvider} from '../src/research/TavilyResearchProvider';
import {researchEpisode} from '../src/research/researchPipeline';
import {createVisualPlan} from '../src/visual/visualDirector';

const usage = 'Usage: npm run generate:verified -- --topic "..." --id episode-id [--duration 150] [--max-sources 20] [--model deepseek-flash] [--force]';
async function run(): Promise<void> {
  const values: Record<string, string> = {};
  let force = false;
  const args = process.argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const [key, inline] = args[index].split(/=(.*)/s, 2);
    if (key === '--help') { console.log(usage); return; }
    if (key === '--force') { force = true; continue; }
    if (!['--topic', '--id', '--duration', '--max-sources', '--model'].includes(key)) throw new Error(`Unknown option ${key}.\n${usage}`);
    const value = inline ?? args[++index];
    if (!value || value.startsWith('--')) throw new Error(`${key} requires a value.`);
    if (key in values) throw new Error(`${key} was provided more than once.`);
    values[key] = value;
  }
  if (!values['--topic'] || !values['--id']) throw new Error(`--topic and --id are required.\n${usage}`);
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(values['--id'])) throw new Error('--id must be a 2–80 character kebab-case identifier.');
  const durationSeconds = Number(values['--duration'] ?? 150);
  const maxSources = Number(values['--max-sources'] ?? 20);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 30 || durationSeconds > 600) throw new Error('--duration must be from 30 to 600 seconds.');
  if (!Number.isInteger(maxSources) || maxSources < 3 || maxSources > 40) throw new Error('--max-sources must be an integer from 3 to 40.');
  if (!force) {
    const targets = [path.resolve('research', values['--id']), path.resolve('generated', values['--id']), path.resolve('episodes', 'generated', `${values['--id']}.json`)];
    const existing: string[] = [];
    for (const target of targets) {
      try { await stat(target); existing.push(target); }
      catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
    }
    if (existing.length) throw new Error(`Refusing to overwrite verified-generation output: ${existing.join(', ')}. Pass --force to replace it.`);
  }
  const research = new TavilyResearchProvider();
  const config = resolveDeepSeekConfig({apiKey: process.env.DEEPSEEK_API_KEY, cliModel: values['--model'], envModel: process.env.DEEPSEEK_MODEL});
  const llm = new DeepSeekProvider(config);
  console.log('Stage 1/3: creating initial ContentBrief...');
  const {brief} = await generateContentBrief(values['--topic'], llm);
  console.log('Stage 2/3: searching sources and building Fact Pack...');
  const researchResult = await researchEpisode({topic: values['--topic'], id: values['--id'], brief, llm, research, maxSources});
  console.log(`Stage 3/4: generating verified draft from ${researchResult.factPack.verifiedClaims.length} verified claims and ${researchResult.factPack.safeConceptualClaims.length} safe conceptual claims...`);
  const result = await generateEpisode({topic: values['--topic'], id: values['--id'], durationSeconds, force, verifiedFactPack: researchResult.factPack}, llm);
  console.log('Stage 4/4: directing concept-specific visuals...');
  const visual = await createVisualPlan({brief: result.brief, factPack: researchResult.factPack, episode: result.episode, provider: llm, targetDurationSeconds: durationSeconds});
  const visualPlanPath = path.join(result.paths.artifactsDir, 'visual-plan.json');
  const diversityPath = path.join(result.paths.artifactsDir, 'visual-diversity-report.json');
  await Promise.all([
    writeFile(visualPlanPath, `${JSON.stringify(visual.plan, null, 2)}\n`, 'utf8'),
    writeFile(diversityPath, `${JSON.stringify(visual.diversity, null, 2)}\n`, 'utf8'),
  ]);
  console.log(`Validated ${result.report.sceneCount} scenes: ${result.report.actualDurationSeconds.toFixed(1)} seconds.`);
  console.log(`Episode: ${result.paths.episodePath}`);
  console.log(`Fact Pack: ${researchResult.paths.factPack}`);
  console.log(`VisualPlan: ${visualPlanPath}`);
  console.log(`Visual diversity: ${visual.diversity.visualDiversityScore}/100; archetypes: ${visual.diversity.primaryArchetypes.join(', ')}`);
  visual.diversity.warnings.forEach((warning) => console.warn(`⚠ ${warning}`));
  if (researchResult.factPack.publicationReady) console.log('✓ Publication-ready research gate passed.');
  else { console.warn('⚠ Draft render allowed.'); console.warn('✗ Not publication-ready.'); }
  console.log('Rendering is available through npm run render:episode after human review.');
}

run().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Verified generation failed.'); process.exitCode = 1; });
