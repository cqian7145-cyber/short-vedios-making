import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {DeepSeekProvider} from '../src/ai/deepseek/DeepSeekProvider';
import {resolveDeepSeekConfig} from '../src/ai/deepseek/config';
import {generateEpisode, researchWarnings} from '../src/ai/pipeline';
import type {GenerationOptions} from '../src/ai/pipeline';
import {renderEpisode} from './render/episodeRenderer';

type CliOptions = GenerationOptions & {model?: string; dryRun: boolean};

const usage = `Usage:
  npm run generate:episode -- --topic "Why can more choices make decisions worse?" --id choice-overload [--duration 150] [--model deepseek-flash] [--brief notes.md] [--facts facts.md] [--dry-run] [--force]
  npm run make:episode -- --topic "Why can more choices make decisions worse?" --id choice-overload`;

export function parseGenerationArgs(args: string[]): CliOptions {
  const values: Record<string, string> = {};
  const flags = new Set<string>();
  const flagNames = new Set(['--dry-run', '--force', '--help']);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument "${arg}".\n${usage}`);
    const [key, inline] = arg.split(/=(.*)/s, 2);
    if (flagNames.has(key)) {
      if (inline !== undefined) throw new Error(`${key} does not accept a value.`);
      flags.add(key);
      continue;
    }
    if (!['--topic', '--id', '--duration', '--model', '--brief', '--facts'].includes(key)) {
      throw new Error(`Unknown option "${key}".\n${usage}`);
    }
    const value = inline ?? args[++i];
    if (!value || value.startsWith('--')) throw new Error(`${key} requires a value.`);
    if (key in values) throw new Error(`${key} was provided more than once.`);
    values[key] = value;
  }
  if (flags.has('--help')) return {id: 'help', durationSeconds: 150, dryRun: true};
  let brief: string | undefined;
  let facts: string | undefined;
  if (values['--brief']) brief = '';
  if (values['--facts']) facts = '';
  const durationSeconds = values['--duration'] === undefined ? 150 : Number(values['--duration']);
  if (!Number.isFinite(durationSeconds)) throw new Error('--duration must be a number of seconds.');
  const rawTopic = values['--topic']?.trim();
  const fallbackName = (rawTopic || values['--brief']?.split(/[\\/]/).pop()?.replace(/\.md$/i, '') || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '');
  const id = values['--id'] ?? fallbackName;
  if (!id || id.length < 2) throw new Error('--id is required when a usable id cannot be derived from --topic or --brief.');
  return {
    topic: rawTopic,
    brief,
    facts,
    id,
    durationSeconds,
    model: values['--model'],
    dryRun: flags.has('--dry-run'),
    force: flags.has('--force'),
  };
}

async function resolveFileInputs(options: CliOptions): Promise<CliOptions> {
  const topic = options.topic;
  let brief = options.brief;
  let facts = options.facts;
  const args = process.argv.slice(2);
  const findValue = (key: string) => {
    const token = args.find((arg) => arg === key || arg.startsWith(`${key}=`));
    if (!token) return undefined;
    const inline = token.startsWith(`${key}=`) ? token.slice(key.length + 1) : undefined;
    return inline ?? args[args.indexOf(token) + 1];
  };
  const briefPath = findValue('--brief');
  const factsPath = findValue('--facts');
  try {
    if (briefPath) brief = await readFile(path.resolve(briefPath), 'utf8');
    if (factsPath) facts = await readFile(path.resolve(factsPath), 'utf8');
  } catch (error) {
    throw new Error(`Cannot read user brief or facts file: ${error instanceof Error ? error.message : String(error)}`);
  }
  return {...options, topic, brief, facts};
}

export async function runGenerationCommand(args: string[], render = false): Promise<void> {
  const parsed = parseGenerationArgs(args);
  if (args.includes('--help')) {
    console.log(usage);
    return;
  }
  const options = await resolveFileInputs(parsed);
  const config = resolveDeepSeekConfig({
    apiKey: process.env.DEEPSEEK_API_KEY,
    cliModel: options.model,
    envModel: process.env.DEEPSEEK_MODEL,
  });
  console.log(`Generating ContentBrief with ${config.model}...`);
  const provider = new DeepSeekProvider(config);
  const result = await generateEpisode(options, provider);
  const actual = result.report.actualDurationSeconds;
  console.log(`Validated ${result.report.sceneCount} scenes: ${actual.toFixed(1)} seconds.`);
  console.log(`Episode: ${result.paths.episodePath}`);
  console.log(`Artifacts: ${result.paths.artifactsDir}`);
  if (Math.abs(actual - options.durationSeconds) > 15) {
    console.warn(`⚠ Generated duration ${actual.toFixed(1)}s differs from the ${options.durationSeconds}s target by more than 15 seconds.`);
  }
  researchWarnings(result.brief).forEach((warning) => console.warn(warning));
  console.warn('Draft only: independently verify factual claims before publication.');
  if (options.dryRun) {
    console.log('Dry run complete; rendering was skipped.');
    return;
  }
  if (render) await renderEpisode(result.paths.episodePath);
}
