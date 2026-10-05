import 'dotenv/config';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { resolveRecraftConfig } from '../src/recraft/config';
import { safeRecraftError } from '../src/recraft/errors';
import {
  RecraftAssetManifestSchema,
  RecraftStyleValidationReportSchema,
} from '../src/recraft/schemas';
import { createPendingStyleReport } from '../src/recraft/styleValidation';
import { RECRAFT_STYLE_PROFILE } from '../src/visual/recraftStyleProfile';
import { RecraftProvider } from '../src/recraft/RecraftProvider';
import { RecraftAssetType } from '../src/recraft/types';

const root = process.cwd();
const outputDirectory = path.join(root, 'assets/style-validation/recraft-v1');
const manifestPath = path.join(outputDirectory, 'validation-manifest.json');
const reportPath = path.join(root, 'generated/style-validation/recraft-v1-report.json');
const smokeOutput = 'assets/style-validation/recraft-v1/smoke-steam-engine.png';

type ValidationAsset = {
  id: string;
  subject: string;
  assetType: RecraftAssetType;
  aspectRatio: string;
  output: string;
  composition?: string;
};

const validationAssets: ValidationAsset[] = [
  {
    id: '01-character', assetType: 'character', aspectRatio: '1:1',
    output: 'assets/style-validation/recraft-v1/01-character.png',
    subject: 'A simplified person standing before several choices, neutral pose, no facial detail',
    composition: 'Full body centered with generous clear space around the silhouette.',
  },
  {
    id: '02-steam-engine', assetType: 'object', aspectRatio: '1:1',
    output: 'assets/style-validation/recraft-v1/02-steam-engine.png',
    subject: 'A simple mechanical steam engine, three-quarter side view',
    composition: 'Isolated subject, clear recognizable silhouette, large negative space.',
  },
  {
    id: '03-auction', assetType: 'object', aspectRatio: '1:1',
    output: 'assets/style-validation/recraft-v1/03-auction.png',
    subject: 'An auction paddle beside a single plain coin',
    composition: 'Two clearly separated objects in a balanced isolated composition.',
  },
  {
    id: '04-door-corridor', assetType: 'scene-plate', aspectRatio: '16:9',
    output: 'assets/style-validation/recraft-v1/04-door-corridor.png',
    subject: 'A long corridor with several doors',
    composition: 'Strong one-point perspective, clean composition, broad negative space.',
  },
  {
    id: '05-factory', assetType: 'scene-plate', aspectRatio: '16:9',
    output: 'assets/style-validation/recraft-v1/05-factory.png',
    subject: 'A simplified factory with visible machinery and a flow of energy',
    composition: 'Clear geometric structure and focal hierarchy, sparse background detail.',
  },
  {
    id: '06-choice-icon', assetType: 'icon', aspectRatio: '1:1',
    output: 'assets/style-validation/recraft-v1/06-choice-icon.png',
    subject: 'A simple decision symbol representing branching choices',
    composition: 'Isolated centered icon with high readability at small size.',
  },
];

const timestamp = () => new Date().toISOString();

async function saveGeneratedImage(relativePath: string, bytes: Buffer) {
  if (bytes.length < 24 || bytes.toString('hex', 0, 8) !== '89504e470d0a1a0a') {
    throw new Error('Generated output was not a valid PNG.');
  }
  const absolutePath = path.join(root, relativePath);
  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes, { flag: process.argv.includes('--force') ? 'w' : 'wx' });
  const header = await readFile(absolutePath);
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

