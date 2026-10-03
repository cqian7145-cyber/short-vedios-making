import React from 'react';
import {Composition} from 'remotion';
import {Task001Foundation} from './compositions/Task001Foundation';
import {Task002VisualSystem} from './compositions/Task002VisualSystem';
import {Task003ComponentGallery} from './compositions/Task003ComponentGallery';
import {Task004SceneEngine} from './compositions/Task004SceneEngine';

export const RemotionRoot: React.FC = () => <>
  <Composition id="Task001Foundation" component={Task001Foundation} width={1920} height={1080} fps={30} durationInFrames={600} />
  <Composition id="Task002VisualSystem" component={Task002VisualSystem} width={1920} height={1080} fps={30} durationInFrames={900} />
  <Composition id="Task003ComponentGallery" component={Task003ComponentGallery} width={1920} height={1080} fps={30} durationInFrames={1350} />
  <Composition id="Task004SceneEngine" component={Task004SceneEngine} width={1920} height={1080} fps={30} durationInFrames={1800} />
</>;
