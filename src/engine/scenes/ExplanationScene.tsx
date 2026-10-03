import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AgentToken, Arrow, Callout, FlowParticles, HighlightRing, Node} from '../../components';
import {SectionLabel, Type} from '../../components/typography/Type';
import {vibeTheme} from '../../themes/vibeTheme';
import type {ExplanationSceneSpec} from '../sceneTypes';
import type {SceneComponentProps} from '../sceneProps';
import {NetworkStage} from './NetworkStage';

export const ExplanationScene: React.FC<SceneComponentProps<ExplanationSceneSpec>> = ({spec, context}) => {
  const network = context.network;
  if (!network) return null;
  const focusNode = network.nodes.find((node) => node.id === spec.content.focusNodeId) ?? network.bottleneck;
  const flowA = 'M 555 500 Q 760 438 1000 540';
  const flowB = 'M 555 635 Q 770 640 1000 540';
  return <AbsoluteFill>
    <NetworkStage network={network} localFrame={context.localFrame} durationInFrames={context.durationInFrames} opacity={0.22} showAddedEdge scale={0.72} translateX={196} translateY={120} />
    <div style={{position: 'absolute', left: 210, top: 242, maxWidth: 650}}>
      <SectionLabel color={vibeTheme.colors.text.muted} style={{marginBottom: 16}}>{spec.content.individualLabel}</SectionLabel>
      <Type variant="title" style={{fontSize: 34}}>{spec.content.individualStatement}</Type>
    </div>
    <div style={{position: 'absolute', right: 205, top: 300, maxWidth: 500, textAlign: 'right'}}>
      <SectionLabel color={vibeTheme.colors.accent.red} style={{marginBottom: 16}}>{spec.content.systemLabel}</SectionLabel>
      <Type variant="title" style={{fontSize: 34}}>{spec.content.systemStatement}</Type>
    </div>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
      <Arrow path={flowA} startFrame={16} duration={58} color={vibeTheme.colors.accent.gold} />
      <Arrow path={flowB} startFrame={32} duration={58} color={vibeTheme.colors.accent.cyan} />
      <FlowParticles path={flowA} count={5} startFrame={54} speed={0.9} seed={`${spec.id}-choice-a`} />
      <FlowParticles path={flowB} count={5} startFrame={64} speed={0.94} color={vibeTheme.colors.accent.cyan} seed={`${spec.id}-choice-b`} />
      <AgentToken x={530} y={500} label={spec.content.driverLabels[0]} state="active" appearFrame={0} />
      <AgentToken x={530} y={635} label={spec.content.driverLabels[1]} state="active" appearFrame={18} accent={vibeTheme.colors.accent.cyan} />
      <Node x={1000} y={540} label={spec.content.sharedLinkLabel} size={17} active pulse appearFrame={60} accent={vibeTheme.colors.accent.red} />
      {focusNode && <HighlightRing x={focusNode.x} y={focusNode.y} radius={46} startFrame={84} duration={28} color={vibeTheme.colors.accent.red} />}
      <Callout x={1120} y={636} anchorX={1000} anchorY={540} label={spec.content.bottleneckLabel} detail={spec.content.systemStatement} color={vibeTheme.colors.accent.red} startFrame={94} />
      <text x="960" y="825" textAnchor="middle" fill={vibeTheme.colors.text.primary} fontFamily={vibeTheme.typography.family.technical} fontSize="20" letterSpacing="2">{spec.content.principle}</text>
    </svg>
  </AbsoluteFill>;
};
