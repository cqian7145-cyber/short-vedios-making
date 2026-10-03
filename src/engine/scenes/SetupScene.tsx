import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SectionLabel, Type} from '../../components/typography/Type';
import {vibeTheme} from '../../themes/vibeTheme';
import type {SetupSceneSpec} from '../sceneTypes';
import type {SceneComponentProps} from '../sceneProps';
import {NetworkStage} from './NetworkStage';

export const SetupScene: React.FC<SceneComponentProps<SetupSceneSpec>> = ({spec, context}) => {
  const network = context.network;
  if (!network) return null;
  const first = network.routes[0];
  const second = network.routes[1];
  const destination = network.nodes[network.nodes.length - 1];
  return <AbsoluteFill>
    <NetworkStage network={network} localFrame={context.localFrame} durationInFrames={context.durationInFrames} flows={[
      ...(first ? [{routeId: first.id, count: 5, startFrame: 16, speed: 0.7, seed: `${spec.id}-upper`}] : []),
      ...(second ? [{routeId: second.id, count: 5, startFrame: 38, speed: 0.68, color: vibeTheme.colors.accent.cyan, seed: `${spec.id}-lower`}] : []),
    ]} />
    <div style={{position: 'absolute', left: 220, top: 178, maxWidth: 780}}>
      <SectionLabel color={vibeTheme.colors.text.muted} style={{marginBottom: 15}}>{spec.content.eyebrow}</SectionLabel>
      <Type variant="title" style={{fontSize: 43}}>{spec.content.title}</Type>
    </div>
    <div style={{position: 'absolute', left: 330, top: 785}}><SectionLabel color={vibeTheme.colors.accent.mutedGold}>{spec.content.routeLabel}</SectionLabel></div>
    {destination && <div style={{position: 'absolute', left: destination.x + 38, top: destination.y - 26}}><SectionLabel color={vibeTheme.colors.text.secondary}>{spec.content.destinationLabel}</SectionLabel></div>}
  </AbsoluteFill>;
};
