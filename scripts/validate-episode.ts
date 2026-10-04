import { loadEpisode } from '../src/episode/loadEpisode';
async function main() { const path = process.argv[2]; if (!path)
    throw new Error('Usage: npm run validate:episode -- episodes/example.json'); const e = await loadEpisode(path); console.log(`${path}: valid, ${e.scenes.length} scenes, ${e.durationInFrames} frames, ${e.durationInFrames / e.fps}s`); }
main().catch(error => { console.error(error.message); process.exitCode = 1; });
