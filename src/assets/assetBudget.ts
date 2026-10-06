import type {Episode} from '../episode/schema';
import {normalizeEpisode} from '../episode/normalizeEpisode';

export type AssetBudgetTier = {recommendedMin: number; recommendedMax: number; hardMax: number};

export function assetBudgetForDuration(durationSeconds: number): AssetBudgetTier {
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) throw new Error('Episode duration must be a positive finite number.');
  if (durationSeconds < 120) return {recommendedMin: 2, recommendedMax: 4, hardMax: 5};
  if (durationSeconds <= 180) return {recommendedMin: 4, recommendedMax: 7, hardMax: 8};
  return {recommendedMin: 4, recommendedMax: 7, hardMax: 8};
}

export function episodeDurationSeconds(episode: Episode): number {
  return normalizeEpisode(episode).durationInFrames / episode.fps;
}
