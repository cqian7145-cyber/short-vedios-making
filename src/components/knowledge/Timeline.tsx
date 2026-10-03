import React from 'react';
import {useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {progress as frameProgress} from '../../utils/timing';

export type TimelineEvent = {year: string | number; label: string; detail?: string};
export type TimelineProps = {
  events: readonly TimelineEvent[];
  startFrame?: number;
  duration?: number;
  progress?: number;
  orientation?: 'horizontal' | 'vertical';
  width?: number;
  height?: number;
  accent?: string;
};

export const Timeline: React.FC<TimelineProps> = ({events, startFrame = 0, duration = 72, progress: suppliedProgress, orientation = 'horizontal', width = 840, height = 180, accent = vibeTheme.colors.accent.gold}) => {
  const frame = useCurrentFrame();
  const overall = suppliedProgress === undefined ? frameProgress(frame, startFrame, duration, 'easeInOut') : Math.max(0, Math.min(1, suppliedProgress));
  const vertical = orientation === 'vertical';
  const axisX = vertical ? 24 : 0;
  const axisY = vertical ? 4 : Math.round(height / 2);
  const line = vertical ? `M ${axisX} ${axisY} V ${height - 8}` : `M 0 ${axisY} H ${width}`;
  const progressPath = vertical ? `M ${axisX} ${axisY} V ${axisY + (height - axisY - 8) * overall}` : `M 0 ${axisY} H ${width * overall}`;
  const denom = Math.max(1, events.length - 1);
  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} overflow="visible" role="img" aria-label="Timeline">
    <path d={line} fill="none" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.hairline} />
    <path d={progressPath} fill="none" stroke={accent} strokeWidth={vibeTheme.lineWidths.thin} />
    {events.map((event, index) => {
      const t = events.length <= 1 ? 0 : index / denom;
      const x = vertical ? axisX : t * width;
      const y = vertical ? axisY + t * (height - axisY - 8) : axisY;
      const enter = suppliedProgress === undefined ? frameProgress(frame, startFrame + index * Math.min(14, duration / Math.max(1, events.length)), Math.max(1, duration * 0.55), 'easeOut') : Math.max(0, Math.min(1, (overall - Math.max(0, t - 0.18)) / 0.18));
      const above = index % 2 === 0;
      const textX = vertical ? axisX + 24 : x;
      const yearY = vertical ? y + 4 : y + (above ? -30 : 42);
      const labelY = vertical ? y + 24 : y + (above ? -12 : 60);
      const anchor = vertical ? 'start' : index === 0 ? 'start' : index === events.length - 1 ? 'end' : 'middle';
      return <g key={`${event.year}-${index}`} opacity={enter}>
        <circle cx={x} cy={y} r={index === events.length - 1 ? 4 : 3} fill={accent} />
        <text x={textX} y={yearY} textAnchor={anchor} fill={vibeTheme.colors.text.primary} fontFamily={vibeTheme.typography.family.display} fontSize={vertical ? 18 : 20}>{event.year}</text>
        <text x={textX} y={labelY} textAnchor={anchor} fill={vibeTheme.colors.text.secondary} fontFamily={vibeTheme.typography.family.body} fontSize={13} letterSpacing=".5">{event.label}</text>
        {event.detail && <text x={textX} y={labelY + 18} textAnchor={anchor} fill={vibeTheme.colors.text.muted} fontFamily={vibeTheme.typography.family.technical} fontSize={10}>{event.detail}</text>}
      </g>;
    })}
  </svg>;
};
