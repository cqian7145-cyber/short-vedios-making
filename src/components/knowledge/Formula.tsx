import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {progress} from '../../utils/timing';

export type FormulaProps = {
  expression: React.ReactNode;
  highlightTerm?: string;
  annotation?: string;
  startFrame?: number;
  duration?: number;
  color?: string;
  fontSize?: number;
};

export const Formula: React.FC<FormulaProps> = ({expression, highlightTerm, annotation, startFrame = 0, duration = 32, color = vibeTheme.colors.text.primary, fontSize = vibeTheme.typography.size.formula}) => {
  const frame = useCurrentFrame();
  const enter = progress(frame, startFrame, duration, 'easeOut');
  const pulse = highlightTerm ? interpolate(Math.sin(Math.max(0, frame - startFrame) * 0.08), [-1, 1], [0.7, 1]) : 1;
  const content = typeof expression === 'string' && highlightTerm && expression.includes(highlightTerm)
    ? expression.split(highlightTerm).map((part, index, pieces) => <React.Fragment key={index}>{part}{index < pieces.length - 1 && <tspan fill={vibeTheme.colors.accent.gold} opacity={pulse}>{highlightTerm}</tspan>}</React.Fragment>)
    : expression;
  return <g opacity={enter}>
    <text fill={color} fontFamily={vibeTheme.typography.family.display} fontSize={fontSize} fontStyle="italic">{content}</text>
    {annotation && <text y={fontSize * 0.78} fill={vibeTheme.colors.text.muted} fontFamily={vibeTheme.typography.family.technical} fontSize={vibeTheme.typography.size.numeric} letterSpacing="1.2">{annotation}</text>}
  </g>;
};
