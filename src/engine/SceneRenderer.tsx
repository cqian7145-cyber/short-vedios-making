import React from 'react';
import {AbsoluteFill} from 'remotion';
import {SpatialCrossfade} from '../components/transitions/SpatialCrossfade';
import {Subtitle} from '../components/Subtitle';
import {CameraDrift} from '../components/CameraDrift';
import type {SceneTimelineEntry, NetworkDiagramSpec} from './sceneTypes';
import {useSceneFrame} from './useSceneFrame';
import {renderRegisteredScene} from './sceneRegistry';
import type {SceneContext} from './sceneContext';

export const SceneRenderer: React.FC<{entry: SceneTimelineEntry; networks: Readonly<Record<string, NetworkDiagramSpec>>}> = ({entry, networks}) => {
  const frame = useSceneFrame(entry.spec.durationInFrames);
  const networkId = 'networkId' in entry.spec.content ? entry.spec.content.networkId : undefined;
  const context: SceneContext = {...frame, network: networkId ? networks[networkId] : undefined};
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
      <AbsoluteFill>
        {scene}
        {entry.spec.subtitle && <Subtitle text={entry.spec.subtitle} start={Math.round(entry.spec.durationInFrames * 0.15)} end={Math.round(entry.spec.durationInFrames * 0.86)} background="busy" />}
      </AbsoluteFill>
    </CameraDrift>
  </SpatialCrossfade>;
};
