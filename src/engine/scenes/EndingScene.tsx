import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {SectionLabel, Type} from '../../components/typography/Type';
import {vibeTheme} from '../../themes/vibeTheme';
import type {EndingSceneSpec} from '../sceneTypes';
import type {SceneComponentProps} from '../sceneProps';
import {NetworkStage} from './NetworkStage';

export const EndingScene: React.FC<SceneComponentProps<EndingSceneSpec>> = ({spec, context}) => {
  const {localFrame, durationInFrames} = context;
  const network = context.network;
  const fade = interpolate(localFrame, [durationInFrames * 0.68, durationInFrames - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{opacity: fade}}>
    {network && <NetworkStage network={network} localFrame={localFrame} durationInFrames={durationInFrames} opacity={0.18} scale={0.84} translateY={26} />}
    <div style={{position: 'absolute', left: 0, right: 0, top: 392, textAlign: 'center'}}>
      <SectionLabel color={vibeTheme.colors.accent.mutedGold} style={{letterSpacing: '.24em', marginBottom: 22}}>{spec.content.concept}</SectionLabel>
      <Type variant="title" color={vibeTheme.colors.text.secondary} style={{fontSize: 26, fontWeight: 400, letterSpacing: '.04em'}}>{spec.content.summary}</Type>
      <div style={{height: 1, width: 68, background: vibeTheme.colors.accent.mutedGold, opacity: 0.55, margin: '34px auto 22px'}} />
      <SectionLabel color={vibeTheme.colors.text.primary} style={{letterSpacing: '.28em', fontSize: 17}}>{spec.content.brand}</SectionLabel>
    </div>
  </AbsoluteFill>;
};
