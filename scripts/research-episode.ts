import {mkdir, readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {generateContentBrief} from '../src/ai/generateContentBrief';
import {DeepSeekProvider} from '../src/ai/deepseek/DeepSeekProvider';
import {resolveDeepSeekConfig} from '../src/ai/deepseek/config';
import {TavilyResearchProvider} from '../src/research/TavilyResearchProvider';
import {researchEpisode} from '../src/research/researchPipeline';

const usage = 'Usage: npm run research:episode -- --topic "..." --id episode-id [--provider tavily] [--max-sources 20] [--model deepseek-flash] [--force]';
function parseArgs(args: string[]) {
  const options: Record<string, string> = {};
  let force = false;
  for (let i = 0; i < args.length; i += 1) {
    const [key, inline] = args[i].split(/=(.*)/s, 2);
    if (key === '--help') return {help: true};
    if (key === '--force') { force = true; continue; }
    if (!['--topic', '--id', '--provider', '--max-sources', '--model'].includes(key)) throw new Error(`Unknown option ${key}.\n${usage}`);
    const value = inline ?? args[++i];
    if (!value || value.startsWith('--')) throw new Error(`${key} requires a value.`);
    if (key in options) throw new Error(`${key} was provided more than once.`);
    options[key] = value;
  }
  if (!options['--topic'] || !options['--id']) throw new Error(`--topic and --id are required.\n${usage}`);
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(options['--id'])) throw new Error('--id must be a 2–80 character kebab-case identifier.');
  if (options['--provider'] && options['--provider'] !== 'tavily') throw new Error('Only --provider tavily is currently supported.');
  const maxSources = Number(options['--max-sources'] ?? 20);
  if (!Number.isInteger(maxSources) || maxSources < 3 || maxSources > 40) throw new Error('--max-sources must be an integer from 3 to 40.');
  return {topic: options['--topic'], id: options['--id'], provider: 'tavily', maxSources, model: options['--model'], force};
}

async function run(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if ('help' in args) { console.log(usage); return; }
  const researchDir = path.resolve('research', args.id);
  try {
    await stat(researchDir);
    if (!args.force) throw new Error(`Refusing to overwrite research output ${researchDir}; pass --force.`);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') { /* expected */ }
    else throw error;
  }
  const research = new TavilyResearchProvider();
  const config = resolveDeepSeekConfig({apiKey: process.env.DEEPSEEK_API_KEY, cliModel: args.model, envModel: process.env.DEEPSEEK_MODEL});
  const llm = new DeepSeekProvider(config);
  console.log(`Generating initial ContentBrief with ${config.model}...`);
  const {brief} = await generateContentBrief(args.topic, llm);
  const result = await researchEpisode({topic: args.topic, id: args.id, brief, llm, research, maxSources: args.maxSources, researchRoot: path.resolve('research')});
  await mkdir(researchDir, {recursive: true});
  await writeFile(path.join(researchDir, 'content-brief.json'), `${JSON.stringify(brief, null, 2)}\n`, 'utf8');
  console.log(`Research complete: ${result.report.sourceCount} unique sources across ${result.report.queryCount} queries.`);
  console.log(`Fact Pack: ${result.paths.factPack}`);
  console.log(`Sources for review: ${result.paths.sourcesMarkdown}`);
  if (result.factPack.publicationReady) console.log('✓ Publication-ready research gate passed.');
  else { console.warn('⚠ Draft render allowed.'); console.warn('✗ Not publication-ready.'); }
}

run().catch((error: unknown) => { console.error(error instanceof Error ? error.message : 'Research failed.'); process.exitCode = 1; });
