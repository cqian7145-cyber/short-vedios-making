import {runGenerationCommand} from './generation-cli';

runGenerationCommand(process.argv.slice(2)).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Episode generation failed.');
  process.exitCode = 1;
});
