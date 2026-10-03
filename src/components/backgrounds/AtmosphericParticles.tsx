import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';

const particles = Array.from({length: 38}, (_, i) => ({
  x: ((i * 73 + 17) % 997) / 997,
  y: ((i * 193 + 43) % 991) / 991,
  size: 0.9 + ((i * 7) % 3) * 0.4,
  phase: (i * 37) % 101,
  speed: 0.08 + ((i * 11) % 7) * 0.018,
}));

export const AtmosphericParticles: React.FC<{density?: number}> = ({density = 1}) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none', opacity: density}}>
    {particles.map((p, i) => <span key={i} style={{
      position: 'absolute', left: `${p.x * 100}%`, top: `calc(${p.y * 100}% + ${(frame * p.speed + p.phase) % 90 - 45}px)`,
      width: p.size, height: p.size, borderRadius: '50%', backgroundColor: vibeTheme.colors.text.primary,
      opacity: vibeTheme.opacity.dust * (0.38 + (Math.sin(frame * 0.025 + p.phase) + 1) * 0.22),
      boxShadow: i % 13 === 0 ? '0 0 7px rgba(211,197,165,.22)' : undefined,
    }} />)}
  </AbsoluteFill>;
};
