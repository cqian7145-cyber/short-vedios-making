import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Formula} from '../../components';
import {Caption, SectionLabel, Type} from '../../components/typography/Type';
import {vibeTheme} from '../../themes/vibeTheme';
import type {HistorySceneSpec} from '../sceneTypes';
import type {SceneComponentProps} from '../sceneProps';
import {NetworkStage} from './NetworkStage';

export const HistoryScene: React.FC<SceneComponentProps<HistorySceneSpec>> = ({spec, context}) => <AbsoluteFill>
  {context.network && <NetworkStage network={context.network} localFrame={context.localFrame} durationInFrames={context.durationInFrames} scale={0.48} translateX={835} translateY={112} opacity={0.48} />}
  <div style={{position: 'absolute', left: 214, top: 390}}>
    <SectionLabel color={vibeTheme.colors.accent.mutedGold} style={{marginBottom: 14}}>{spec.content.eyebrow}</SectionLabel>
    <Type variant="year" style={{fontSize: 148, color: vibeTheme.colors.text.primary}}>{spec.content.year}</Type>
    <Type variant="title" style={{fontSize: 38, marginTop: 14}}>{spec.content.name}</Type>
    <Caption style={{marginTop: 20, letterSpacing: '.17em', color: vibeTheme.colors.accent.mutedGold}}>{spec.content.mark}</Caption>
  </div>
  <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
    <path d="M 218 735 H 760" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.hairline} />
    <g transform="translate(1000 750)"><Formula expression={spec.content.formula} annotation={spec.content.formulaAnnotation} startFrame={22} duration={36} fontSize={42} /></g>
  </svg>
</AbsoluteFill>;
