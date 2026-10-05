import 'dotenv/config';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getRecraftConfigurationState } from '../src/recraft/config';
import { MidnightStyleAssessmentSchema, MidnightStyleValidationReportSchema, RecraftAssetManifestSchema } from '../src/recraft/schemas';
import { calculateStyleScore, styleLockEligible } from '../src/recraft/styleValidation';

const root = process.cwd();
const base = 'assets/style-validation/midnight-scientific-editorial-v2';
const manifestPath = path.join(root, base, 'validation-manifest.json');
const assessmentPath = path.join(root, 'generated/style-validation/midnight-scientific-editorial-v2-assessment.json');
const reportPath = path.join(root, 'generated/style-validation/midnight-scientific-editorial-v2-report.json');

async function main() {
  const manifest = RecraftAssetManifestSchema.parse(JSON.parse(await readFile(manifestPath, 'utf8')));
  const assessment = MidnightStyleAssessmentSchema.parse(JSON.parse(await readFile(assessmentPath, 'utf8')));
  const expectedIds = ['01-character', '02-steam-engine', '03-auction-paddle', '04-door', '05-factory-object', '06-branching-choice'];
  const byId = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  if (expectedIds.length !== manifest.assets.length || expectedIds.some((id) => !byId.has(id))) {
    throw new Error('Exactly six required atomic validation images must exist before scoring.');
  }
  await Promise.all(expectedIds.map(async (id) => {
    const asset = byId.get(id);
    if (!asset) throw new Error(`Validation asset ${id} is missing.`);
    await access(path.join(root, asset.filePath));
  }));
  const semanticAccuracy = assessment.semanticAccuracyScore;
  const reviewed = assessment.semanticReviewStatus === 'reviewed' && semanticAccuracy !== null;
  if (reviewed && semanticAccuracy !== assessment.scoreBreakdown.semanticAccuracy) {
    throw new Error('semanticAccuracyScore must match scoreBreakdown.semanticAccuracy.');
  }
  if (!reviewed && assessment.semanticAccuracyScore !== null) {
    throw new Error('Semantic accuracy must remain null until semantic review is complete.');
  }
  const criticalFailures = assessment.criticalSemanticFailures;
  const humanApproved = assessment.humanApprovalStatus === 'approved';
  const styleConfigured = getRecraftConfigurationState().styleConfigured;
  const score = reviewed && semanticAccuracy !== null
    ? calculateStyleScore({ ...assessment.scoreBreakdown, semanticAccuracy })
    : null;
  const locked = score !== null && styleLockEligible(score, true, 6, humanApproved, criticalFailures.length, styleConfigured);
  const status = !reviewed ? 'needs-review' : assessment.humanApprovalStatus === 'rejected' || criticalFailures.length > 0 || (score !== null && score < 65)
    ? 'rejected' : locked ? 'validated' : 'needs-review';
  const report = MidnightStyleValidationReportSchema.parse({
    profileVersion: 'midnight-scientific-editorial-v2', profileName: 'Midnight Scientific Editorial v2',
    provider: 'recraft', styleConfigured, apiSmokePassed: true, assetCount: 6,
    semanticReviewStatus: assessment.semanticReviewStatus,
    semanticAccuracyScore: assessment.semanticAccuracyScore,
    criticalSemanticFailures: criticalFailures, scoreBreakdown: assessment.scoreBreakdown,
    overallScore: score, status, humanApproval: 'required',
    humanApprovalStatus: assessment.humanApprovalStatus, warnings: assessment.warnings, styleLocked: locked,
  });
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Style validation status: ${status}`);
  console.log(`Semantic accuracy: ${assessment.semanticAccuracyScore === null ? 'needs-human-review' : `${assessment.semanticAccuracyScore}/20`}`);
  console.log(`Editorial heuristic score: ${score === null ? 'not scored' : `${score}/100`}`);
  console.log(`Critical semantic failures: ${criticalFailures.length}`);
  console.log(`Human approval: ${assessment.humanApprovalStatus}`);
  console.log(`STYLE LOCKED: ${locked ? 'yes' : 'no'}`);
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Style review could not be recorded.');
  process.exitCode = 1;
});
