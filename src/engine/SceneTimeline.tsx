import React from 'react';
import {Sequence} from 'remotion';
import {buildSceneTimeline} from './timeline';
import type {NetworkDiagramSpec, SceneSpec} from './sceneTypes';
import {SceneRenderer} from './SceneRenderer';
import type {ResolvedVisualStrategy} from '../factory/renderStrategy';

export type SceneTimelineProps = {scenes: readonly SceneSpec[]; networks: Readonly<Record<string, NetworkDiagramSpec>>; visualStrategies?: Readonly<Record<string, ResolvedVisualStrategy>>};

export const SceneTimeline: React.FC<SceneTimelineProps> = ({scenes, networks, visualStrategies}) => {
  const timeline = buildSceneTimeline(scenes);
  return <>
    {timeline.map((entry) => <Sequence
      key={entry.spec.id}
      from={entry.startFrame}
      durationInFrames={entry.spec.durationInFrames}
      premountFor={entry.transitionInFrames || 1}
    >
      <SceneRenderer entry={entry} networks={networks} visualStrategies={visualStrategies} />
    </Sequence>)}
  </>;
};
