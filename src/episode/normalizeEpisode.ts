import { validateEpisode } from './validateEpisode';
import type { Episode } from './schema';
import type { SceneSpec } from '../engine/sceneTypes';
import { buildSceneTimeline, getTimelineDuration } from '../engine/timeline';
export type NormalizedEpisode = Omit<Episode, 'scenes'> & {
    scenes: SceneSpec[];
    durationInFrames: number;
};
export function normalizeEpisode(input: unknown, source?: string): NormalizedEpisode {
    const e = validateEpisode(input, source);
    const scenes: SceneSpec[] = e.scenes.map(({ durationSeconds, transition, ...s }) => ({ ...s, durationInFrames: Math.round(durationSeconds * e.fps), transition: transition ? { direction: transition.direction, overlapFrames: transition.overlapSeconds === undefined ? undefined : Math.round(transition.overlapSeconds * e.fps) } : undefined }));
    return { ...e, scenes, durationInFrames: getTimelineDuration(buildSceneTimeline(scenes)) };
}
