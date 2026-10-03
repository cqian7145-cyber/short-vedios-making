import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../themes/vibeTheme';

export type CameraMove = 'slowPushIn' | 'slowPullBack' | 'driftLeft' | 'driftRight' | 'parallax';

export const cameraTransform = (frame: number, durationFrames: number, move: CameraMove, amount = 1): string => {
  const p = interpolate(frame, [0, Math.max(1, durationFrames)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  const drift = vibeTheme.camera.driftPixels * amount;
  if (move === 'slowPushIn') return `scale(${1 + (vibeTheme.camera.pushScale - 1) * amount * p}) translate3d(0, ${-drift * 0.22 * p}px, 0)`;
  if (move === 'slowPullBack') return `scale(${vibeTheme.camera.pullScale - (vibeTheme.camera.pullScale - 1) * amount * p}) translate3d(0, ${drift * 0.18 * p}px, 0)`;
  if (move === 'driftLeft') return `scale(1.012) translate3d(${drift * (0.5 - p)}px, 0, 0)`;
  if (move === 'driftRight') return `scale(1.012) translate3d(${drift * (p - 0.5)}px, 0, 0)`;
  return `scale(${1.01 + 0.008 * p}) translate3d(${vibeTheme.camera.parallaxPixels * amount * (0.5 - p)}px, ${vibeTheme.camera.parallaxPixels * amount * (p - 0.5) * 0.35}px, 0)`;
};

export const CameraDrift: React.FC<{children: React.ReactNode; durationFrames: number; move?: CameraMove; amount?: number}> = ({children, durationFrames, move = 'slowPushIn', amount = 1}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{transform: cameraTransform(frame, durationFrames, move, amount), transformOrigin: 'center center'}}>{children}</AbsoluteFill>;
};
