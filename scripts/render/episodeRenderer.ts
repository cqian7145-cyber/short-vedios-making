import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import {loadEpisode} from '../../src/episode/loadEpisode';

export async function renderEpisode(file: string): Promise<string> {
  const episode = await loadEpisode(file);
  await mkdir('output', {recursive: true});
  const outputLocation = path.resolve('output', `${path.basename(file, path.extname(file))}.mp4`);
  console.log(`Validated ${episode.title}: ${episode.durationInFrames} frames. Bundling...`);
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
  const inputProps = {episode};
  const composition = await selectComposition({serveUrl, id: 'EpisodeVideo', inputProps});
  let last = -1;
  await renderMedia({
    composition, serveUrl, inputProps, codec: 'h264', crf: 18, outputLocation, concurrency: 4,
    onProgress: ({progress}) => {
      const bucket = Math.floor(progress * 10);
      if (bucket !== last) {
        last = bucket;
        console.log(`Rendering ${bucket * 10}%`);
      }
    },
  });
  console.log(`Rendered ${outputLocation} (${composition.width}x${composition.height}, ${composition.fps} fps, ${composition.durationInFrames / composition.fps}s)`);
  return outputLocation;
}
