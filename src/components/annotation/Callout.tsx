import React from 'react';
import {useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {progress} from '../../utils/timing';

export type CalloutProps = {x: number; y: number; anchorX: number; anchorY: number; label: string; detail?: string; color?: string; startFrame?: number; duration?: number; align?: 'start' | 'end'};

export const Callout: React.FC<CalloutProps> = ({x, y, anchorX, anchorY, label, detail, color = vibeTheme.colors.accent.gold, startFrame = 0, duration = 24, align = 'start'}) => {
  const frame = useCurrentFrame();
  const enter = progress(frame, startFrame, duration, 'easeOut');
  const textAnchor = align === 'start' ? 'start' : 'end';
  const endX = x + (align === 'start' ? -9 : 9);
  const elbowX = (anchorX + endX) / 2;
  return <g opacity={enter}>
    <path d={`M ${anchorX} ${anchorY} L ${elbowX} ${anchorY} L ${endX} ${y}`} fill="none" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.hairline} />
    <circle cx={anchorX} cy={anchorY} r="2.2" fill={color} />
    <text x={x} y={y - 4} textAnchor={textAnchor} fill={color} fontFamily={vibeTheme.typography.family.technical} fontSize={vibeTheme.typography.size.numeric} letterSpacing="1.3">{label}</text>
    {detail && <text x={x} y={y + 15} textAnchor={textAnchor} fill={vibeTheme.colors.text.muted} fontFamily={vibeTheme.typography.family.body} fontSize="11">{detail}</text>}
  </g>;
};
