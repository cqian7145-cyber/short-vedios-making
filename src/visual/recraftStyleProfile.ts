import { z } from 'zod';

export const RecraftStyleProfileSchema = z.object({
  version: z.literal('midnight-scientific-editorial-v2'),
  name: z.literal('Midnight Scientific Editorial v2'),
  provider: z.literal('recraft'),
  visualRole: z.literal('illustration-assets'),
  preferredUsage: z.tuple([z.literal('objects'), z.literal('icons'), z.literal('characters')]),
  compositingBackground: z.literal('dark-editorial'),
}).strict();

export const RECRAFT_STYLE_PROFILE = RecraftStyleProfileSchema.parse({
  version: 'midnight-scientific-editorial-v2',
  name: 'Midnight Scientific Editorial v2',
  provider: 'recraft',
  visualRole: 'illustration-assets',
  preferredUsage: ['objects', 'icons', 'characters'],
  compositingBackground: 'dark-editorial',
});

export type RecraftStyleProfile = z.infer<typeof RecraftStyleProfileSchema>;
