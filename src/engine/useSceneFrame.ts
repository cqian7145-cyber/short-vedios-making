import {interpolate, useCurrentFrame} from 'remotion';

export type SceneFrame = {localFrame: number; durationInFrames: number; progress: number; normalizedFrame: number};

/** Call inside a Remotion Sequence; useCurrentFrame() is then scene-local. */
export const useSceneFrame = (durationInFrames: number): SceneFrame => {
  const localFrame = useCurrentFrame();
  const lastFrame = Math.max(1, durationInFrames - 1);
  const normalizedFrame = interpolate(localFrame, [0, lastFrame], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return {localFrame, durationInFrames, progress: normalizedFrame, normalizedFrame};
};
