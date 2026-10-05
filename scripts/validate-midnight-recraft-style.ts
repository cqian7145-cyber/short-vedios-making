import 'dotenv/config';
import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { createAndPersistRecraftStyleFromReferences } from '../src/recraft/createStyle';
import {
  getRecraftConfigurationState,
  LOCAL_RECRAFT_STYLE_STATE_PATH,
  resolveRecraftApiKey,
  resolveRecraftStyleId,
} from '../src/recraft/config';
import { safeRecraftError } from '../src/recraft/errors';
import { MidnightStyleValidationReportSchema, RecraftAssetManifestSchema } from '../src/recraft/schemas';
import { RECRAFT_STYLE_PROFILE } from '../src/visual/recraftStyleProfile';
import { RecraftProvider } from '../src/recraft/RecraftProvider';
import { RecraftAssetType } from '../src/recraft/types';

const execFileAsync = promisify(execFile);
const root = process.cwd();
const profileDir = path.join(root, 'assets/style-validation/midnight-scientific-editorial-v2');
const referencesDir = path.join(profileDir, 'references');
const manifestPath = path.join(profileDir, 'validation-manifest.json');
const reportPath = path.join(root, 'generated/style-validation/midnight-scientific-editorial-v2-report.json');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

type Case = {
  id: string; subject: string; assetType: RecraftAssetType; reference: string;
  composition: string; physicalStructure?: string; viewpoint?: string;
  visualRelationship?: string; avoidConcepts?: string[];
};
const cases: Case[] = [
  { id: '01-character', assetType: 'character', reference: '01-person', subject: 'One standing adult person.', composition: 'Neutral standing pose, full figure centered and isolated, arms relaxed.' },
  { id: '02-steam-engine', assetType: 'object', reference: '02-steam-engine', subject: 'One early steam locomotive.', physicalStructure: 'Recognizable cylindrical boiler, smokestack, cab, and two large driving wheels.', viewpoint: 'Three-quarter side view.', composition: 'One complete isolated machine, fully inside frame.' },
  { id: '03-auction-paddle', assetType: 'object', reference: '05-gear', subject: 'A single auction bidder paddle: a bidding card held by a bidder to place a bid at an auction.', physicalStructure: 'A flat rectangular or rounded-rectangle bidding card attached to one short straight handle.', viewpoint: 'Front-facing.', composition: 'One isolated object; no number and no typography.', avoidConcepts: ['tennis racket', 'ping-pong paddle', 'magnifying glass', 'balance scale'] },
  { id: '04-door', assetType: 'object', reference: '03-door', subject: 'One freestanding architectural door.', physicalStructure: 'A single door slab inside one visible door frame with one handle.', viewpoint: 'Straight-on view.', composition: 'One isolated door, no hallway, room, or additional doors.' },
  { id: '05-factory-object', assetType: 'object', reference: '04-car', subject: 'One simplified factory building exterior.', physicalStructure: 'A single industrial building with one visible smokestack and a few simple windows.', viewpoint: 'Three-quarter view.', composition: 'One isolated building object, no landscape, workers, or interior scene.' },
  { id: '06-branching-choice', assetType: 'icon', reference: '06-geometric-symbol', subject: 'An abstract decision-branching symbol.', visualRelationship: 'One straight input line enters from the left and splits cleanly into exactly three straight geometric paths.', composition: 'Pure diagrammatic geometry, centered, isolated, and readable at small size; no text or labels.', avoidConcepts: ['tree', 'leaves', 'botanical branch', 'plant', 'trunk', 'organic branches'] },
];

const promptVersion = 'recraft-semantic-v3';
const timestamp = () => new Date().toISOString();
const imagePath = (id: string) => path.join(profileDir, `${id}.png`);
const referencePngPath = (name: string) => path.join(referencesDir, `${name}.png`);

async function rasterizeReferences() {
  await mkdir(referencesDir, { recursive: true });
  for (const name of ['01-person', '02-steam-engine', '03-door', '04-car', '05-gear', '06-geometric-symbol']) {
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
    provider: 'recraft', styleConfigured: getRecraftConfigurationState().styleConfigured,
    apiSmokePassed: generatedCount > 0, assetCount: generatedCount,
    semanticReviewStatus: 'needs-human-review', semanticAccuracyScore: null, criticalSemanticFailures: [],
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
  let apiKey: string;
  try {
    apiKey = resolveRecraftApiKey();
  } catch {
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
  let styleResolution = resolveRecraftStyleId();
  try {
    await rasterizeReferences();
    if (!styleResolution) {
      console.log('Creating one Recraft custom style from Reference Set V2...');
      const styleId = await createAndPersistRecraftStyleFromReferences(apiKey, [
        '01-person', '02-steam-engine', '03-door', '04-car', '05-gear', '06-geometric-symbol',
      ].map(referencePngPath), LOCAL_RECRAFT_STYLE_STATE_PATH);
      styleResolution = { styleId, source: 'local-state' };
      console.log('New Recraft Style saved to local ignored state. You may optionally copy it into RECRAFT_STYLE_ID in .env.');
    }

    const provider = new RecraftProvider({ apiKey, styleId: styleResolution.styleId, styleIdSource: styleResolution.source });
    for (const item of cases) {
      console.log(`Generating atomic validation asset ${item.id}...`);
      const result = await provider.generateImage({
        subject: item.subject,
        composition: item.composition,
        physicalStructure: item.physicalStructure,
        viewpoint: item.viewpoint,
        visualRelationship: item.visualRelationship,
        avoidConcepts: item.avoidConcepts,
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
    console.log('STYLE LOCKED: no; semantic review and human approval are still required.');
  } catch (error) {
    await writeBlockedReport(`Generation stopped after ${generated}/6 assets: ${safeRecraftError(error)}`, generated);
    console.error(`STYLE VALIDATION FAILED: ${safeRecraftError(error)}`);
    process.exitCode = 1;
  }
}

void main();
