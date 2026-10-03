import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Arrow, Callout, Label} from '../../components';
import {SectionLabel, Type} from '../../components/typography/Type';
import {vibeTheme} from '../../themes/vibeTheme';
import type {DiagramSceneSpec} from '../sceneTypes';
import type {SceneComponentProps} from '../sceneProps';
import {NetworkStage} from './NetworkStage';

export const DiagramScene: React.FC<SceneComponentProps<DiagramSceneSpec>> = ({spec, context}) => {
  const network = context.network;
  if (!network) return null;
  const nodes = new Map(network.nodes.map((node) => [node.id, node]));
  const route = network.routes[0];
  return <AbsoluteFill>
    <NetworkStage network={network} localFrame={context.localFrame} durationInFrames={context.durationInFrames} highlightNodeId={spec.content.highlightNodeId} highlightEdgeId={spec.content.highlightEdgeId} />
    <div style={{position: 'absolute', left: 214, top: 178}}>
      <SectionLabel color={vibeTheme.colors.text.muted} style={{marginBottom: 16}}>{spec.content.eyebrow}</SectionLabel>
      <Type variant="title" style={{fontSize: 43}}>{spec.content.title}</Type>
    </div>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {route && <Arrow path={route.path} label={route.label} labelX={870} labelY={380} startFrame={22} duration={54} color={vibeTheme.colors.accent.gold} />}
      {spec.content.annotations.map((annotation, index) => {
        const node = nodes.get(annotation.anchorNodeId);
        return node && <Callout key={`${annotation.anchorNodeId}-${index}`} x={node.x + (index % 2 === 0 ? 110 : -110)} y={node.y + (index % 2 === 0 ? -45 : 72)} anchorX={node.x} anchorY={node.y} label={annotation.label} detail={annotation.detail} align={index % 2 === 0 ? 'start' : 'end'} startFrame={40 + index * 10} />;
      })}
      <Label x={310} y={805} color={vibeTheme.colors.text.muted} startFrame={58}>{spec.content.footnote}</Label>
    </svg>
  </AbsoluteFill>;
};
