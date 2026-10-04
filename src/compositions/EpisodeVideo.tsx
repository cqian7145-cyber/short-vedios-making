import React from 'react';
import { SceneShell } from '../engine/SceneShell';
import { SceneTimeline } from '../engine/SceneTimeline';
import type { NormalizedEpisode } from '../episode/normalizeEpisode';
import type {ResolvedVisualStrategy} from '../factory/renderStrategy';
export type EpisodeVideoProps = {
    episode: NormalizedEpisode;
    visualStrategies?: Record<string, ResolvedVisualStrategy>;
};
export const EpisodeVideo: React.FC<EpisodeVideoProps> = ({ episode, visualStrategies }) => <SceneShell durationInFrames={episode.durationInFrames}><SceneTimeline scenes={episode.scenes} networks={episode.networks} visualStrategies={visualStrategies}/></SceneShell>;
