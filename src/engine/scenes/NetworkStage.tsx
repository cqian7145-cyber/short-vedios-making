import React from 'react';
import {interpolate} from 'remotion';
import {AnimatedEdge, FlowParticles, HighlightRing, Node} from '../../components';
import {vibeTheme} from '../../themes/vibeTheme';
import type {AccentName, NetworkDiagramSpec} from '../sceneTypes';

export type NetworkStageProps = {
  network: NetworkDiagramSpec;
  localFrame: number;
  durationInFrames: number;
  showAddedEdge?: boolean;
  highlightNodeId?: string;
  highlightEdgeId?: string;
  accent?: AccentName;
  opacity?: number;
  scale?: number;
  translateX?: number;
  translateY?: number;
  flows?: readonly {routeId: string; count: number; startFrame: number; speed?: number; opacity?: number; color?: string; seed?: string}[];
};

const accentColor = (name: AccentName): string => name === 'red' ? vibeTheme.colors.accent.red : name === 'cyan' ? vibeTheme.colors.accent.cyan : vibeTheme.colors.accent.gold;

export const NetworkStage: React.FC<NetworkStageProps> = ({network, localFrame, durationInFrames, showAddedEdge = false, highlightNodeId, highlightEdgeId, accent = 'gold', opacity = 1, scale = 1, translateX = 0, translateY = 0, flows = []}) => {
  const nodes = new Map(network.nodes.map((node) => [node.id, node]));
  const accentColorValue = accentColor(accent);
  const edgeStart = Math.round(durationInFrames * 0.08);
  const edgeDuration = Math.max(16, Math.round(durationInFrames * 0.18));
  const addedStart = Math.round(durationInFrames * 0.34);
  const highlightNode = nodes.get(highlightNodeId ?? network.bottleneck?.nodeId ?? '');
  const addedOpacity = interpolate(localFrame, [addedStart, addedStart + Math.max(1, Math.round(durationInFrames * 0.1))], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, overflow: 'visible', opacity}} aria-hidden="true">
    <g transform={`translate(${translateX} ${translateY}) scale(${scale})`}>
      {network.edges.map((edge, index) => {
        if (edge.role === 'added' && !showAddedEdge) return null;
        const from = nodes.get(edge.from);
        const to = nodes.get(edge.to);
        if (!from || !to) return null;
        const path = edge.path ?? `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
        const active = edge.id === highlightEdgeId;
        const edgeOpacity = edge.role === 'added' ? addedOpacity : 1;
        return <g key={edge.id} opacity={edgeOpacity}>
          <AnimatedEdge path={path} startFrame={edge.role === 'added' ? addedStart : edgeStart + index * 3} duration={edge.role === 'added' ? Math.max(16, Math.round(durationInFrames * 0.11)) : edgeDuration} color={active ? accentColorValue : vibeTheme.colors.accent.mutedGold} width={active ? vibeTheme.lineWidths.emphasis : vibeTheme.lineWidths.thin} opacity={active ? 0.96 : 0.75} glow={active} />
        </g>;
      })}
      {network.edges.filter((edge) => edge.id === highlightEdgeId).map((edge) => {
        const from = nodes.get(edge.from);
        const to = nodes.get(edge.to);
        if (!from || !to) return null;
        const x = (from.x + to.x) / 2;
        const y = (from.y + to.y) / 2;
        return <text key={`edge-label-${edge.id}`} x={x} y={y - 16} textAnchor="middle" fill={accentColorValue} fontSize={vibeTheme.typography.size.numeric} fontFamily={vibeTheme.typography.family.technical} letterSpacing="1.5">{edge.label ?? edge.id.toUpperCase()}</text>;
      })}
      {flows.map((flow) => {
        const route = network.routes.find((candidate) => candidate.id === flow.routeId);
        return route && <FlowParticles key={`${flow.routeId}-${flow.seed ?? flow.startFrame}`} path={route.path} count={flow.count} startFrame={flow.startFrame} speed={flow.speed} opacity={flow.opacity} color={flow.color ?? (route.accent ? accentColor(route.accent) : accentColorValue)} seed={flow.seed ?? `${network.id}-${flow.routeId}`} />;
      })}
      {network.nodes.map((node, index) => <Node key={node.id} x={node.x} y={node.y} label={node.label} size={15} active={node.id === highlightNodeId} accent={accentColorValue} appearFrame={Math.round(durationInFrames * 0.04) + index * 3} duration={Math.max(12, Math.round(durationInFrames * 0.12))} />)}
      {highlightNode && <HighlightRing x={highlightNode.x} y={highlightNode.y} radius={36} startFrame={Math.round(durationInFrames * 0.38)} duration={28} color={accentColorValue} opacity={0.72} />}
      {showAddedEdge && network.bottleneck && <HighlightRing x={network.bottleneck.x} y={network.bottleneck.y} radius={28} startFrame={addedStart + 20} duration={24} color={vibeTheme.colors.accent.red} opacity={0.62} />}
    </g>
  </svg>;
};
