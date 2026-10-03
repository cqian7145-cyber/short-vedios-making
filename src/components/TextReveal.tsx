import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

export const TextReveal: React.FC<{children: React.ReactNode; start: number; duration?: number; style?: React.CSSProperties}> = ({children, start, duration = 34, style}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start, start + duration * .55, start + duration], [0, 1, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const blur = interpolate(frame, [start, start + duration], [8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = interpolate(frame, [start, start + duration], [10, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <div style={{opacity, filter: `blur(${blur}px)`, transform: `translateY(${y}px)`, ...style}}>{children}</div>;
};
