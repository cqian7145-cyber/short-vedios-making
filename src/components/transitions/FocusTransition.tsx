import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';

export const FocusTransition: React.FC<{start: number; duration?: number; x?: number; y?: number; strength?: number}> = ({start, duration = vibeTheme.motion.duration.transition, x = 50, y = 50, strength = 0.24}) => {
  const frame = useCurrentFrame();
  const half = Math.max(1, duration / 2);
  const rise = interpolate(frame, [start, start + half], [0, strength], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fall = interpolate(frame, [start + half, start + duration], [strength, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const opacity = frame < start + half ? rise : fall;
  return <AbsoluteFill style={{zIndex: vibeTheme.zIndex.transition, opacity, background: `radial-gradient(ellipse at ${x}% ${y}%, transparent 0%, rgba(4,7,11,.14) 34%, rgba(4,7,11,.82) 100%)`, pointerEvents: 'none'}} />;
};
