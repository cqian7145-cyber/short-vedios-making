import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../themes/vibeTheme';

export const GlowPath: React.FC<{d: string; start: number; end: number; color?: string; width?: number; opacity?: number}> = ({d, start, end, color = vibeTheme.colors.gold, width = 1.8, opacity = 1}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [start, end], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray="1" strokeDashoffset={1 - progress} pathLength={1} opacity={opacity * progress} style={{filter: `drop-shadow(0 0 5px ${color}55)`}} />;
};