async function writeResults(
  assets: Array<Record<string, unknown>>,
  report: unknown,
) {
  const manifest = RecraftAssetManifestSchema.parse({
    schemaVersion: 'recraft-asset-manifest-v1',
    assets,
  });
  const validReport = RecraftStyleValidationReportSchema.parse(report);
  await mkdir(path.dirname(manifestPath), { recursive: true });
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  await writeFile(reportPath, `${JSON.stringify(validReport, null, 2)}\n`, 'utf8');
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

const missing = createPendingStyleReport([
  'Style validation requires a Recraft API key and the selected style configured locally.',
  'No generation was attempted; scores remain unassessed and the style is not locked.',
]);

async function main() {
  let config;
  try {
    config = resolveRecraftConfig();
  } catch (error) {
    await writeResults([], missing);
    console.log('STYLE VALIDATION BLOCKED: configure the required Recraft environment variables locally.');
    console.log(error instanceof Error ? error.message : safeRecraftError(error));
    process.exitCode = 2;
  }

  if (config) {
    const force = process.argv.includes('--force');
    let savedManifest: { assets: Array<Record<string, unknown>> } | undefined;
    try {
      savedManifest = RecraftAssetManifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')));
    } catch {
      // First run or an incomplete prior run without a valid manifest.
    }
    const savedSmoke = savedManifest?.assets.find((asset) => asset.id === 'smoke-steam-engine');
    const smokeExists = await fileExists(path.join(root, smokeOutput));
    const validationOutputExists = await Promise.all(
      validationAssets.map((asset) => fileExists(path.join(root, asset.output))),
    );
    const canReuseSmoke = Boolean(savedSmoke && smokeExists && !force);
    if (!force && (validationOutputExists.some(Boolean) || (smokeExists && !canReuseSmoke))) {
      console.error('STYLE VALIDATION BLOCKED: validation outputs already exist; refusing duplicate paid generation. Use --force to replace them.');
      process.exitCode = 2;
    }

    if (process.exitCode !== 2) {
      const provider = new RecraftProvider(config);
      const manifestAssets: Array<Record<string, unknown>> = canReuseSmoke && savedSmoke ? [savedSmoke] : [];
      const warnings: string[] = [
        'Transparent background generation is not exposed as a documented generation API parameter; compositing requires visual review.',
        'Editorial scores remain unassessed until the generated images are reviewed against the human review sheet.',
      ];
      let apiSmokePassed = canReuseSmoke;
      let completedValidationAssets = 0;
      let generationFailure = false;

    const smokePrompt = {
      assetType: 'object' as const,
      aspectRatio: '1:1',
      subject: 'A simple mechanical steam engine, three-quarter side view',
      composition: 'Clear recognizable silhouette, isolated composition, large negative space.',
    };

      if (!apiSmokePassed) {
        try {
          console.log('Generating one Recraft steam-engine smoke image...');
          const smoke = await provider.generateImage(smokePrompt);
          const smokeDimensions = await saveGeneratedImage(smokeOutput, smoke.bytes);
          manifestAssets.push({
            id: 'smoke-steam-engine', provider: 'recraft', assetType: 'object',
            subject: smokePrompt.subject, prompt: smoke.prompt, promptVersion: 'recraft-style-v1',
            profileVersion: RECRAFT_STYLE_PROFILE.version, filePath: smokeOutput,
            ...smokeDimensions, createdAt: timestamp(),
          });
          apiSmokePassed = true;
          console.log(`Smoke generated: ${smokeOutput}`);
        } catch (error) {
          generationFailure = true;
          warnings.push(`Smoke generation failed safely: ${safeRecraftError(error)}`);
          console.error(`STYLE VALIDATION FAILED: ${safeRecraftError(error)}`);
        }
      } else {
        console.log(`Reusing successful smoke image: ${smokeOutput}`);
      }

    if (apiSmokePassed) {
      for (const asset of validationAssets) {
        try {
          console.log(`Generating validation asset ${asset.id}...`);
          const result = await provider.generateImage({
            subject: asset.subject,
            composition: asset.composition,
            assetType: asset.assetType,
            aspectRatio: asset.aspectRatio,
          });
          const dimensions = await saveGeneratedImage(asset.output, result.bytes);
          manifestAssets.push({
            id: asset.id, provider: 'recraft', assetType: asset.assetType,
            subject: asset.subject, prompt: result.prompt, promptVersion: 'recraft-style-v1',
            profileVersion: RECRAFT_STYLE_PROFILE.version, filePath: asset.output,
            ...dimensions, createdAt: timestamp(),
          });
          completedValidationAssets += 1;
          console.log(`Generated: ${asset.output}`);
        } catch (error) {
          generationFailure = true;
          warnings.push(`Validation generation stopped at ${asset.id}: ${safeRecraftError(error)}`);
          console.error(`STYLE VALIDATION INCOMPLETE: ${safeRecraftError(error)}`);
          break;
    }
  }
    }

    const validationComplete = completedValidationAssets === validationAssets.length;
    const report = {
      ...missing,
      apiSmokePassed,
      assetCount: completedValidationAssets,
      status: generationFailure ? 'blocked' : validationComplete ? 'needs-review' : 'blocked',
      warnings,
      styleLocked: false,
    };
    await writeResults(manifestAssets, report);
    console.log(`Validation assets generated: ${completedValidationAssets}/${validationAssets.length}`);
    console.log(`Manifest: ${manifestPath}`);
    console.log(`Report: ${reportPath}`);
    console.log('STYLE LOCKED: no; human visual review and an >=80 editorial score are required.');
    if (generationFailure || !validationComplete) process.exitCode = 1;
  }
  }
}

void main().catch((error: unknown) => {
  console.error(`STYLE VALIDATION FAILED: ${safeRecraftError(error)}`);
  process.exitCode = 1;
});
