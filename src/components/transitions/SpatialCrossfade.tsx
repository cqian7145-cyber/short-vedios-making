import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

export const SpatialCrossfade: React.FC<{children: React.ReactNode; enter: readonly [number, number]; exit?: readonly [number, number]; direction?: 'left' | 'right'; distance?: number; style?: React.CSSProperties}> = ({children, enter, exit, direction = 'left', distance = 18, style}) => {
  const frame = useCurrentFrame();
  const entering = interpolate(frame, [enter[0], enter[1]], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const leaving = exit ? interpolate(frame, [exit[0], exit[1]], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 0;
  const directionSign = direction === 'left' ? 1 : -1;
  const opacity = entering * (1 - leaving);
  const x = directionSign * distance * (1 - entering) - directionSign * distance * 0.45 * leaving;
  return <AbsoluteFill style={{opacity, transform: `translate3d(${x}px, 0, 0)`, ...style}}>{children}</AbsoluteFill>;
};
