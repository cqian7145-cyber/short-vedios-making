import {DEFAULT_FACTORY_MAX_SOURCES, MAX_FACTORY_DURATION_SECONDS, MIN_FACTORY_DURATION_SECONDS, EPISODE_ID_PATTERN} from './factoryConfig';
import type {FactoryOptions} from './factoryTypes';

export const FACTORY_USAGE = 'Usage: npm run factory -- --topic "Why can being more efficient make us consume more?" --id jevons-paradox [--duration 150] [--model deepseek-flash] [--max-sources 20] [--force] [--draft] [--skip-render] [--resume] [--brief path.json] [--facts fact-pack.json]';

export function parseFactoryArgs(args: string[]): FactoryOptions & {help?: boolean} {
  const values: Record<string, string> = {};
  const flags = new Set<string>();
  for (let index = 0; index < args.length; index += 1) {
    const [key, inline] = args[index].split(/=(.*)/s, 2);
    if (key === '--help') return {id: 'help', help: true};
    if (['--force', '--draft', '--skip-render', '--resume'].includes(key)) {
      if (flags.has(key)) throw new Error(`${key} was provided more than once.`);
      flags.add(key);
      continue;
    }
    if (!['--topic', '--id', '--duration', '--model', '--max-sources', '--brief', '--facts'].includes(key)) throw new Error(`Unknown option ${key}.\n${FACTORY_USAGE}`);
    const value = inline ?? args[++index];
    if (!value || value.startsWith('--')) throw new Error(`${key} requires a value.`);
    if (key in values) throw new Error(`${key} was provided more than once.`);
    values[key] = value;
  }
  if (!values['--id']) throw new Error(`--id is required.\n${FACTORY_USAGE}`);
  if (!EPISODE_ID_PATTERN.test(values['--id'])) throw new Error('--id must be a 2–80 character lowercase kebab-case identifier.');
  if (!values['--topic'] && !flags.has('--resume')) throw new Error(`--topic is required unless --resume is used.\n${FACTORY_USAGE}`);
  const durationWasProvided = '--duration' in values;
  const durationSeconds = durationWasProvided ? Number(values['--duration']) : undefined;
  if (durationSeconds !== undefined && (!Number.isInteger(durationSeconds) || durationSeconds < MIN_FACTORY_DURATION_SECONDS || durationSeconds > MAX_FACTORY_DURATION_SECONDS)) {
    throw new Error(`--duration must be an integer from ${MIN_FACTORY_DURATION_SECONDS} to ${MAX_FACTORY_DURATION_SECONDS} seconds.`);
  }
  const maxSources = Number(values['--max-sources'] ?? DEFAULT_FACTORY_MAX_SOURCES);
  if (!Number.isInteger(maxSources) || maxSources < 3 || maxSources > 40) throw new Error('--max-sources must be an integer from 3 to 40.');
  return {
    id: values['--id'], topic: values['--topic'], durationSeconds, durationWasProvided,
    model: values['--model'], maxSources, briefPath: values['--brief'], factsPath: values['--facts'],
    force: flags.has('--force'), draft: flags.has('--draft'), skipRender: flags.has('--skip-render'), resume: flags.has('--resume'),
  };
}
