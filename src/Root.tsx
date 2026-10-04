import {EpisodeVideo} from './compositions/EpisodeVideo';
import {normalizeEpisode} from './episode/normalizeEpisode';
import preview from '../episodes/braess-paradox.json';
const episode=normalizeEpisode(preview);
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
<Composition id="EpisodeVideo" component={EpisodeVideo} defaultProps={{episode}} width={1920} height={1080} fps={30} durationInFrames={episode.durationInFrames} calculateMetadata={({props})=>({durationInFrames:props.episode.durationInFrames,fps:props.episode.fps,width:props.episode.width,height:props.episode.height})}/>
</>;
