import React from 'react';
import { SceneShell } from '../engine/SceneShell';
import { SceneTimeline } from '../engine/SceneTimeline';
import type { NormalizedEpisode } from '../episode/normalizeEpisode';
export type EpisodeVideoProps = {
    episode: NormalizedEpisode;
};
export const EpisodeVideo: React.FC<EpisodeVideoProps> = ({ episode }) => <SceneShell durationInFrames={episode.durationInFrames}><SceneTimeline scenes={episode.scenes} networks={episode.networks}/></SceneShell>;
