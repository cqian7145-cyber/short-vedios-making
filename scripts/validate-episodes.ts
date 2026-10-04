import { readdir } from 'node:fs/promises';
import { loadEpisode } from '../src/episode/loadEpisode';
async function main() { for (const file of (await readdir('episodes')).filter(f => f.endsWith('.json')).sort()) {
    const e = await loadEpisode(`episodes/${file}`);
    console.log(`${file}: valid, ${e.durationInFrames} frames (${e.durationInFrames / e.fps}s)`);
} }
main().catch(error => { console.error(error.message); process.exitCode = 1; });
