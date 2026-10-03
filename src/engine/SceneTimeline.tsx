import React from 'react';
import {Sequence} from 'remotion';
import {buildSceneTimeline} from './timeline';
import type {NetworkDiagramSpec, SceneSpec} from './sceneTypes';
import {SceneRenderer} from './SceneRenderer';

export type SceneTimelineProps = {scenes: readonly SceneSpec[]; networks: Readonly<Record<string, NetworkDiagramSpec>>};

export const SceneTimeline: React.FC<SceneTimelineProps> = ({scenes, networks}) => {
  const timeline = buildSceneTimeline(scenes);
  return <>
    {timeline.map((entry) => <Sequence
      key={entry.spec.id}
      from={entry.startFrame}
      durationInFrames={entry.spec.durationInFrames}
      premountFor={entry.transitionInFrames || 1}
    >
      <SceneRenderer entry={entry} networks={networks} />
    </Sequence>)}
  </>;
};
