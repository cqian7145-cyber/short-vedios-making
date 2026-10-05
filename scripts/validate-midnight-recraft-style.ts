import 'dotenv/config';
import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { createRecraftStyleFromReferences } from '../src/recraft/createStyle';
import { safeRecraftError } from '../src/recraft/errors';
import { MidnightStyleValidationReportSchema, RecraftAssetManifestSchema } from '../src/recraft/schemas';
import { RECRAFT_STYLE_PROFILE } from '../src/visual/recraftStyleProfile';
import { RecraftProvider } from '../src/recraft/RecraftProvider';
import { RecraftAssetType } from '../src/recraft/types';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const profileDir = path.join(root, 'assets/style-validation/midnight-scientific-editorial-v1');
const referencesDir = path.join(profileDir, 'references');
const manifestPath = path.join(profileDir, 'validation-manifest.json');
const reportPath = path.join(root, 'generated/style-validation/midnight-scientific-editorial-v1-report.json');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

type Case = { id: string; subject: string; composition: string; assetType: RecraftAssetType; reference: string };
const cases: Case[] = [
  { id: '01-character', assetType: 'character', reference: '01-person', subject: 'One standing adult person, neutral pose, simplified full-body silhouette.', composition: 'Single centered figure, arms relaxed, generous space around the body.' },
  { id: '02-steam-engine', assetType: 'object', reference: '02-steam-engine', subject: 'One recognizable early steam locomotive, three-quarter side view, with boiler, smokestack, and two large wheels.', composition: 'Single isolated machine, fully inside frame, generous space around the silhouette.' },
  { id: '03-auction-paddle', assetType: 'object', reference: '05-auction-object', subject: 'One classic auction paddle: a small plain rectangular bidding card attached to a short handle.', composition: 'Single isolated auction paddle shown clearly; no coin, no scale, no other objects.' },
  { id: '04-door', assetType: 'object', reference: '03-door', subject: 'One freestanding simple architectural door with visible frame and handle.', composition: 'Single isolated door viewed straight on, no hallway, no room, no additional doors.' },
  { id: '05-car', assetType: 'object', reference: '04-car', subject: 'One simple recognizable mid-century automobile, side three-quarter view.', composition: 'Single isolated car, complete silhouette, no road, no scenery, no people.' },
  { id: '06-branching-symbol', assetType: 'icon', reference: '06-branching-symbol', subject: 'A simple branching-choice symbol: one starting node connected to exactly two endpoint nodes.', composition: 'Three simple circular nodes and two clean branches, isolated centered icon; no leaves, trunk, tree, arrows, text, or extra branches.' },
];

const promptVersion = 'recraft-style-v2';
const timestamp = () => new Date().toISOString();
const imagePath = (id: string) => path.join(profileDir, `${id}.png`);
const referencePngPath = (name: string) => path.join(referencesDir, `${name}.png`);

