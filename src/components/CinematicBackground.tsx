import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../themes/vibeTheme';
import {AtmosphericParticles} from './backgrounds/AtmosphericParticles';
import {DarkGradient} from './backgrounds/DarkGradient';
import {SubtleTexture} from './backgrounds/SubtleTexture';

export const CinematicBackground: React.FC<{archiveTexture?: boolean; durationFrames?: number}> = ({archiveTexture = false, durationFrames = 600}) => {
  const frame = useCurrentFrame();
  const fadeStart = Math.max(28, durationFrames - 45);
  const opacity = interpolate(frame, [0, 28, fadeStart, durationFrames], [.82, 1, .62, .05], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{backgroundColor: vibeTheme.colors.background.primary, overflow: 'hidden'}}>
    <DarkGradient opacity={opacity} />
    <AbsoluteFill style={{opacity: opacity * 0.92, zIndex: vibeTheme.zIndex.atmosphere}}><AtmosphericParticles /></AbsoluteFill>
    <AbsoluteFill style={{zIndex: vibeTheme.zIndex.texture}}><SubtleTexture archive={archiveTexture} /></AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(3,6,10,.34), transparent 28%, transparent 72%, rgba(3,6,10,.32))', pointerEvents: 'none', zIndex: vibeTheme.zIndex.atmosphere + 1}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,.42) 100%)', opacity: vibeTheme.opacity.vignette, pointerEvents: 'none', zIndex: vibeTheme.zIndex.atmosphere + 2}} />
  </AbsoluteFill>;
};
