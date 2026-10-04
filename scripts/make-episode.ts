import {runGenerationCommand} from './generation-cli';

runGenerationCommand(process.argv.slice(2), true).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Episode generation and render failed.');
  process.exitCode = 1;
});
