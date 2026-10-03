import React from 'react';
import {vibeTheme} from '../../themes/vibeTheme';

export const HighlightedHeadline: React.FC<{text: string; emphasis?: string}> = ({text, emphasis}) => {
  if (!emphasis || !text.includes(emphasis)) return <>{text}</>;
  const index = text.indexOf(emphasis);
  return <>{text.slice(0, index)}<span style={{color: vibeTheme.colors.accent.gold}}>{emphasis}</span>{text.slice(index + emphasis.length)}</>;
};
