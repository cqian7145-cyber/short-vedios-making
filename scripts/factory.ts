import 'dotenv/config';
import {runFactory} from '../src/factory/factory';
import {FACTORY_USAGE, parseFactoryArgs} from '../src/factory/parseFactoryArgs';
import {redactFactoryMessage} from '../src/factory/factoryReport';

async function main(): Promise<void> {
  const options = parseFactoryArgs(process.argv.slice(2));
  if (options.help) {
    console.log(FACTORY_USAGE);
    return;
  }
  const result = await runFactory(options);
  console.log(`\nFactory complete: ${result.report.releaseStatus}`);
  console.log(`Video: ${result.outputPath ?? 'not rendered (--skip-render)'}`);
  console.log(`Delivery: ${result.deliveryDirectory}`);
}

main().catch((error: unknown) => {
  console.error(redactFactoryMessage(error instanceof Error ? error.message : String(error)));
  process.exitCode = 1;
});
