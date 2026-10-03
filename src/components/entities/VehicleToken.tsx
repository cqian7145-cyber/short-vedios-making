import React from 'react';
import {useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {progress} from '../../utils/timing';

export type VehicleTokenProps = {x: number; y: number; rotation?: number; color?: string; startFrame?: number; duration?: number; scale?: number; opacity?: number; label?: string};

export const VehicleToken: React.FC<VehicleTokenProps> = ({x, y, rotation = 0, color = vibeTheme.colors.accent.gold, startFrame = 0, duration = 20, scale = 1, opacity = 1, label}) => {
  const frame = useCurrentFrame();
  const enter = progress(frame, startFrame, duration, 'easeOut');
  return <g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`} opacity={opacity * enter}>
    <rect x="-9" y="-17" width="18" height="34" rx="4" fill={vibeTheme.colors.background.primary} stroke={color} strokeWidth={vibeTheme.lineWidths.thin} />
    <path d="M -6 -8 Q 0 -13 6 -8 V 3 H -6 Z" fill={color} opacity=".66" />
    <path d="M -12 -10 H -8 M 8 -10 H 12 M -12 8 H -8 M 8 8 H 12" stroke={vibeTheme.colors.text.muted} strokeWidth={vibeTheme.lineWidths.thin} strokeLinecap="round" />
    {label && <text y="30" textAnchor="middle" fill={vibeTheme.colors.text.secondary} fontFamily={vibeTheme.typography.family.technical} fontSize="10" letterSpacing="1">{label}</text>}
  </g>;
};
