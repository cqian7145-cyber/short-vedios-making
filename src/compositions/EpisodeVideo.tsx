import React from 'react';
import { SceneShell } from '../engine/SceneShell';
import { SceneTimeline } from '../engine/SceneTimeline';
import type { NormalizedEpisode } from '../episode/normalizeEpisode';
import type {ResolvedVisualStrategy} from '../factory/renderStrategy';
import type {HybridSceneAsset} from '../assets/hybridComposer';
import type {HybridSceneFallback,HybridLayout} from '../composition/hybridTypes';
export type EpisodeVideoProps = {
    episode: NormalizedEpisode;
    visualStrategies?: Record<string, ResolvedVisualStrategy>;
    hybridSceneAssets?: Record<string, readonly HybridSceneAsset[]>;
    resolvedHybridAssets?: Record<string, readonly import('../composition/assetResolver').ResolvedHybridAsset[]>;
    hybridFallbacks?: Record<string, readonly HybridSceneFallback[]>;
    hybridLayouts?: Record<string, HybridLayout>;
    signatureSceneIds?: readonly string[];
};
export const EpisodeVideo: React.FC<EpisodeVideoProps> = ({ episode, visualStrategies, hybridSceneAssets, resolvedHybridAssets, hybridFallbacks, hybridLayouts, signatureSceneIds }) => <SceneShell durationInFrames={episode.durationInFrames}><SceneTimeline scenes={episode.scenes} networks={episode.networks} visualStrategies={visualStrategies} hybridSceneAssets={hybridSceneAssets} resolvedHybridAssets={resolvedHybridAssets} hybridFallbacks={hybridFallbacks} hybridLayouts={hybridLayouts} signatureSceneIds={signatureSceneIds}/></SceneShell>;
