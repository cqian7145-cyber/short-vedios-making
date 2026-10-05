import { z } from 'zod';

export const RecraftStyleProfileSchema = z.object({
  version: z.literal('recraft-v1'),
  name: z.literal('Tech Blue Editorial'),
  visualLanguage: z.tuple([
    z.literal('tech-blue'),
    z.literal('minimal-line'),
    z.literal('saturated-flat'),
    z.literal('geometric'),
    z.literal('editorial'),
  ]),
}).strict();

export const RECRAFT_STYLE_PROFILE = RecraftStyleProfileSchema.parse({
  version: 'recraft-v1',
  name: 'Tech Blue Editorial',
  visualLanguage: [
    'tech-blue',
    'minimal-line',
    'saturated-flat',
    'geometric',
    'editorial',
  ],
});

export type RecraftStyleProfile = z.infer<typeof RecraftStyleProfileSchema>;
