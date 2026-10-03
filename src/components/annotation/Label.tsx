import React from 'react';
import {useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {progress} from '../../utils/timing';

export type LabelProps = {x: number; y: number; children: React.ReactNode; color?: string; startFrame?: number; duration?: number; anchor?: 'start' | 'middle' | 'end'; size?: number};

export const Label: React.FC<LabelProps> = ({x, y, children, color = vibeTheme.colors.text.secondary, startFrame = 0, duration = 18, anchor = 'start', size = vibeTheme.typography.size.caption}) => {
  const frame = useCurrentFrame();
  return <text x={x} y={y} textAnchor={anchor} fill={color} opacity={progress(frame, startFrame, duration, 'easeOut')} fontFamily={vibeTheme.typography.family.technical} fontSize={size} letterSpacing="1.2">{children}</text>;
};
