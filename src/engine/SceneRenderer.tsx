import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SpatialCrossfade} from '../components/transitions/SpatialCrossfade';
import {Subtitle} from '../components/Subtitle';
import {CameraDrift} from '../components/CameraDrift';
import type {SceneTimelineEntry, NetworkDiagramSpec} from './sceneTypes';
import {useSceneFrame} from './useSceneFrame';
import {renderRegisteredScene} from './sceneRegistry';
import type {SceneContext} from './sceneContext';
import type {ResolvedVisualStrategy} from '../factory/renderStrategy';
import {VisualStrategyOverlay} from './VisualStrategyOverlay';

const layoutTransforms = {
  'left-focus': 'translateX(-46px) scale(0.97)',
  'right-focus': 'translateX(46px) scale(0.97)',
  'center-stage': 'scale(1)',
  'full-field': 'scale(1.035)',
  'split-spatial': 'translateY(16px) scale(0.94)',
  topographic: 'translateY(-14px) scale(0.98)',
} as const;

export const SceneRenderer: React.FC<{entry: SceneTimelineEntry; networks: Readonly<Record<string, NetworkDiagramSpec>>; visualStrategies?: Readonly<Record<string, ResolvedVisualStrategy>>}> = ({entry, networks, visualStrategies}) => {
  const frame = useSceneFrame(entry.spec.durationInFrames);
  const networkId = 'networkId' in entry.spec.content ? entry.spec.content.networkId : undefined;
  const network = networkId ? networks[networkId] : undefined;
  const visualStrategy = visualStrategies?.[entry.spec.id];
  const context: SceneContext = {...frame, network, visualStrategy};
  const scene = renderRegisteredScene(entry.spec, context);
  const inFrames = entry.transitionInFrames;
  const outFrames = entry.transitionOutFrames;
  return <SpatialCrossfade
    enter={[0, Math.max(1, inFrames)]}
    exit={outFrames ? [Math.max(0, entry.spec.durationInFrames - outFrames), entry.spec.durationInFrames] : undefined}
    direction={entry.spec.transition?.direction ?? 'left'}
    distance={10}
  >
    <CameraDrift durationFrames={entry.spec.durationInFrames} move={entry.spec.intent?.camera ?? 'parallax'} amount={0.18}>
      <AbsoluteFill style={{transform: visualStrategy ? layoutTransforms[visualStrategy.layoutVariant] : undefined, transformOrigin: '50% 50%'}}>
        {scene}
        {visualStrategy && <VisualStrategyOverlay spec={entry.spec} context={context} network={network} />}
        {entry.spec.subtitle && <Subtitle text={entry.spec.subtitle} start={Math.round(entry.spec.durationInFrames * 0.15)} end={Math.round(entry.spec.durationInFrames * 0.86)} background="busy" />}
      </AbsoluteFill>
    </CameraDrift>
  </SpatialCrossfade>;
};
