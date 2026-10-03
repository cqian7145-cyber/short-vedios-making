import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {progress} from '../../utils/timing';

export type ChartPoint = {x: number; y: number};
export type MiniChartProps = {
  data: readonly ChartPoint[];
  xRange: readonly [number, number];
  yRange: readonly [number, number];
  highlightIndex?: number;
  startFrame?: number;
  duration?: number;
  width?: number;
  height?: number;
  color?: string;
  xLabel?: string;
  yLabel?: string;
};

export const MiniChart: React.FC<MiniChartProps> = ({data, xRange, yRange, highlightIndex, startFrame = 0, duration = 48, width = 520, height = 240, color = vibeTheme.colors.accent.gold, xLabel, yLabel}) => {
  const frame = useCurrentFrame();
  const draw = progress(frame, startFrame, duration, 'easeInOut');
  const pad = {left: 36, right: 16, top: 14, bottom: 30};
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const mapPoint = (point: ChartPoint) => ({
    x: pad.left + ((point.x - xRange[0]) / Math.max(1e-9, xRange[1] - xRange[0])) * innerWidth,
    y: pad.top + (1 - (point.y - yRange[0]) / Math.max(1e-9, yRange[1] - yRange[0])) * innerHeight,
  });
  const path = data.map((point, index) => {
    const p = mapPoint(point);
    return `${index === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }).join(' ');
  const hi = highlightIndex === undefined ? undefined : data[highlightIndex];
  const hp = hi ? mapPoint(hi) : undefined;
  const drawProgress = interpolate(draw, [0, 1], [0, 1]);

  return <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Minimal line chart" overflow="visible">
    <path d={`M ${pad.left} ${pad.top} V ${height - pad.bottom} H ${width - pad.right}`} fill="none" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.hairline} />
    <path d={`M ${pad.left} ${height - pad.bottom} H ${width - pad.right}`} fill="none" stroke={vibeTheme.colors.line.subtle} strokeWidth={vibeTheme.lineWidths.hairline} />
    {[0, 0.5, 1].map((t) => <g key={t}>
      <path d={`M ${pad.left - 4} ${pad.top + innerHeight * t} H ${pad.left}`} stroke={vibeTheme.colors.text.muted} strokeWidth={vibeTheme.lineWidths.hairline} />
      <text x={pad.left - 8} y={pad.top + innerHeight * t + 4} fill={vibeTheme.colors.text.muted} textAnchor="end" fontSize="10" fontFamily={vibeTheme.typography.family.technical}>{(yRange[1] - (yRange[1] - yRange[0]) * t).toFixed(0)}</text>
    </g>)}
    <path d={path} fill="none" stroke={color} strokeWidth={vibeTheme.lineWidths.regular} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${drawProgress} 1`} opacity=".94" />
    {hi && hp && draw >= (highlightIndex ?? 0) / Math.max(1, data.length - 1) && <g>
      <circle cx={hp.x} cy={hp.y} r="10" fill="none" stroke={color} strokeWidth={vibeTheme.lineWidths.hairline} opacity=".38" />
      <circle cx={hp.x} cy={hp.y} r="3.3" fill={vibeTheme.colors.text.primary} />
    </g>}
    {xLabel && <text x={width - pad.right} y={height - 5} fill={vibeTheme.colors.text.muted} fontSize="10" textAnchor="end" letterSpacing="1.2">{xLabel}</text>}
    {yLabel && <text x={pad.left} y={10} fill={vibeTheme.colors.text.muted} fontSize="10" letterSpacing="1.2">{yLabel}</text>}
  </svg>;
};
