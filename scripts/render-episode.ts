import {renderEpisode} from './render/episodeRenderer';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run render:episode -- episodes/example.json');
  process.exitCode = 1;
} else {
  renderEpisode(file).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Episode rendering failed.');
    process.exitCode = 1;
  });
}
