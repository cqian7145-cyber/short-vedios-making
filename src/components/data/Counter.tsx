import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {Type} from '../typography/Type';
import {progress} from '../../utils/timing';
import {vibeTheme} from '../../themes/vibeTheme';

export type CounterProps = {
  from: number;
  to: number;
  startFrame?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  highlightOnChange?: boolean;
  color?: string;
  style?: React.CSSProperties;
};

export const Counter: React.FC<CounterProps> = ({from, to, startFrame = 0, duration = 60, prefix = '', suffix = '', decimals = 0, highlightOnChange = false, color = vibeTheme.colors.text.primary, style}) => {
  const frame = useCurrentFrame();
  const amount = progress(frame, startFrame, duration, 'easeInOut');
  const value = from + (to - from) * amount;
  const changed = highlightOnChange && frame >= startFrame && frame < startFrame + duration;
  const brightness = changed ? interpolate(Math.sin((frame - startFrame) * 0.18), [-1, 1], [0.75, 1]) : 1;
  return <Type variant="numeric" color={color} style={{fontFamily: vibeTheme.typography.family.display, fontSize: vibeTheme.typography.size.year * 0.34, fontVariantNumeric: 'tabular-nums', opacity: amount, textShadow: changed ? `0 0 16px ${vibeTheme.colors.accent.gold}33` : undefined, filter: `brightness(${brightness})`, ...style}}>{prefix}{value.toFixed(Math.max(0, decimals))}{suffix}</Type>;
};
