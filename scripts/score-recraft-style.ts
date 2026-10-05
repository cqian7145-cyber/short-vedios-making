import { access, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  RecraftAssetManifestSchema,
  RecraftStyleAssessmentSchema,
  RecraftStyleValidationReportSchema,
} from '../src/recraft/schemas';
import { calculateLegacyStyleScore, styleLockEligible } from '../src/recraft/styleValidation';

const root = process.cwd();
const manifestPath = path.join(root, 'assets/style-validation/recraft-v1/validation-manifest.json');
const assessmentPath = path.join(root, 'generated/style-validation/recraft-v1-assessment.json');
const reportPath = path.join(root, 'generated/style-validation/recraft-v1-report.json');
const expectedIds = [
  '01-character', '02-steam-engine', '03-auction',
  '04-door-corridor', '05-factory', '06-choice-icon',
];

async function main() {
  const manifest = RecraftAssetManifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')));
  const assessment = RecraftStyleAssessmentSchema.parse(JSON.parse(await readFile(assessmentPath, 'utf8')));
  const byId = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  const required = ['smoke-steam-engine', ...expectedIds];
  if (required.some((id) => !byId.has(id))) {
    throw new Error('A successful smoke and all six validation assets are required before scoring.');
  }
  await Promise.all(required.map(async (id) => {
    const entry = byId.get(id);
    if (!entry) throw new Error(`Validation asset ${id} is missing from the manifest.`);
    await access(path.join(root, entry.filePath));
  }));

  const score = calculateLegacyStyleScore(assessment.scoreBreakdown);
  const approved = assessment.humanApprovalStatus === 'approved';
  const styleLocked = styleLockEligible(score, true, 6, approved);
  const status = assessment.humanApprovalStatus === 'rejected' || score < 65
    ? 'rejected'
    : score >= 80 && approved ? 'validated' : 'needs-review';
  const ratio = (value: number, maximum: number) => Math.round((value / maximum) * 100);
  const report = RecraftStyleValidationReportSchema.parse({
    profileVersion: 'recraft-v1',
    profileName: 'Selected Editorial Scientific Style',
    provider: 'recraft',
    apiSmokePassed: true,
    assetCount: 6,
    characterConsistency: ratio(assessment.scoreBreakdown.characterConsistency, 10),
    objectConsistency: ratio(assessment.scoreBreakdown.objectClarity, 15),
    sceneConsistency: ratio(assessment.scoreBreakdown.sceneCompatibility, 10),
    iconConsistency: ratio(assessment.scoreBreakdown.iconReadability, 10),
    darkBackgroundCompatibility: ratio(assessment.scoreBreakdown.darkBackgroundFit, 15),
    remotionCompatibility: ratio(assessment.scoreBreakdown.remotionCompatibility, 15),
    embeddedTextRisk: assessment.embeddedTextRisk,
    scoreBreakdown: assessment.scoreBreakdown,
    overallScore: score,
    status,
    humanApproval: 'required',
    humanApprovalStatus: assessment.humanApprovalStatus,
    warnings: assessment.warnings,
    styleLocked,
  });

  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Style validation status: ${status}`);
  console.log(`Editorial heuristic score: ${score}/100`);
  console.log(`Human approval: ${assessment.humanApprovalStatus}`);
  console.log(`STYLE LOCKED: ${styleLocked ? 'yes' : 'no'}`);
  console.log(`Report: ${reportPath}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Style review could not be recorded.');
  process.exitCode = 1;
});
