import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../themes/vibeTheme';
import {DeterministicParticleField} from './DeterministicParticleField';

export const CinematicBackground: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 28, 555, 600], [.82, 1, .62, .05], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const drift = interpolate(frame, [0, 600], [0, -18]);
  return <AbsoluteFill style={{backgroundColor: vibeTheme.colors.background, overflow: 'hidden'}}>
    <AbsoluteFill style={{opacity, transform: `scale(${1.025 + frame * .000035}) translate3d(${drift}px, ${drift * .38}px, 0)`, background: `radial-gradient(ellipse at 52% 47%, ${vibeTheme.colors.backgroundSecondary} 0%, #080D14 40%, ${vibeTheme.colors.background} 76%)`}} />
    <AbsoluteFill style={{opacity: opacity * .8}}><DeterministicParticleField /></AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(3,6,10,.38), transparent 28%, transparent 72%, rgba(3,6,10,.35))', pointerEvents: 'none'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,.45) 100%)', pointerEvents: 'none'}} />
  </AbsoluteFill>;
};
