import { writeFileSync } from 'node:fs';
import { z } from 'zod';
import { EpisodeSchema } from '../src/episode/schema';
writeFileSync('docs/episode.schema.json', JSON.stringify(z.toJSONSchema(EpisodeSchema), null, 2) + '\n');
console.log('Generated docs/episode.schema.json from runtime schema.');
