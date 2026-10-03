import React from 'react';
import {useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {drawProgress, progress} from '../../utils/timing';

export type AnimatedEdgeProps = {
  path: string;
  startFrame?: number;
  duration?: number;
  color?: string;
  width?: number;
  opacity?: number;
  direction?: 'forward' | 'reverse';
  progress?: number;
  glow?: boolean;
};

export const AnimatedEdge: React.FC<AnimatedEdgeProps> = ({path, startFrame = 0, duration = 36, color = vibeTheme.colors.accent.mutedGold, width = vibeTheme.lineWidths.thin, opacity = 1, direction = 'forward', progress: suppliedProgress, glow = false}) => {
  const frame = useCurrentFrame();
  const amount = suppliedProgress === undefined ? drawProgress(frame, startFrame, duration, 'easeInOut') : Math.max(0, Math.min(1, suppliedProgress));
  return <path d={path} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" pathLength={1} strokeDasharray={`${amount} 1`} strokeDashoffset={direction === 'reverse' ? 1 - amount : 0} opacity={opacity} style={glow ? {filter: `drop-shadow(0 0 5px ${color}44)`} : undefined} />;
};

export const Edge = AnimatedEdge;
