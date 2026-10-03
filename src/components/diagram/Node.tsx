import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {progress} from '../../utils/timing';

export type NodeProps = {
  x: number;
  y: number;
  size?: number;
  label?: string;
  active?: boolean;
  accent?: string;
  appearFrame?: number;
  duration?: number;
  pulse?: boolean;
  opacity?: number;
};

export const Node: React.FC<NodeProps> = ({x, y, size = 14, label, active = false, accent = vibeTheme.colors.accent.gold, appearFrame = 0, duration = 24, pulse = false, opacity = 1}) => {
  const frame = useCurrentFrame();
  const enter = progress(frame, appearFrame, duration, 'easeOut');
  const wave = pulse ? 0.5 + 0.5 * Math.sin(Math.max(0, frame - appearFrame) * 0.09) : 0;
  const ringOpacity = active ? interpolate(wave, [0, 1], [0.2, 0.42]) : 0;
  return <g opacity={opacity * enter} transform={`translate(${x} ${y})`}>
    {active && <circle r={size * (1.72 + wave * 0.16)} fill="none" stroke={accent} strokeWidth={vibeTheme.lineWidths.hairline} opacity={ringOpacity} />}
    <circle r={size} fill={vibeTheme.colors.background.primary} stroke={active ? accent : vibeTheme.colors.line.gold} strokeWidth={active ? vibeTheme.lineWidths.regular : vibeTheme.lineWidths.thin} />
    <circle r={Math.max(2, size * 0.24)} fill={active ? accent : vibeTheme.colors.text.primary} opacity=".9" />
    {label && <text y={size + 23} textAnchor="middle" fill={vibeTheme.colors.text.secondary} fontFamily={vibeTheme.typography.family.technical} fontSize={vibeTheme.typography.size.numeric} letterSpacing="2">{label}</text>}
  </g>;
};
