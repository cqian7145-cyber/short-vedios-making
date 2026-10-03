import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {progress} from '../../utils/timing';

export type ProbabilityBarProps = {
  from: number;
  to: number;
  startFrame?: number;
  duration?: number;
  width?: number;
  label?: string;
  suffix?: string;
  color?: string;
};

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({from, to, startFrame = 0, duration = 54, width = 360, label = 'PROBABILITY', suffix = '%', color = vibeTheme.colors.accent.gold}) => {
  const frame = useCurrentFrame();
  const amount = progress(frame, startFrame, duration, 'easeInOut');
  const value = from + (to - from) * amount;
  const clamped = Math.max(0, Math.min(100, value));
  return <g>
    <text x="0" y="-16" fill={vibeTheme.colors.text.muted} fontFamily={vibeTheme.typography.family.technical} fontSize="11" letterSpacing="2">{label}</text>
    <path d={`M 0 0 H ${width}`} stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.thin} />
    <path d={`M 0 0 H ${width * clamped / 100}`} stroke={color} strokeWidth={vibeTheme.lineWidths.regular} strokeLinecap="round" />
    {[0, 50, 100].map((tick) => <g key={tick}>
      <path d={`M ${width * tick / 100} -5 V 6`} stroke={vibeTheme.colors.text.muted} strokeWidth={vibeTheme.lineWidths.hairline} />
      <text x={width * tick / 100} y="22" fill={vibeTheme.colors.text.muted} fontSize="10" textAnchor="middle" fontFamily={vibeTheme.typography.family.technical}>{tick}</text>
    </g>)}
    <text x={width + 22} y="6" fill={color} fontSize="24" fontFamily={vibeTheme.typography.family.display}>{interpolate(clamped, [0, 100], [0, 100]).toFixed(0)}{suffix}</text>
  </g>;
};
