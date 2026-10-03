import React from 'react';
import {AbsoluteFill} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';

export const DarkGradient: React.FC<{opacity?: number}> = ({opacity = 1}) => (
  <AbsoluteFill style={{opacity, background: `radial-gradient(ellipse at 52% 46%, ${vibeTheme.colors.background.secondary} 0%, ${vibeTheme.colors.background.mid} 42%, ${vibeTheme.colors.background.primary} 78%)`}} />
);
