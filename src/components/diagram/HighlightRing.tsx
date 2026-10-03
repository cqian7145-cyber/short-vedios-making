import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {progress} from '../../utils/timing';

export type HighlightRingProps = {x: number; y: number; radius?: number; startFrame?: number; duration?: number; color?: string; opacity?: number; pulse?: boolean};

export const HighlightRing: React.FC<HighlightRingProps> = ({x, y, radius = 30, startFrame = 0, duration = 24, color = vibeTheme.colors.accent.gold, opacity = 0.65, pulse = true}) => {
  const frame = useCurrentFrame();
  const enter = progress(frame, startFrame, duration, 'easeOut');
  const phase = pulse ? Math.max(0, frame - startFrame) : 0;
  const scale = 0.92 + (pulse ? (Math.sin(phase * 0.075) + 1) * 0.035 : 0);
  const fade = frame < startFrame + duration ? enter : interpolate(frame, [startFrame + duration, startFrame + duration + 24], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <circle cx={x} cy={y} r={radius * scale} fill="none" stroke={color} strokeWidth={vibeTheme.lineWidths.thin} opacity={opacity * fade} style={{filter: `drop-shadow(0 0 5px ${color}33)`}} />;
};
