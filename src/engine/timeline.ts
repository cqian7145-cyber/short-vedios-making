import type {SceneSpec, SceneTimelineEntry} from './sceneTypes';

export const DEFAULT_OVERLAP_FRAMES = 34;

export const buildSceneTimeline = (scenes: readonly SceneSpec[]): SceneTimelineEntry[] => {
  if (scenes.length === 0) return [];
  const entries: SceneTimelineEntry[] = [];
  let startFrame = 0;

  scenes.forEach((spec, index) => {
    if (!Number.isInteger(spec.durationInFrames) || spec.durationInFrames < 1) {
      throw new Error(`Scene "${spec.id}" must have a positive integer durationInFrames.`);
    }
    const transitionInFrames = index === 0 ? 0 : Math.max(0, Math.round(spec.transition?.overlapFrames ?? DEFAULT_OVERLAP_FRAMES));
    if (index > 0) {
      const previous = scenes[index - 1];
      if (transitionInFrames >= previous.durationInFrames || transitionInFrames >= spec.durationInFrames) {
        throw new Error(`Scene overlap before "${spec.id}" must be shorter than both neighboring scenes.`);
      }
      startFrame = entries[index - 1].endFrame - transitionInFrames;
    }
    entries.push({
      spec,
      startFrame,
      endFrame: startFrame + spec.durationInFrames,
      transitionInFrames,
      transitionOutFrames: 0,
    });
  });

  return entries.map((entry, index) => ({
    ...entry,
    transitionOutFrames: entries[index + 1]?.transitionInFrames ?? 0,
  }));
};

export const getTimelineDuration = (timeline: readonly SceneTimelineEntry[]): number => timeline.length ? timeline[timeline.length - 1].endFrame : 0;
