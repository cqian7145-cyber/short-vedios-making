import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {loadEpisode} from '../../src/episode/loadEpisode';
import type {ResolvedVisualStrategy} from '../../src/factory/renderStrategy';
import type {HybridSceneAsset} from '../../src/assets/hybridComposer';
import type {ResolvedHybridAsset} from '../../src/composition/assetResolver';
import type {HybridSceneFallback,HybridLayout} from '../../src/composition/hybridTypes';

export type HybridRenderProps={resolvedHybridAssets?:Record<string,readonly ResolvedHybridAsset[]>;hybridFallbacks?:Record<string,readonly HybridSceneFallback[]>;hybridLayouts?:Record<string,HybridLayout>;signatureSceneIds?:readonly string[]};
export type RenderEpisodeOptions = {outputLocation?: string; visualStrategies?: Record<string, ResolvedVisualStrategy>; hybridSceneAssets?: Record<string, readonly HybridSceneAsset[]>; onProgress?: (progress: number) => void; quiet?: boolean}&HybridRenderProps;

export async function renderEpisode(file: string, options: RenderEpisodeOptions = {}): Promise<string> {
  const episode = await loadEpisode(file);
  await mkdir('output', {recursive: true});
  const outputLocation = path.resolve(options.outputLocation ?? path.join('output', `${path.basename(file, path.extname(file))}.mp4`));
  const inputProps = {episode, visualStrategies: options.visualStrategies, hybridSceneAssets: options.hybridSceneAssets,resolvedHybridAssets:options.resolvedHybridAssets,hybridFallbacks:options.hybridFallbacks,hybridLayouts:options.hybridLayouts,signatureSceneIds:options.signatureSceneIds};
  if (!options.quiet) console.log(`Validated ${episode.title}: ${episode.durationInFrames} frames. Bundling...`);
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  const composition = await selectComposition({serveUrl, id: 'EpisodeVideo', inputProps});
  let last = -1;
  await renderMedia({
    composition, serveUrl, inputProps, codec: 'h264', crf: 18, outputLocation, concurrency: 4,
    onProgress: ({progress}) => {
      options.onProgress?.(progress);
      if (options.quiet) return;
      const bucket = Math.floor(progress * 10);
      if (bucket !== last) {
        last = bucket;
        console.log(`Rendering ${bucket * 10}%`);
      }
    },
  });
  if (!options.quiet) console.log(`Rendered ${outputLocation} (${composition.width}x${composition.height}, ${composition.fps} fps, ${composition.durationInFrames / composition.fps}s)`);
  return outputLocation;
}

export async function renderEpisodeStillFrames(input: {
  file: string;
  outputDirectory: string;
  frames: readonly number[];
  visualStrategies?: Record<string, ResolvedVisualStrategy>;
  hybridProps?:HybridRenderProps;
}): Promise<string[]> {
  const episode = await loadEpisode(input.file);
  await mkdir(input.outputDirectory, {recursive: true});
  const inputProps = {episode, visualStrategies: input.visualStrategies,...input.hybridProps};
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  const composition = await selectComposition({serveUrl, id: 'EpisodeVideo', inputProps});
  const uniqueFrames = [...new Set(input.frames.map((frame) => Math.max(0, Math.min(composition.durationInFrames - 1, Math.round(frame)))))];
  const paths: string[] = [];
  for (const [index, frame] of uniqueFrames.entries()) {
    const filePath = path.join(input.outputDirectory, `frame-${String(index + 1).padStart(2, '0')}.png`);
    await renderStill({serveUrl, composition, inputProps, frame, output: filePath, imageFormat: 'png', overwrite: true, logLevel: 'error'});
    paths.push(filePath);
  }
  return paths;
}
