import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../themes/vibeTheme';

export const Subtitle: React.FC<{text: string; highlight?: string; start: number; end: number}> = ({text, highlight, start, end}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start, start + 15, end - 12, end], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const parts = highlight ? text.split(highlight) : [text];
  return <div style={{position: 'absolute', left: vibeTheme.spacing.safeX, right: vibeTheme.spacing.safeX, bottom: vibeTheme.spacing.subtitleBottom, textAlign: 'center', opacity, color: vibeTheme.colors.ivory, fontFamily: vibeTheme.fonts.body, fontSize: 30, fontWeight: 400, letterSpacing: '.025em', textShadow: '0 2px 18px rgba(0,0,0,.7)', pointerEvents: 'none'}}>
    {parts.map((part, i) => <React.Fragment key={i}>{part}{i < parts.length - 1 && <span style={{color: vibeTheme.colors.gold}}>{highlight}</span>}</React.Fragment>)}
  </div>;
};
