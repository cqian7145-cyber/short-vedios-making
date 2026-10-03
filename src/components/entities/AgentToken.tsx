import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {progress} from '../../utils/timing';

export type AgentState = 'idle' | 'active' | 'waiting' | 'selected';
export type AgentTokenProps = {x: number; y: number; label?: string; accent?: string; state?: AgentState; appearFrame?: number; duration?: number; highlight?: boolean; opacity?: number; scale?: number};

export const AgentToken: React.FC<AgentTokenProps> = ({x, y, label, accent = vibeTheme.colors.accent.gold, state = 'idle', appearFrame = 0, duration = 24, highlight = false, opacity = 1, scale = 1}) => {
  const frame = useCurrentFrame();
  const enter = progress(frame, appearFrame, duration, 'easeOut');
  const active = state === 'active' || state === 'selected' || highlight;
  const phase = Math.max(0, frame - appearFrame);
  const halo = active ? interpolate(Math.sin(phase * 0.08), [-1, 1], [0.12, 0.3]) : 0;
  return <g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity * enter}>
    {active && <circle cy="-5" r="30" fill={accent} opacity={halo} />}
    <circle cy="-20" r="9" fill={vibeTheme.colors.text.primary} />
    <path d="M -19 19 Q -18 -4 0 -4 Q 18 -4 19 19 Q 0 27 -19 19 Z" fill={active ? accent : vibeTheme.colors.line.gold} stroke={active ? accent : vibeTheme.colors.text.muted} strokeWidth={vibeTheme.lineWidths.hairline} />
    {state === 'waiting' && <path d="M -25 26 H 25" stroke={vibeTheme.colors.text.muted} strokeWidth={vibeTheme.lineWidths.hairline} strokeDasharray="2 4" />}
    {label && <text y="43" textAnchor="middle" fill={vibeTheme.colors.text.secondary} fontFamily={vibeTheme.typography.family.technical} fontSize={vibeTheme.typography.size.numeric} letterSpacing="1.5">{label}</text>}
  </g>;
};
