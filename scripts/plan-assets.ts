import 'dotenv/config';
import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {DeepSeekProvider} from '../src/ai/deepseek/DeepSeekProvider';
import {resolveDeepSeekConfig} from '../src/ai/deepseek/config';
import {loadAssetRegistry} from '../src/assets/assetRegistry';
import {createAssetStrategyPlan} from '../src/assets/assetStrategyDirector';
import {validateEpisode} from '../src/episode/validateEpisode';
import {FactPackSchema} from '../src/research/schemas';
import {getRecraftConfigurationState} from '../src/recraft/config';
import {AssetStrategyReportSchema} from '../src/assets/assetStrategySchema';
import {VisualPlanSchema} from '../src/visual/schemas';
import {applyLibraryAssetsToPlan} from '../src/assets/library/libraryPlanIntegration';
import {validateAssetPlan} from '../src/assets/assetPlanValidation';

const usage = 'Usage: npm run plan:assets -- --episode episodes/generated/id.json --visual-plan generated/id/visual-plan.json --facts research/id/fact-pack.json [--dry-run] [--model deepseek-flash] [--force]';

function parseArgs(args: string[]) {
  const values: Record<string, string> = {};
  const flags = new Set<string>();
  for (let index = 0; index < args.length; index += 1) {
    const [key, inline] = args[index].split(/=(.*)/s, 2);
    if (key === '--help') return {help: true, values, flags};
    if (['--dry-run', '--force'].includes(key)) {
      if (flags.has(key)) throw new Error(`${key} was provided more than once.`);
      flags.add(key);
      continue;
    }
    if (!['--episode', '--visual-plan', '--facts', '--model'].includes(key)) throw new Error(`Unknown option ${key}.\n${usage}`);
    const value = inline ?? args[++index];
    if (!value || value.startsWith('--')) throw new Error(`${key} requires a value.`);
    if (key in values) throw new Error(`${key} was provided more than once.`);
    values[key] = value;
  }
  for (const key of ['--episode', '--visual-plan', '--facts']) {
    if (!values[key]) throw new Error(`${key} is required.\n${usage}`);
  }
  return {help: false, values, flags};
}

async function ensureWritable(paths: string[], force: boolean) {
  if (force) return;
  for (const target of paths) {
    try { await stat(target); }
    catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') continue;
      throw error;
    }
    throw new Error(`Refusing to overwrite ${target}; pass --force.`);
  }
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(usage); return; }
  const episodePath = path.resolve(args.values['--episode']);
  const visualPlanPath = path.resolve(args.values['--visual-plan']);
  const factPackPath = path.resolve(args.values['--facts']);
  const episode = validateEpisode(JSON.parse(await readFile(episodePath, 'utf8')) as unknown, episodePath);
  const visualPlan = VisualPlanSchema.parse(JSON.parse(await readFile(visualPlanPath, 'utf8')) as unknown);
  const factPack = FactPackSchema.parse(JSON.parse(await readFile(factPackPath, 'utf8')) as unknown);
  if (visualPlan.scenePlans.length !== episode.scenes.length || visualPlan.scenePlans.some((scene, index) => scene.sceneId !== episode.scenes[index].id)) {
    throw new Error('VisualPlan scene IDs must match the Episode exactly and remain in the same order.');
  }

  const outputDir = path.resolve('generated', episode.id);
  const planPath = path.join(outputDir, 'asset-plan.json');
  const reportPath = path.join(outputDir, 'asset-strategy-report.json');
  await ensureWritable([planPath, reportPath], args.flags.has('--force'));
  const [registry, recraftConfigState] = await Promise.all([
    loadAssetRegistry(),
    Promise.resolve(getRecraftConfigurationState()),
  ]);
  const dryRun = args.flags.has('--dry-run');
  const model = args.values['--model'];
  const provider = !dryRun && model
    ? new DeepSeekProvider(resolveDeepSeekConfig({apiKey: process.env.DEEPSEEK_API_KEY, cliModel: model, envModel: process.env.DEEPSEEK_MODEL}))
    : undefined;

  const result = await createAssetStrategyPlan({
    episode, visualPlan, factPack, registryAssets: registry.assets,
    styleStatus: recraftConfigState.styleConfigured ? 'locked' : 'missing', provider,
  });
  const plan = await applyLibraryAssetsToPlan(result.plan, process.cwd());
  const {report: libraryAwareReport} = validateAssetPlan(plan, episode);
  const report = AssetStrategyReportSchema.parse({
    ...libraryAwareReport,
    warnings: [...new Set([...libraryAwareReport.warnings, ...registry.warnings])],
    status: libraryAwareReport.status === 'pass' && registry.warnings.length ? 'warning' : libraryAwareReport.status,
  });
  await mkdir(outputDir, {recursive: true});
  await Promise.all([
    writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, 'utf8'),
    writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
  ]);

  console.log('Asset Strategy complete');
  console.log(`Planning mode: ${result.planningMode}${dryRun ? ' (dry-run)' : ''}`);
  console.log(`Scenes: ${report.sceneCount}`);
  console.log(`Strategies: procedural ${report.strategyCounts.procedural}, hybrid ${report.strategyCounts.hybrid}, recraft ${report.strategyCounts.recraft}, reuse ${report.strategyCounts.reuse}`);
  console.log(`Unique Recraft assets: ${report.uniqueRecraftAssetCount} / ${report.recraftBudget.hardMax} budget`);
  console.log(`High-risk assets: ${report.highRiskAssetCount}`);
  console.log(`Reused asset placements: ${report.reuseCount}`);
  console.log(`Policy overrides: ${report.policyOverrideCount}`);
  console.log(`QA status: ${report.status}`);
  console.log(`Plan: ${path.relative(process.cwd(), planPath)}`);
  console.log(`Report: ${path.relative(process.cwd(), reportPath)}`);
  report.warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
  if (result.repairAttempts) console.log(`AssetPlan repair attempts: ${result.repairAttempts}`);
  if (result.errors.length) {
    result.errors.forEach((error) => console.error(`Validation error: ${error}`));
    process.exitCode = 1;
  } else if (report.status === 'fail') process.exitCode = 1;
}

run().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Asset strategy planning failed.');
  process.exitCode = 1;
});
