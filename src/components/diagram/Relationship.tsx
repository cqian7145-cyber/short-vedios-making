import React from 'react';
import {vibeTheme} from '../../themes/vibeTheme';
import {AnimatedEdge} from './Edge';

export type RelationshipState = 'positive' | 'negative' | 'neutral';
export type RelationshipProps = {from: {x: number; y: number}; to: {x: number; y: number}; state?: RelationshipState; active?: boolean; label?: string; startFrame?: number; duration?: number; opacity?: number};

const relationColor = (state: RelationshipState): string => state === 'positive' ? vibeTheme.colors.accent.gold : state === 'negative' ? vibeTheme.colors.accent.red : vibeTheme.colors.accent.cyan;

export const Relationship: React.FC<RelationshipProps> = ({from, to, state = 'neutral', active = false, label, startFrame = 0, duration = 36, opacity = 1}) => {
  const color = relationColor(state);
  const path = `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  return <g opacity={opacity * (active ? 1 : 0.68)}>
    <AnimatedEdge path={path} startFrame={startFrame} duration={duration} color={color} width={active ? vibeTheme.lineWidths.regular : vibeTheme.lineWidths.thin} glow={active} />
    {label && <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 9} textAnchor="middle" fill={color} fontFamily={vibeTheme.typography.family.technical} fontSize={vibeTheme.typography.size.numeric} letterSpacing="1">{label}</text>}
  </g>;
};
