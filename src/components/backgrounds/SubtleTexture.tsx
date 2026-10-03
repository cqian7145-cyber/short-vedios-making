import React from 'react';
import {AbsoluteFill} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';

export const SubtleTexture: React.FC<{archive?: boolean}> = ({archive = false}) => (
  <AbsoluteFill style={{pointerEvents: 'none', opacity: archive ? vibeTheme.opacity.grid : vibeTheme.opacity.grain, mixBlendMode: 'screen'}}>
    <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, rgba(220,210,185,.22) 0, rgba(220,210,185,.22) 1px, transparent 1px, transparent 84px), repeating-linear-gradient(90deg, rgba(220,210,185,.18) 0, rgba(220,210,185,.18) 1px, transparent 1px, transparent 84px)'}} />
    <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(240,235,221,.34) .5px, transparent .9px)', backgroundSize: '11px 11px', opacity: 0.18}} />
    {archive && <AbsoluteFill style={{background: 'linear-gradient(90deg, transparent 0 14%, rgba(217,182,110,.16) 14.04%, transparent 14.1% 86%, rgba(217,182,110,.1) 86.04%, transparent 86.1%)'}} />}
  </AbsoluteFill>
);
