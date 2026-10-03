import React from 'react';
import {AbsoluteFill, interpolate} from 'remotion';
import {Callout, Counter, FlowParticles, HighlightRing, VehicleToken} from '../../components';
import {Caption, SectionLabel, Type} from '../../components/typography/Type';
import {vibeTheme} from '../../themes/vibeTheme';
import type {SimulationSceneSpec} from '../sceneTypes';
import type {SceneComponentProps} from '../sceneProps';
import {NetworkStage} from './NetworkStage';

export const SimulationScene: React.FC<SceneComponentProps<SimulationSceneSpec>> = ({spec, context}) => {
  const network = context.network;
  if (!network) return null;
  const {localFrame, durationInFrames} = context;
  const addStart = Math.round(durationInFrames * 0.33);
  const redistributeStart = Math.round(durationInFrames * 0.53);
  const finish = Math.round(durationInFrames * 0.82);
  const baselineOpacity = interpolate(localFrame, [0, redistributeStart - 12, redistributeStart + 18], [1, 1, 0.14], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const redistributedOpacity = interpolate(localFrame, [redistributeStart - 18, redistributeStart + 26, durationInFrames], [0, 1, 0.88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const baseMeasureOpacity = interpolate(localFrame, [0, finish - 30, finish + 5], [1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const finalMeasureOpacity = interpolate(localFrame, [finish - 20, finish + 18, durationInFrames], [0, 1, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const routeFlows = network.routes.flatMap((route) => {
    const before = spec.content.baselineRouteCounts[route.id] ?? 0;
    const after = spec.content.redistributedRouteCounts[route.id] ?? 0;
    return [
      ...(before > 0 ? [{routeId: route.id, count: before, startFrame: 8, speed: 0.78, opacity: baselineOpacity, color: vibeTheme.colors.accent.mutedGold, seed: `${spec.id}-before-${route.id}`}] : []),
      ...(after > 0 ? [{routeId: route.id, count: after, startFrame: redistributeStart, speed: 1.02, opacity: redistributedOpacity, color: route.id === spec.content.newRouteId ? vibeTheme.colors.accent.gold : vibeTheme.colors.accent.cyan, seed: `${spec.id}-after-${route.id}`}] : []),
    ];
  });
  const newEdge = network.edges.find((edge) => edge.id === spec.content.addedEdgeId);
  const source = newEdge ? network.nodes.find((node) => node.id === newEdge.from) : undefined;
  const destination = newEdge ? network.nodes.find((node) => node.id === newEdge.to) : undefined;
  const vehicleFrameStart = addStart + 28;
  const vehicleFrameEnd = Math.round(durationInFrames * 0.71);
  const vehicleProgress = interpolate(localFrame, [vehicleFrameStart, vehicleFrameEnd], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const vehicleOpacity = interpolate(localFrame, [vehicleFrameStart - 12, vehicleFrameStart + 8, vehicleFrameEnd - 10, vehicleFrameEnd + 16], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const bottleneck = network.bottleneck;

  return <AbsoluteFill>
    <NetworkStage network={network} localFrame={localFrame} durationInFrames={durationInFrames} showAddedEdge highlightEdgeId={spec.content.addedEdgeId} accent="gold" flows={routeFlows} />
    {source && destination && <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      <VehicleToken x={source.x + (destination.x - source.x) * vehicleProgress} y={source.y + (destination.y - source.y) * vehicleProgress} rotation={90} color={vibeTheme.colors.text.primary} startFrame={vehicleFrameStart} duration={22} opacity={vehicleOpacity} scale={0.82} />
    </svg>}
    <div style={{position: 'absolute', left: 214, top: 174}}>
      <SectionLabel color={vibeTheme.colors.text.muted} style={{marginBottom: 16}}>{spec.content.eyebrow}</SectionLabel>
      <Type variant="title" style={{fontSize: 39}}>{spec.content.metricLabel}</Type>
    </div>
    <div style={{position: 'absolute', left: 235, top: 700, opacity: baseMeasureOpacity}}>
      <Caption color={vibeTheme.colors.text.muted}>{spec.content.beforeCaption}</Caption>
      <Counter from={spec.content.from} to={spec.content.from} suffix={spec.content.unit} startFrame={0} duration={1} style={{fontSize: 86, marginTop: 6}} />
    </div>
    <div style={{position: 'absolute', left: 235, top: 700, opacity: finalMeasureOpacity}}>
      <Caption color={vibeTheme.colors.accent.gold}>{spec.content.afterCaption}</Caption>
      <Counter from={spec.content.from} to={spec.content.to} suffix={spec.content.unit} startFrame={finish} duration={Math.max(20, Math.round(durationInFrames * 0.14))} highlightOnChange style={{fontSize: 86, marginTop: 6}} />
    </div>
    {bottleneck && <>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
        <HighlightRing x={bottleneck.x} y={bottleneck.y} radius={44} startFrame={redistributeStart + 8} duration={24} color={vibeTheme.colors.accent.red} opacity={0.78} />
        <Callout x={bottleneck.x + 112} y={bottleneck.y - 12} anchorX={bottleneck.x + 8} anchorY={bottleneck.y} label={spec.content.bottleneckLabel} detail={`${spec.content.to}${spec.content.unit} total`} color={vibeTheme.colors.accent.red} startFrame={redistributeStart + 18} />
      </svg>
    </>}
  </AbsoluteFill>;
};