async function rasterizeReferences() {
  await mkdir(referencesDir, { recursive: true });
  for (const name of ['01-person', '02-steam-engine', '03-door', '04-car', '05-auction-object', '06-branching-symbol']) {
    const source = path.join(referencesDir, `${name}.svg`);
    const output = referencePngPath(name);
    try {
      await access(output);
    } catch {
      const chromeProfile = await mkdtemp(path.join(os.tmpdir(), 'recraft-style-raster-'));
      await execFileAsync(chromePath, [
        '--headless', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
        '--force-device-scale-factor=1', '--window-size=1024,1024', `--user-data-dir=${chromeProfile}`, `--screenshot=${output}`,
        `file:///${source.replace(/\\/g, '/')}`,
      ], { windowsHide: true });
      let available = false;
      for (let attempt = 0; attempt < 30 && !available; attempt += 1) {
        try {
          await access(output);
          available = true;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
      if (!available) {
        await rm(chromeProfile, { recursive: true, force: true });
        throw new Error('Chrome did not rasterize a Recraft reference image.');
      }
      try {
        await access(output);
      } finally {
        await rm(chromeProfile, { recursive: true, force: true });
      }
    }
  }
}

async function pngDimensions(filePath: string) {
  const png = await readFile(filePath);
  if (png.length < 24 || png.toString('hex', 0, 8) !== '89504e470d0a1a0a') throw new Error('Recraft returned an invalid PNG image.');
  return { width: png.readUInt32BE(16), height: png.readUInt32BE(20) };
}

async function writeBlockedReport(message: string, generatedCount = 0) {
  const report = MidnightStyleValidationReportSchema.parse({
    profileVersion: RECRAFT_STYLE_PROFILE.version,
    profileName: RECRAFT_STYLE_PROFILE.name,
    provider: 'recraft', styleConfigured: Boolean(process.env.RECRAFT_STYLE_ID?.trim()),
    apiSmokePassed: generatedCount > 0, assetCount: generatedCount,
    semanticAccuracyScore: null, criticalSemanticFailures: [],
    scoreBreakdown: {
      styleConsistency: null, semanticAccuracy: null, objectClarity: null,
      characterConsistency: null, iconReadability: null, darkBackgroundFit: null,
      remotionCompatibility: null,
    },
    overallScore: null, status: generatedCount === 6 ? 'needs-review' : 'blocked', humanApproval: 'required',
    humanApprovalStatus: 'pending', warnings: [message], styleLocked: false,
  });
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

async function main() {
  const apiKey = process.env.RECRAFT_API_KEY?.trim();
  if (!apiKey) {
    await writeBlockedReport('Missing RECRAFT_API_KEY; no provider request was made.');
    console.error('STYLE VALIDATION BLOCKED: configure RECRAFT_API_KEY locally.');
    process.exitCode = 2;
    return;
  }

  const force = process.argv.includes('--force');
  const outputPaths = cases.map((item) => imagePath(item.id));
  if (!force) {
    for (const output of [...outputPaths, manifestPath]) {
      try {
        await access(output);
        throw new Error('Validation output already exists; refusing duplicate paid generation. Use --force to replace the six outputs.');
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) throw error;
      }
    }
  }

  let generated = 0;
  const manifestAssets: Array<Record<string, unknown>> = [];
  let styleId = process.env.RECRAFT_STYLE_ID?.trim();
  try {
    await rasterizeReferences();
    if (!styleId) {
      console.log('Creating a new Recraft custom style from the six original reference assets...');
      styleId = await createRecraftStyleFromReferences(apiKey, [
        '01-person', '02-steam-engine', '03-door', '04-car', '05-auction-object', '06-branching-symbol',
      ].map(referencePngPath));
      console.log('Custom style created; identifier kept in memory and omitted from output.');
    }

    const provider = new RecraftProvider({ apiKey, styleId });
    for (const item of cases) {
      console.log(`Generating atomic validation asset ${item.id}...`);
      const result = await provider.generateImage({
        subject: item.subject,
        composition: `${item.composition} Quiet neutral background, clean silhouette, negative space. NO EMBEDDED TEXT, numbers, or logos.`,
        assetType: item.assetType,
        aspectRatio: '1:1',
      });
      await writeFile(imagePath(item.id), result.bytes, { flag: force ? 'w' : 'wx' });
      const dimensions = await pngDimensions(imagePath(item.id));
      manifestAssets.push({
        id: item.id, provider: 'recraft', assetType: item.assetType, subject: item.subject,
        prompt: result.prompt, promptVersion, profileVersion: RECRAFT_STYLE_PROFILE.version,
        filePath: path.relative(root, imagePath(item.id)).replace(/\\/g, '/'),
        ...dimensions, createdAt: timestamp(),
      });
      generated += 1;
      const currentManifest = RecraftAssetManifestSchema.parse({ schemaVersion: 'recraft-asset-manifest-v1', assets: manifestAssets });
      await writeFile(manifestPath, `${JSON.stringify(currentManifest, null, 2)}\n`, 'utf8');
    }
    const manifest = RecraftAssetManifestSchema.parse({ schemaVersion: 'recraft-asset-manifest-v1', assets: manifestAssets });
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await writeBlockedReport('All six images were generated. Editorial scoring and required human approval are pending visual review.', generated);
    console.log(`Validation images generated: ${generated}/6`);
    console.log(`Manifest: ${path.relative(root, manifestPath)}`);
    console.log(`Report: ${path.relative(root, reportPath)}`);
    console.log('STYLE LOCKED: no; human review and a score of at least 80 with no critical semantic failures are required.');
  } catch (error) {
    await writeBlockedReport(`Generation stopped after ${generated}/6 assets: ${safeRecraftError(error)}`, generated);
    console.error(`STYLE VALIDATION FAILED: ${safeRecraftError(error)}`);
    process.exitCode = 1;
  }
}

void main();
