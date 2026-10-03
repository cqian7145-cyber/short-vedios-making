import React from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {vibeTheme} from '../themes/vibeTheme';
import {Type} from './typography/Type';

type SubtitleProps = {text: string; highlight?: string; start: number; end: number; background?: 'dark' | 'busy'};

export const Subtitle: React.FC<SubtitleProps> = ({text, highlight, start, end, background = 'dark'}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [start, start + 18, end - 16, end], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = interpolate(frame, [start, start + 22], [8, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const phraseIndex = highlight ? text.indexOf(highlight) : -1;
  const before = phraseIndex >= 0 ? text.slice(0, phraseIndex) : text;
  const phrase = phraseIndex >= 0 ? text.slice(phraseIndex, phraseIndex + highlight!.length) : '';
  const after = phraseIndex >= 0 ? text.slice(phraseIndex + highlight!.length) : '';

  return <div style={{
    position: 'absolute', zIndex: vibeTheme.zIndex.subtitle, left: vibeTheme.safeArea.subtitleSide, right: vibeTheme.safeArea.subtitleSide,
    bottom: vibeTheme.safeArea.subtitleBottom, display: 'flex', justifyContent: 'center', opacity, transform: `translateY(${y}px)`,
    pointerEvents: 'none', textAlign: 'center',
  }}>
    <Type variant="subtitle" style={{maxWidth: 1420, maxHeight: 86, overflow: 'hidden', textShadow: background === 'busy' ? '0 1px 3px rgba(0,0,0,.9), 0 0 18px rgba(0,0,0,.72)' : '0 2px 18px rgba(0,0,0,.7)', background: background === 'busy' ? 'radial-gradient(ellipse at center, rgba(5,8,13,.36), transparent 74%)' : undefined, padding: background === 'busy' ? '4px 14px' : 0}}>
      {before}{phraseIndex >= 0 && <span style={{color: vibeTheme.colors.accent.gold}}>{phrase}</span>}{after}
    </Type>
  </div>;
};
