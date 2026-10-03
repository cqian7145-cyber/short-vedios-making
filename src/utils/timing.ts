import {Easing, interpolate} from 'remotion';

export type EasingName = 'linear' | 'easeInOut' | 'easeOut';

const easingMap = {
  linear: Easing.linear,
  easeInOut: Easing.inOut(Easing.quad),
  easeOut: Easing.out(Easing.quad),
} as const;

export const progress = (frame: number, startFrame = 0, duration = 1, easing: EasingName = 'linear'): number => {
  const endFrame = startFrame + Math.max(1, duration);
  return interpolate(frame, [startFrame, endFrame], [0, 1], {
    easing: easingMap[easing],
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const drawProgress = progress;

export const fadeProgress = (frame: number, startFrame = 0, duration = 1, fadeDuration = 18): number => {
  const safeDuration = Math.max(1, duration);
  const edge = Math.min(Math.max(1, fadeDuration), safeDuration / 2);
  return interpolate(frame, [startFrame, startFrame + edge, startFrame + safeDuration - edge, startFrame + safeDuration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};
