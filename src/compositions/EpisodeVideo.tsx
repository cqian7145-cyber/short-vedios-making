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
    draftLabel?: string;
};
export const EpisodeVideo: React.FC<EpisodeVideoProps> = ({ episode, visualStrategies, hybridSceneAssets, resolvedHybridAssets, hybridFallbacks, hybridLayouts, signatureSceneIds, draftLabel }) => <SceneShell durationInFrames={episode.durationInFrames}><SceneTimeline scenes={episode.scenes} networks={episode.networks} visualStrategies={visualStrategies} hybridSceneAssets={hybridSceneAssets} resolvedHybridAssets={resolvedHybridAssets} hybridFallbacks={hybridFallbacks} hybridLayouts={hybridLayouts} signatureSceneIds={signatureSceneIds}/>{draftLabel?<div style={{position:'absolute',zIndex:1000,left:64,top:42,padding:'7px 11px',color:'#e8e3d7',backgroundColor:'rgba(5,8,12,.82)',borderLeft:'2px solid #c8a45d',fontFamily:'Arial, sans-serif',fontSize:18,letterSpacing:2,lineHeight:1.2}}>{draftLabel}</div>:null}</SceneShell>;
