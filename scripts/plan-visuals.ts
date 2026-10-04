import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {DeepSeekProvider} from '../src/ai/deepseek/DeepSeekProvider';
import {resolveDeepSeekConfig} from '../src/ai/deepseek/config';
import {validateEpisode} from '../src/episode/validateEpisode';
import {FactPackSchema} from '../src/research/schemas';
import {createVisualPlan} from '../src/visual/visualDirector';

const usage = 'Usage: npm run plan:visuals -- --episode episodes/generated/id.json --facts research/id/fact-pack.json [--model deepseek-flash] [--force]';
async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const values: Record<string, string> = {};
  let force = false;
  for (let index = 0; index < args.length; index += 1) {
    const [key, inline] = args[index].split(/=(.*)/s, 2);
    if (key === '--help') { console.log(usage); return; }
    if (key === '--force') { force = true; continue; }
    if (!['--episode', '--facts', '--model'].includes(key)) throw new Error(`Unknown option ${key}.\n${usage}`);
    const value = inline ?? args[++index];
    if (!value || value.startsWith('--')) throw new Error(`${key} requires a value.`);
    if (key in values) throw new Error(`${key} was provided more than once.`);
    values[key] = value;
  }
  if (!values['--episode'] || !values['--facts']) throw new Error(`--episode and --facts are required.\n${usage}`);
  const episodePath = path.resolve(values['--episode']);
  const episode = validateEpisode(JSON.parse(await readFile(episodePath, 'utf8')) as unknown, episodePath);
  const factPack = FactPackSchema.parse(JSON.parse(await readFile(path.resolve(values['--facts']), 'utf8')) as unknown);
  let brief: unknown = {topic: factPack.topic, summary: factPack.summary};
  for (const savedBrief of [path.resolve('generated', episode.id, 'content-brief.json'), path.resolve('research', episode.id, 'content-brief.json')]) {
    try { brief = JSON.parse(await readFile(savedBrief, 'utf8')) as unknown; break; } catch { /* use the newest available brief, then fall back to the Fact Pack summary */ }
  }
  const outputDir = path.resolve('generated', episode.id);
  const planPath = path.join(outputDir, 'visual-plan.json');
  const reportPath = path.join(outputDir, 'visual-diversity-report.json');
  if (!force) {
    for (const file of [planPath, reportPath]) {
      try { await stat(file); } catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') continue;
        throw error;
      }
      throw new Error(`Refusing to overwrite ${file}; pass --force.`);
    }
  }
  const config = resolveDeepSeekConfig({apiKey: process.env.DEEPSEEK_API_KEY, cliModel: values['--model'], envModel: process.env.DEEPSEEK_MODEL});
  const result = await createVisualPlan({brief, factPack, episode, provider: new DeepSeekProvider(config)});
  await mkdir(outputDir, {recursive: true});
  await Promise.all([
    writeFile(planPath, `${JSON.stringify(result.plan, null, 2)}\n`, 'utf8'),
    writeFile(reportPath, `${JSON.stringify(result.diversity, null, 2)}\n`, 'utf8'),
  ]);
  console.log(`VisualPlan: ${planPath}`);
  console.log(`Diversity score: ${result.diversity.visualDiversityScore}/100`);
  console.log(`Archetypes: ${result.diversity.primaryArchetypes.join(', ')}`);
  console.log(`Structural repair attempts: ${result.structuralRepairAttempts}`);
  const fallbacks = result.plan.scenePlans.flatMap((scene) => scene.fallbackArchetype ? [`${scene.sceneId}: ${scene.fallbackArchetype}`] : []);
  console.log(`Fallbacks: ${fallbacks.length ? fallbacks.join(', ') : 'none'}`);
  result.diversity.warnings.forEach((warning) => console.warn(`⚠ ${warning}`));
}

run().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Visual planning failed.'); process.exitCode = 1; });
