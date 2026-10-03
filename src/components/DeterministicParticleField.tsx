import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';

const PARTICLES = Array.from({length: 54}, (_, i) => ({
  x: ((i * 73 + 17) % 997) / 997, y: ((i * 193 + 43) % 991) / 991,
  size: 1 + ((i * 7) % 3) * 0.45, phase: (i * 37) % 101, speed: 0.12 + ((i * 11) % 7) * 0.025,
}));

export const DeterministicParticleField: React.FC = () => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{overflow: 'hidden', pointerEvents: 'none'}}>
    {PARTICLES.map((p, i) => <span key={i} style={{position: 'absolute', left: `${p.x * 100}%`, top: `calc(${p.y * 100}% + ${(frame * p.speed + p.phase) % 120 - 60}px)`, width: p.size, height: p.size, borderRadius: '50%', backgroundColor: '#D3C5A5', opacity: .16 + (Math.sin(frame * .035 + p.phase) + 1) * .12, boxShadow: i % 11 === 0 ? '0 0 9px rgba(211,197,165,.3)' : undefined}} />)}
  </AbsoluteFill>;
};
