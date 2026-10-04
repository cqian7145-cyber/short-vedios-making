import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Counter} from '../../components';
import {SectionLabel, Type} from '../../components/typography/Type';
import {vibeTheme} from '../../themes/vibeTheme';
import type {ComparisonSceneSpec} from '../sceneTypes';
import type {SceneComponentProps} from '../sceneProps';
import {NetworkStage} from './NetworkStage';

export const ComparisonScene: React.FC<SceneComponentProps<ComparisonSceneSpec>> = ({spec, context}) => {
  const network = context.network;
  return <AbsoluteFill>
    {network && <NetworkStage network={network} localFrame={context.localFrame} durationInFrames={context.durationInFrames} opacity={0.24} scale={0.78} translateX={210} translateY={30} showAddedEdge />}
    <div style={{position: 'absolute', left: 212, top: 180}}>
      <SectionLabel color={vibeTheme.colors.text.muted} style={{marginBottom: 14}}>{spec.content.eyebrow}</SectionLabel>
      <Type variant="title" style={{fontSize: 40}}>{spec.content.metricLabel}</Type>
    </div>
    <div style={{position: 'absolute', left: 342, top: 490, minWidth: 420}}>
      <SectionLabel color={vibeTheme.colors.text.secondary}>{spec.content.beforeLabel}</SectionLabel>
      <Counter from={spec.content.before} to={spec.content.before} suffix={spec.content.unit} prefix={spec.content.prefix} decimals={spec.content.decimals} startFrame={0} duration={1} style={{fontSize: 106, marginTop: 12}} />
    </div>
    <div style={{position: 'absolute', left: 1120, top: 490, minWidth: 440}}>
      <SectionLabel color={vibeTheme.colors.accent.red}>{spec.content.afterLabel}</SectionLabel>
      <Counter from={spec.content.before} to={spec.content.after} suffix={spec.content.unit} prefix={spec.content.prefix} decimals={spec.content.decimals} startFrame={0} duration={Math.round(context.durationInFrames * 0.52)} highlightOnChange color={vibeTheme.colors.text.primary} style={{fontSize: 106, marginTop: 12}} />
    </div>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <path d="M 865 530 H 1050" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.hairline} />
      <circle cx="958" cy="530" r="3" fill={vibeTheme.colors.accent.gold} />
      <path d="M 865 547 H 1050" stroke={vibeTheme.colors.line.subtle} strokeWidth={vibeTheme.lineWidths.hairline} />
    </svg>
  </AbsoluteFill>;
};
