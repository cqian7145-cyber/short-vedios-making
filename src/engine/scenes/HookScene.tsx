import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {VehicleToken} from '../../components';
import {SectionLabel, Type} from '../../components/typography/Type';
import {vibeTheme} from '../../themes/vibeTheme';
import type {HookSceneSpec} from '../sceneTypes';
import type {SceneComponentProps} from '../sceneProps';
import {NetworkStage} from './NetworkStage';
import {HighlightedHeadline} from './Headline';

export const HookScene: React.FC<SceneComponentProps<HookSceneSpec>> = ({spec, context}) => {
  const network = context.network;
  if (!network) return null;
  const {localFrame, durationInFrames} = context;
  const motion = interpolate(localFrame, [0, durationInFrames], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const upper = network.routes[0];
  const lower = network.routes[1];
  const source = network.nodes[0];
  const destination = network.nodes[network.nodes.length - 1];
  return <AbsoluteFill>
    <NetworkStage network={network} localFrame={localFrame} durationInFrames={durationInFrames} opacity={0.8} scale={0.72} translateX={175} translateY={140} flows={[
      ...(upper ? [{routeId: upper.id, count: 3, startFrame: 24, speed: 0.76, seed: `${spec.id}-upper`}] : []),
      ...(lower ? [{routeId: lower.id, count: 3, startFrame: 44, speed: 0.68, color: vibeTheme.colors.accent.cyan, seed: `${spec.id}-lower`}] : []),
    ]} />
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {source && <VehicleToken x={690 + motion * 205} y={493 - motion * 75} rotation={-18} startFrame={34} duration={26} scale={0.82} />}
      {destination && <VehicleToken x={850 + motion * 190} y={483 + motion * 62} rotation={18} startFrame={66} duration={26} scale={0.82} color={vibeTheme.colors.accent.cyan} />}
    </svg>
    <div style={{position: 'absolute', left: 210, top: 310, width: 570}}>
      <SectionLabel color={vibeTheme.colors.text.muted} style={{marginBottom: 28}}>{spec.content.eyebrow}</SectionLabel>
      <Type variant="title" style={{fontSize: 57, lineHeight: 1.34, whiteSpace: 'pre-line', textShadow: vibeTheme.glow.soft}}>
        <HighlightedHeadline text={spec.content.headline} emphasis={spec.content.emphasis} />
      </Type>
      <Type variant="sectionLabel" color={vibeTheme.colors.text.secondary} style={{fontSize: 19, letterSpacing: '.22em', marginTop: 36}}>{spec.content.question}</Type>
    </div>
  </AbsoluteFill>;
};
