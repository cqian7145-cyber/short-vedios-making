import React from 'react';
import {useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {progress} from '../../utils/timing';
import {AnimatedEdge} from './Edge';

export type ArrowPoint = {x: number; y: number};
export type ArrowProps = {
  from?: ArrowPoint;
  to?: ArrowPoint;
  path?: string;
  label?: string;
  labelX?: number;
  labelY?: number;
  startFrame?: number;
  duration?: number;
  color?: string;
  width?: number;
  opacity?: number;
};

export const Arrow: React.FC<ArrowProps> = ({from, to, path, label, labelX, labelY, startFrame = 0, duration = 32, color = vibeTheme.colors.accent.gold, width = vibeTheme.lineWidths.thin, opacity = 1}) => {
  const frame = useCurrentFrame();
  const id = React.useId().replace(/:/g, '');
  const d = path ?? (from && to ? `M ${from.x} ${from.y} L ${to.x} ${to.y}` : '');
  if (!d) return null;
  const enter = progress(frame, startFrame, duration);
  const lx = labelX ?? (from && to ? (from.x + to.x) / 2 : 0);
  const ly = labelY ?? (from && to ? (from.y + to.y) / 2 - 12 : 0);
  return <g opacity={opacity * enter}>
    <defs><marker id={`arrow-${id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M 0 0 L 5 3 L 0 6" fill="none" stroke={color} strokeWidth=".9" strokeLinecap="round" strokeLinejoin="round" /></marker></defs>
    <g markerEnd={`url(#arrow-${id})`}><AnimatedEdge path={d} startFrame={startFrame} duration={duration} color={color} width={width} /></g>
    {label && <text x={lx} y={ly} fill={vibeTheme.colors.text.secondary} fontSize={vibeTheme.typography.size.caption} fontFamily={vibeTheme.typography.family.body} textAnchor="middle" letterSpacing="1.5">{label}</text>}
  </g>;
};
