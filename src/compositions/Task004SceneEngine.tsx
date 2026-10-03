import React from 'react';
import {getTimelineDuration, buildSceneTimeline} from '../engine/timeline';
import {SceneShell} from '../engine/SceneShell';
import {SceneTimeline} from '../engine/SceneTimeline';
import {task004Demo} from '../data/task004Demo';

const timeline = buildSceneTimeline(task004Demo.scenes);
if (getTimelineDuration(timeline) !== task004Demo.durationInFrames) {
  throw new Error(`Task 004 timeline is ${getTimelineDuration(timeline)} frames; expected ${task004Demo.durationInFrames}.`);
}

export const Task004SceneEngine: React.FC = () => <SceneShell durationInFrames={task004Demo.durationInFrames}>
  <SceneTimeline scenes={task004Demo.scenes} networks={task004Demo.networks} />
</SceneShell>;
