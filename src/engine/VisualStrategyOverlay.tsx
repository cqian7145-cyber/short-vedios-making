import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AgentToken, Arrow, FlowParticles, HighlightRing, MiniChart, ProbabilityBar, Timeline} from '../components';
import type {SceneSpec, NetworkDiagramSpec} from './sceneTypes';
import type {SceneContext} from './sceneContext';
import {vibeTheme} from '../themes/vibeTheme';

const numericSeries = (spec: SceneSpec): number[] => {
  if (spec.type === 'comparison') return [spec.content.before, spec.content.after];
  if (spec.type === 'simulation' && spec.content.mode === 'bidding') return spec.content.bids.map((bid) => bid.amount);
  if (spec.type === 'simulation' && spec.content.mode === 'networkFlow') return Object.values(spec.content.redistributedRouteCounts);
  return [];
};

const getChartLabel = (spec: SceneSpec): string => {
  if (spec.type === 'comparison') return spec.content.metricLabel;
  if (spec.type === 'simulation') return spec.content.metricLabel;
  return '';
};

export const VisualStrategyOverlay: React.FC<{spec: SceneSpec; context: SceneContext; network?: NetworkDiagramSpec}> = ({spec, context, network}) => {
  const strategy = context.visualStrategy;
  if (!strategy) return null;
  const nodes = network?.nodes ?? [];
  const routes = network?.routes ?? [];

  if (strategy.rendererVariant === 'agent-relationship' && nodes.length >= 2) {
    const selected = nodes.slice(0, Math.min(3, nodes.length));
    return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} aria-hidden="true">
      {selected.slice(1).map((node, index) => <path key={`relation-${node.id}`} d={`M ${selected[0].x} ${selected[0].y} Q ${(selected[0].x + node.x) / 2} ${Math.min(selected[0].y, node.y) - 42} ${node.x} ${node.y}`} fill="none" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.hairline} opacity={0.46} />)}
      {selected.map((node, index) => <AgentToken key={node.id} x={node.x} y={node.y} label={node.label} state={index === 0 ? 'active' : 'waiting'} appearFrame={Math.round(context.durationInFrames * 0.12) + index * 9} duration={24} accent={index === 1 ? vibeTheme.colors.accent.cyan : vibeTheme.colors.accent.gold} scale={0.72} opacity={0.9} />)}
    </svg>;
  }

  if (strategy.rendererVariant === 'mini-chart') {
    const values = numericSeries(spec);
    if (values.length >= 2 && values.every(Number.isFinite)) {
      const low = Math.min(...values);
      const high = Math.max(...values);
      const margin = Math.max(1, (high - low) * 0.15);
      const data = values.map((value, index) => ({x: index, y: value}));
      return <div style={{position: 'absolute', right: 170, bottom: 130, opacity: 0.82, pointerEvents: 'none'}}>
        <div style={{fontFamily: vibeTheme.typography.family.technical, color: vibeTheme.colors.text.muted, fontSize: 12, letterSpacing: 2, marginBottom: 8, textAlign: 'right'}}>{getChartLabel(spec)}</div>
        <MiniChart data={data} xRange={[0, Math.max(1, data.length - 1)]} yRange={[low - margin, high + margin]} highlightIndex={data.length - 1} startFrame={Math.round(context.durationInFrames * 0.2)} duration={Math.round(context.durationInFrames * 0.55)} width={360} height={180} xLabel="SEQUENCE" />
      </div>;
    }
  }

  if (strategy.rendererVariant === 'probability-bar' && spec.type === 'comparison') {
    return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} aria-hidden="true">
      <g transform="translate(720 765)"><ProbabilityBar from={spec.content.before} to={spec.content.after} label={spec.content.metricLabel} startFrame={Math.round(context.durationInFrames * 0.15)} duration={Math.round(context.durationInFrames * 0.55)} width={420} color={vibeTheme.colors.accent.gold} /></g>
    </svg>;
  }

  if (strategy.rendererVariant === 'timeline' && strategy.timelineEvents?.length) {
    return <div style={{position: 'absolute', left: 490, bottom: 88, opacity: 0.72, pointerEvents: 'none'}}>
      <Timeline events={strategy.timelineEvents} duration={Math.round(context.durationInFrames * 0.7)} width={940} height={130} />
    </div>;
  }

  if (strategy.rendererVariant === 'diagram-geometry' && nodes.length) {
    const focus = network?.bottleneck ?? nodes[Math.floor(nodes.length / 2)];
    return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} aria-hidden="true">
      <HighlightRing x={focus.x} y={focus.y} radius={44} startFrame={Math.round(context.durationInFrames * 0.32)} duration={Math.max(20, Math.round(context.durationInFrames * 0.24))} color={vibeTheme.colors.accent.gold} opacity={0.38} />
    </svg>;
  }

  if (strategy.rendererVariant === 'flow-path' && routes.length) {
    const route = routes[0];
    return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, pointerEvents: 'none'}} aria-hidden="true">
      <Arrow path={route.path} startFrame={Math.round(context.durationInFrames * 0.12)} duration={Math.round(context.durationInFrames * 0.25)} color={vibeTheme.colors.accent.gold} opacity={0.68} />
      <FlowParticles path={route.path} count={5} startFrame={Math.round(context.durationInFrames * 0.34)} speed={0.82} seed={`factory-${spec.id}-${route.id}`} opacity={0.7} />
    </svg>;
  }

  return <AbsoluteFill style={{pointerEvents: 'none'}} />;
};
