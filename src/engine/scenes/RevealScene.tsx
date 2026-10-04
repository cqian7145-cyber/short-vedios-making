import {ParticipantsStage} from './ParticipantsStage';
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {HighlightRing} from '../../components';
import {SectionLabel, Type} from '../../components/typography/Type';
import {vibeTheme} from '../../themes/vibeTheme';
import type {RevealSceneSpec} from '../sceneTypes';
import type {SceneComponentProps} from '../sceneProps';
import {NetworkStage} from './NetworkStage';
import {HighlightedHeadline} from './Headline';

export const RevealScene: React.FC<SceneComponentProps<RevealSceneSpec>> = ({spec, context}) => {
  const network = context.network;
  const focusNode = network?.nodes.find((node) => node.id === spec.content.highlightNodeId) ?? network?.nodes[1];
  return <AbsoluteFill>
    {spec.content.participants && <ParticipantsStage labels={spec.content.participants} label={spec.content.relationshipLabel} />}
    {network && <NetworkStage network={network} localFrame={context.localFrame} durationInFrames={context.durationInFrames} opacity={0.38} highlightNodeId={spec.content.highlightNodeId} highlightEdgeId={spec.content.highlightEdgeId} accent="red" showAddedEdge scale={0.9} translateX={54} translateY={8} />}
    {focusNode && <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}><HighlightRing x={focusNode.x} y={focusNode.y} radius={64} startFrame={22} duration={40} color={vibeTheme.colors.accent.red} opacity={0.54} /></svg>}
    <div style={{position: 'absolute', left: 225, top: 350, width: 920}}>
      <SectionLabel color={vibeTheme.colors.accent.mutedGold} style={{marginBottom: 24}}>{spec.content.eyebrow}</SectionLabel>
      <Type variant="title" style={{fontSize: 67, lineHeight: 1.28, whiteSpace: 'pre-line', textShadow: vibeTheme.glow.soft}}>
        <HighlightedHeadline text={spec.content.headline} emphasis={spec.content.emphasis} />
      </Type>
    </div>
  </AbsoluteFill>;
};
