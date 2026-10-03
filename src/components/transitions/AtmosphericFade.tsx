import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';

export const AtmosphericFade: React.FC<{start: number; duration?: number; strength?: number}> = ({start, duration = vibeTheme.motion.duration.transition, strength = 0.44}) => {
  const frame = useCurrentFrame();
  const half = Math.max(1, duration / 2);
  const rise = interpolate(frame, [start, start + half], [0, strength], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fall = interpolate(frame, [start + half, start + duration], [strength, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacity = frame < start + half ? rise : fall;
  return <AbsoluteFill style={{zIndex: vibeTheme.zIndex.transition, opacity, background: `radial-gradient(ellipse at 50% 48%, ${vibeTheme.colors.background.primary} 0%, rgba(5,8,13,.88) 60%, rgba(5,8,13,.66) 100%)`, pointerEvents: 'none'}} />;
};
