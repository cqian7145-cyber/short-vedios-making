import React from 'react';
import {AnimatedEdge} from './diagram/Edge';

export type GlowPathProps = {
  d: string;
  startFrame?: number;
  duration?: number;
  /** @deprecated Use startFrame. Kept for Task 001/002 source compatibility. */
  start?: number;
  /** @deprecated Use duration with startFrame. */
  end?: number;
  color?: string;
  width?: number;
  opacity?: number;
  direction?: 'forward' | 'reverse';
  progress?: number;
};

export const GlowPath: React.FC<GlowPathProps> = ({d, startFrame, duration, start, end, color, width, opacity, direction, progress}) => {
  const resolvedStart = startFrame ?? start ?? 0;
  const resolvedDuration = duration ?? (end === undefined ? 36 : Math.max(1, end - resolvedStart));
  return <AnimatedEdge path={d} startFrame={resolvedStart} duration={resolvedDuration} color={color} width={width} opacity={opacity} direction={direction} progress={progress} glow />;
};
