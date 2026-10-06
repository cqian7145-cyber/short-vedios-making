import React from 'react';
import {Sequence} from 'remotion';
import {buildSceneTimeline} from './timeline';
import type {NetworkDiagramSpec, SceneSpec} from './sceneTypes';
import {SceneRenderer} from './SceneRenderer';
import type {ResolvedVisualStrategy} from '../factory/renderStrategy';
import type {HybridSceneAsset} from '../assets/hybridComposer';
import type {HybridSceneFallback,HybridLayout} from '../composition/hybridTypes';
import type {ResolvedHybridAsset} from '../composition/assetResolver';

export type SceneTimelineProps = {scenes: readonly SceneSpec[]; networks: Readonly<Record<string, NetworkDiagramSpec>>; visualStrategies?: Readonly<Record<string, ResolvedVisualStrategy>>; hybridSceneAssets?: Readonly<Record<string, readonly HybridSceneAsset[]>>;resolvedHybridAssets?:Readonly<Record<string,readonly ResolvedHybridAsset[]>>;hybridFallbacks?:Readonly<Record<string,readonly HybridSceneFallback[]>>;hybridLayouts?:Readonly<Record<string,HybridLayout>>;signatureSceneIds?:readonly string[]};

export const SceneTimeline: React.FC<SceneTimelineProps> = ({scenes, networks, visualStrategies, hybridSceneAssets,resolvedHybridAssets,hybridFallbacks,hybridLayouts,signatureSceneIds}) => {
  const timeline = buildSceneTimeline(scenes);
  return <>
    {timeline.map((entry) => <Sequence
      key={entry.spec.id}
      from={entry.startFrame}
      durationInFrames={entry.spec.durationInFrames}
      premountFor={entry.transitionInFrames || 1}
    >
      <SceneRenderer entry={entry} networks={networks} visualStrategies={visualStrategies} hybridSceneAssets={hybridSceneAssets} resolvedHybridAssets={resolvedHybridAssets} hybridFallbacks={hybridFallbacks} hybridLayout={hybridLayouts?.[entry.spec.id]} signatureScene={signatureSceneIds?.includes(entry.spec.id)??false} />
    </Sequence>)}
  </>;
};
