import { z } from 'zod';

export const RecraftStyleProfileSchema = z.object({
  version: z.literal('recraft-v1'),
  name: z.literal('Selected Editorial Scientific Style'),
  provider: z.literal('recraft'),
  visualRole: z.literal('illustration-assets'),
  preferredUsage: z.tuple([
    z.literal('objects'), z.literal('icons'), z.literal('characters'), z.literal('scene-plates'),
  ]),
  compositingBackground: z.literal('dark-editorial'),
}).strict();

export const RECRAFT_STYLE_PROFILE = RecraftStyleProfileSchema.parse({
  version: 'recraft-v1',
  name: 'Selected Editorial Scientific Style',
  provider: 'recraft',
  visualRole: 'illustration-assets',
  preferredUsage: ['objects', 'icons', 'characters', 'scene-plates'],
  compositingBackground: 'dark-editorial',
});

export type RecraftStyleProfile = z.infer<typeof RecraftStyleProfileSchema>;
