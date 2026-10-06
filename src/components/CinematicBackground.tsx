import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../themes/vibeTheme';
import {AtmosphericParticles} from './backgrounds/AtmosphericParticles';
import {DarkGradient} from './backgrounds/DarkGradient';
import {SubtleTexture} from './backgrounds/SubtleTexture';

export function backgroundOpacityFrames(durationFrames: number): [number, number, number, number] {
  const endFrame = Math.max(3, Math.floor(durationFrames));
  const riseEnd = Math.max(1, Math.min(28, Math.floor(endFrame * 0.18)));
  const fadeStart = Math.max(riseEnd + 1, Math.floor(endFrame * 0.78));
  const fadeEnd = Math.max(fadeStart + 1, endFrame);
  return [0, riseEnd, fadeStart, fadeEnd];
}

export const CinematicBackground: React.FC<{archiveTexture?: boolean; durationFrames?: number}> = ({archiveTexture = false, durationFrames = 600}) => {
  const frame = useCurrentFrame();
  // Keep frame ranges strictly increasing even for short Episode smoke renders.
  const opacity = interpolate(frame, backgroundOpacityFrames(durationFrames), [.82, 1, .62, .05], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{backgroundColor: vibeTheme.colors.background.primary, overflow: 'hidden'}}>
    <DarkGradient opacity={opacity} />
    <AbsoluteFill style={{opacity: opacity * 0.92, zIndex: vibeTheme.zIndex.atmosphere}}><AtmosphericParticles /></AbsoluteFill>
    <AbsoluteFill style={{zIndex: vibeTheme.zIndex.texture}}><SubtleTexture archive={archiveTexture} /></AbsoluteFill>
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(3,6,10,.34), transparent 28%, transparent 72%, rgba(3,6,10,.32))', pointerEvents: 'none', zIndex: vibeTheme.zIndex.atmosphere + 1}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,.42) 100%)', opacity: vibeTheme.opacity.vignette, pointerEvents: 'none', zIndex: vibeTheme.zIndex.atmosphere + 2}} />
  </AbsoluteFill>;
};
