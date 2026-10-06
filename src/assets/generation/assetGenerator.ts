import {access, copyFile, mkdir, readFile, rename, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {AssetPlanSchema, AssetRegistrySchema} from '../assetStrategySchema';
import {isProceduralOnlyConcept} from '../assetCapabilities';
import type {RecraftAssetBrief, AssetPlan} from '../assetStrategySchema';
import {resolveRecraftConfig, getRecraftConfigurationState} from '../../recraft/config';
import {RecraftProvider} from '../../recraft/RecraftProvider';
import {RecraftProviderError, safeRecraftError} from '../../recraft/errors';
import {buildAssetPrompt, toRecraftRequest} from './assetPromptBuilder';
import {makeAssetCacheKey, cacheAssetPath} from './assetCache';
import {inspectPng, type PngInfo} from './assetValidator';
import {findReusableAsset} from './assetRegistry';
import {AssetGenerationManifestSchema, AssetGenerationReportSchema, AssetGenerationStateSchema, type AssetGenerationManifest, type AssetGenerationReport, type AssetGenerationState, type GeneratedAsset} from './assetGenerationSchema';

const MAX_NETWORK_RETRIES = 2;
const safeSegment = (value: string) => {
  if (!/^[a-z0-9][a-z0-9-]{1,79}$/.test(value)) throw new Error('Episode or asset id contains unsafe path characters.');
  return value;
};
async function exists(file: string): Promise<boolean> { try { await access(file); return true; } catch { return false; } }
async function isReadablePng(file: string): Promise<boolean> { try { inspectPng(await readFile(file)); return true; } catch { return false; } }
async function atomicJson(file: string, value: unknown) { await mkdir(path.dirname(file),{recursive:true}); const temp = `${file}.tmp`; await writeFile(temp,`${JSON.stringify(value,null,2)}\n`,'utf8'); await rename(temp,file); }
async function writeRegistry(file: string, assets: GeneratedAsset[]) { await atomicJson(file,AssetRegistrySchema.parse({schemaVersion:'asset-registry-v1',assets:assets.map((asset)=>({id:asset.id,reuseKey:asset.reuseKey,assetKind:asset.assetKind,subject:asset.subject,profileVersion:asset.profileVersion,provider:'recraft',path:asset.filePath,createdAt:asset.createdAt,episodeIds:[asset.episodeId]}))})); }
function scenesByReuseKey(plan: AssetPlan) { const result = new Map<string,string[]>(); for (const scene of plan.scenePlans) for (const asset of scene.recraftAssets) { const ids = result.get(asset.reuseKey) ?? []; if (!ids.includes(scene.sceneId)) ids.push(scene.sceneId); result.set(asset.reuseKey,ids); } return result; }
function uniquePlanAssets(plan: AssetPlan): RecraftAssetBrief[] { return plan.uniqueRecraftAssets.filter((asset) => asset.source === 'new'); }
function assertPlanSafety(plan: AssetPlan) {
  const unique = uniquePlanAssets(plan);
  if (unique.length > plan.budget.hardMax) throw new Error(`Budget violation: ${unique.length} requested; ${plan.budget.hardMax} maximum. Recraft calls made: 0.`);
  const ids = new Set<string>(); const keys = new Set<string>();
  for (const asset of unique) {
    if (isProceduralOnlyConcept(`${asset.assetKind} ${asset.subject} ${asset.composition ?? ''}`)) throw new Error(`Rejected procedural-only asset request (${asset.assetId}). Recraft calls made: 0.`);
    if (ids.has(asset.assetId) || keys.has(asset.reuseKey)) throw new Error('AssetPlan contains duplicate new asset identifiers or reuse keys. Recraft calls made: 0.');
    ids.add(asset.assetId); keys.add(asset.reuseKey);
  }
}
function pngDimensions(bytes: Buffer) { return inspectPng(bytes); }
function withFilePath(asset: GeneratedAsset, filePath: string): GeneratedAsset { return {...asset,filePath}; }
function htmlEscape(value: string) { return value.replace(/[&<>"']/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]!)); }

export type AssetGeneratorOptions = {
  root?: string; dryRun?: boolean; force?: boolean; retryFailed?: boolean; allowHighRisk?: boolean;
  provider?: Pick<RecraftProvider,'generateImage'>; wait?: (ms:number)=>Promise<void>;
};
export type AssetGenerationResult = {dryRun: boolean; requested: number; cached: number; generate: number; highRisk: number; recraftCalls: number; report?: AssetGenerationReport};

export async function generateAssets(planInput: unknown, options: AssetGeneratorOptions = {}): Promise<AssetGenerationResult> {
  const root = path.resolve(options.root ?? process.cwd());
  const parsed = AssetPlanSchema.safeParse(planInput); if (!parsed.success) throw new Error(`AssetPlan is invalid: ${parsed.error.issues.map((issue)=>`${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
  const plan = parsed.data; safeSegment(plan.episodeId); assertPlanSafety(plan);
  const requested = uniquePlanAssets(plan); const hardMax = plan.budget.hardMax;
  const outputDir = path.join(root,'assets','generated',plan.episodeId); const manifestPath = path.join(outputDir,'asset-manifest.json'); const registryPath=path.join(outputDir,'asset-registry.json');
  const statePath = path.join(root,'generated',plan.episodeId,'asset-generation-state.json'); const reportPath = path.join(root,'generated',plan.episodeId,'asset-generation-report.json');
  let priorManifest: AssetGenerationManifest = {schemaVersion:'asset-generation-manifest-v1',episodeId:plan.episodeId,assets:[]};
  if (await exists(manifestPath)) { const existing = AssetGenerationManifestSchema.safeParse(JSON.parse(await readFile(manifestPath,'utf8')) as unknown); if (!existing.success) throw new Error('Existing asset manifest is invalid; refusing to overwrite.'); priorManifest = existing.data; }
  let priorState: AssetGenerationState | undefined;
  if (await exists(statePath)) { const existing = AssetGenerationStateSchema.safeParse(JSON.parse(await readFile(statePath,'utf8')) as unknown); if (existing.success) priorState = existing.data; }
  const stateById = new Map(priorState?.assets.map((asset)=>[asset.assetId,asset]) ?? []);
  if (options.retryFailed && ![...stateById.values()].some((item)=>item.status==='failed')) throw new Error('--retry-failed requested but there are no failed assets in generation state.');
  const sceneMap = scenesByReuseKey(plan); const status = getRecraftConfigurationState(undefined,path.join(root,'.recraft-style.local.json'));
  const prepared = await Promise.all(requested.map(async (asset) => {
    const prompt = await buildAssetPrompt(asset,root); const cacheKey = makeAssetCacheKey({reuseKey:asset.reuseKey,profileVersion:plan.profileVersion,prompt,assetKind:asset.assetKind,composition:asset.composition,modelFamily:'recraftv3'});
    return {asset,prompt,cacheKey,cachePath:cacheAssetPath(root,asset.reuseKey,cacheKey),outputPath:path.join(outputDir,`${safeSegment(asset.assetId)}.png`)};
  }));
  if (prepared.length > hardMax) throw new Error(`Budget violation: ${prepared.length} requested; ${hardMax} maximum. Recraft calls made: 0.`);
  if (options.dryRun) {
    let cached = 0; let highRisk = 0;
    for (const item of prepared) {
      if (item.asset.semanticRisk === 'high' && !options.allowHighRisk) { highRisk += 1; continue; }
      const existsReady = priorManifest.assets.some((a)=>a.reuseKey===item.asset.reuseKey && a.cacheKey===item.cacheKey && a.status==='needs-human-review') && await isReadablePng(item.outputPath);
      if (!options.force && (existsReady || await isReadablePng(item.cachePath))) cached += 1;
    }
    return {dryRun:true,requested:prepared.length,cached,generate:prepared.length-cached-highRisk,highRisk,recraftCalls:0};
  }
  const toGenerate = prepared.filter(({asset})=>asset.semanticRisk !== 'high' || options.allowHighRisk);
  if (toGenerate.length > hardMax) throw new Error(`Budget violation: ${toGenerate.length} requested; ${hardMax} maximum. Recraft calls made: 0.`);
  const generationCandidates = toGenerate.filter((item)=>!options.retryFailed || stateById.get(item.asset.assetId)?.status === 'failed');
  if (options.retryFailed && generationCandidates.length === 0) throw new Error('No failed planned assets match this AssetPlan; no assets were generated.');
  let provider = options.provider;
  if (generationCandidates.length && !provider) provider = new RecraftProvider(resolveRecraftConfig(undefined,path.join(root,'.recraft-style.local.json')));
  const nextAssets = new Map<string,GeneratedAsset>(priorManifest.assets.map((asset)=>[asset.reuseKey,asset]));
  const statuses = new Map<string,AssetGenerationState['assets'][number]>();
  for (const {asset,cacheKey} of prepared) statuses.set(asset.assetId,{assetId:asset.assetId,cacheKey,status:asset.semanticRisk==='high'&&!options.allowHighRisk?'skipped':'pending'});
  const results: AssetGenerationReport['assets'] = []; const warnings: string[] = []; let calls = 0; let generated = 0; let cacheHits = 0; let reuseHits = 0; let failures = 0; let highRiskSkipped = 0;
  for (const item of prepared) {
    const {asset,prompt,cacheKey,cachePath,outputPath} = item; const relOut = path.relative(root,outputPath).split(path.sep).join('/');
    if (asset.semanticRisk === 'high' && !options.allowHighRisk) { highRiskSkipped++; warnings.push(`${asset.assetId}: high-risk asset skipped; procedural or curated-asset fallback required.`); results.push({assetId:asset.assetId,reuseKey:asset.reuseKey,status:'skipped-high-risk',cacheKey}); continue; }
    if (asset.semanticRisk === 'high') warnings.push(`${asset.assetId}: explicitly permitted high-risk generation still requires human semantic review.`);
    if (options.retryFailed && stateById.get(asset.assetId)?.status !== 'failed') { const old = nextAssets.get(asset.reuseKey); if (old) { results.push({assetId:asset.assetId,reuseKey:asset.reuseKey,status:'reused',filePath:old.filePath,cacheKey:old.cacheKey}); reuseHits++; } continue; }
    const existing = nextAssets.get(asset.reuseKey);
    if (!options.force && existing?.cacheKey===cacheKey && await exists(outputPath)) {
      try { const info = inspectPng(await readFile(outputPath)); nextAssets.set(asset.reuseKey,{...existing,...info,filePath:relOut}); cacheHits++; warnings.push(`${asset.assetId}: semantic correctness and embedded-text risk require human review.`); results.push({assetId:asset.assetId,reuseKey:asset.reuseKey,status:'cache-hit',filePath:relOut,cacheKey}); statuses.set(asset.assetId,{assetId:asset.assetId,cacheKey,status:'ready'}); continue; }
      catch { warnings.push(`${asset.assetId}: cached episode PNG failed validation and will be regenerated.`); }
    }
    if (!options.force && await exists(cachePath)) {
      let bytes:Buffer; let info:PngInfo|undefined;
      try { bytes=await readFile(cachePath); info=inspectPng(bytes); }
      catch { warnings.push(`${asset.assetId}: shared cached PNG failed validation and will be regenerated.`); await unlink(cachePath).catch(()=>undefined); bytes=Buffer.alloc(0); }
      if (bytes.length && info) { await mkdir(outputDir,{recursive:true}); await copyFile(cachePath,outputPath);
      const record: GeneratedAsset = {id:asset.assetId,reuseKey:asset.reuseKey,assetKind:asset.assetKind,subject:asset.subject,episodeId:plan.episodeId,sceneIds:sceneMap.get(asset.reuseKey)??[],provider:'recraft',profileVersion:'recraft-v1',promptVersion:'recraft-style-v1',prompt,cacheKey,filePath:relOut,...info,backgroundMode:'generated',createdAt:new Date().toISOString(),semanticRisk:asset.semanticRisk,status:'needs-human-review',warnings:['Semantic correctness and embedded-text risk require human review.']};
      nextAssets.set(asset.reuseKey,record); cacheHits++; warnings.push(`${asset.assetId}: semantic correctness and embedded-text risk require human review.`); results.push({assetId:asset.assetId,reuseKey:asset.reuseKey,status:'cache-hit',filePath:relOut,cacheKey}); statuses.set(asset.assetId,{assetId:asset.assetId,cacheKey,status:'ready'}); continue;
      }
    }
    if (!options.force && (asset.source==='registry' || asset.source==='episode')) {
      const reused = await findReusableAsset(root,asset.reuseKey);
      if (!reused) { failures++; const message = `Reuse requested but asset not found: ${asset.reuseKey}.`; warnings.push(message); results.push({assetId:asset.assetId,reuseKey:asset.reuseKey,status:'failed',cacheKey,error:message}); statuses.set(asset.assetId,{assetId:asset.assetId,cacheKey,status:'failed',error:message}); continue; }
      nextAssets.set(asset.reuseKey,reused); reuseHits++; results.push({assetId:asset.assetId,reuseKey:asset.reuseKey,status:'reused',filePath:reused.filePath,cacheKey:reused.cacheKey}); statuses.set(asset.assetId,{assetId:asset.assetId,cacheKey:reused.cacheKey,status:'ready'}); continue;
    }
    statuses.set(asset.assetId,{assetId:asset.assetId,cacheKey,status:'generating'});
    await atomicJson(statePath,AssetGenerationStateSchema.parse({schemaVersion:'asset-generation-state-v1',episodeId:plan.episodeId,assets:[...statuses.values()]}));
    try {
      let image: Awaited<ReturnType<NonNullable<typeof provider>['generateImage']>> | undefined; let networkRetries=0;
      for (;;) {
        try { calls++; image=await provider!.generateImage(toRecraftRequest(asset,prompt)); break; }
        catch(error) { const retryable = error instanceof RecraftProviderError && (error.code==='NETWORK_ERROR' || error.statusCode===429 || (error.statusCode!==undefined && error.statusCode>=500)); if (!retryable || networkRetries>=MAX_NETWORK_RETRIES) throw error; networkRetries++; await (options.wait ?? ((ms)=>new Promise((resolve)=>setTimeout(resolve,ms))))(networkRetries*250); }
      }
      const info = pngDimensions(image!.bytes); if (!image!.bytes.length) throw new Error('Generated PNG file is empty.');
      await mkdir(outputDir,{recursive:true}); const temp=`${outputPath}.tmp`; await writeFile(temp,image!.bytes); await rename(temp,outputPath);
      await mkdir(path.dirname(cachePath),{recursive:true});
      if (!(options.force && await exists(cachePath))) { const cacheTemp=`${cachePath}.tmp`; await writeFile(cacheTemp,image!.bytes); await rename(cacheTemp,cachePath); }
      const record: GeneratedAsset = {id:asset.assetId,reuseKey:asset.reuseKey,assetKind:asset.assetKind,subject:asset.subject,episodeId:plan.episodeId,sceneIds:sceneMap.get(asset.reuseKey)??[],provider:'recraft',profileVersion:'recraft-v1',promptVersion:'recraft-style-v1',prompt,cacheKey,filePath:relOut,...info,backgroundMode:'generated',createdAt:new Date().toISOString(),semanticRisk:asset.semanticRisk,status:'needs-human-review',warnings:['Semantic correctness and embedded-text risk require human review.']};
      nextAssets.set(asset.reuseKey,record); generated++; warnings.push(`${asset.assetId}: semantic correctness and embedded-text risk require human review.`); results.push({assetId:asset.assetId,reuseKey:asset.reuseKey,status:'generated',filePath:relOut,cacheKey}); statuses.set(asset.assetId,{assetId:asset.assetId,cacheKey,status:'ready'});
    } catch(error) { failures++; const message=safeRecraftError(error); warnings.push(`${asset.assetId}: ${message}`); results.push({assetId:asset.assetId,reuseKey:asset.reuseKey,status:'failed',cacheKey,error:message}); statuses.set(asset.assetId,{assetId:asset.assetId,cacheKey,status:'failed',error:message}); }
    await atomicJson(statePath,AssetGenerationStateSchema.parse({schemaVersion:'asset-generation-state-v1',episodeId:plan.episodeId,assets:[...statuses.values()]}));
    await atomicJson(manifestPath,AssetGenerationManifestSchema.parse({schemaVersion:'asset-generation-manifest-v1',episodeId:plan.episodeId,assets:[...nextAssets.values()]}));
    await writeRegistry(registryPath,[...nextAssets.values()]);
  }
  // Resolve explicitly planned registry reuse targets, without generating replacements.
  const registryKeys = new Map<string,RecraftAssetBrief>();
  for (const scene of plan.scenePlans) for (const item of scene.recraftAssets) if (item.source==='registry') registryKeys.set(item.reuseKey,item);
  for (const [reuseKey,asset] of registryKeys) {
    if ([...nextAssets.values()].some((entry)=>entry.reuseKey===reuseKey)) continue;
    const reused=await findReusableAsset(root,reuseKey);
    if (!reused) { failures++; const message=`Reuse requested but asset not found: ${reuseKey}.`; warnings.push(message); results.push({assetId:asset.assetId,reuseKey,status:'failed',cacheKey:'0'.repeat(64),error:message}); }
    else { nextAssets.set(reuseKey,reused); reuseHits++; results.push({assetId:asset.assetId,reuseKey,status:'reused',filePath:reused.filePath,cacheKey:reused.cacheKey}); }
  }
  for (const item of nextAssets.values()) for (const warning of item.warnings) warnings.push(`${item.id}: ${warning}`);
  const fallbackRequired=highRiskSkipped>0 || failures>0; const report=AssetGenerationReportSchema.parse({episodeId:plan.episodeId,profileVersion:'recraft-v1',styleConfigured:status.styleConfigured,requestedAssetCount:prepared.length,newGenerationCount:generated,cacheHitCount:cacheHits,reuseCount:reuseHits,successCount:generated+cacheHits+reuseHits,failureCount:failures,skippedHighRiskCount:highRiskSkipped,recraftCallCount:calls,budget:{requested:prepared.length,hardMax},fallbackRequired,status:failures?'fail':(highRiskSkipped||warnings.length?'warning':'pass'),createdAt:new Date().toISOString(),assets:results,warnings:[...new Set(warnings)]});
  await mkdir(outputDir,{recursive:true}); await atomicJson(manifestPath,AssetGenerationManifestSchema.parse({schemaVersion:'asset-generation-manifest-v1',episodeId:plan.episodeId,assets:[...nextAssets.values()]})); await writeRegistry(registryPath,[...nextAssets.values()]);
  await atomicJson(statePath,AssetGenerationStateSchema.parse({schemaVersion:'asset-generation-state-v1',episodeId:plan.episodeId,assets:[...statuses.values()]})); await atomicJson(reportPath,report);
  const cards=report.assets.filter((item)=>item.filePath).map((item)=>{const meta=nextAssets.get(item.reuseKey); if (!meta) return ''; const src=path.relative(outputDir,path.resolve(root,meta.filePath)).split(path.sep).join('/'); const notes=meta.warnings.map((warning)=>`<p class="warning">${htmlEscape(warning)}</p>`).join(''); return `<article><h2>${htmlEscape(item.assetId)}</h2><img src="${htmlEscape(src)}"><p>${htmlEscape(meta.assetKind)} · ${htmlEscape(meta.semanticRisk)} · ${htmlEscape(meta.status)}</p><p>${htmlEscape(meta.subject)}</p>${notes}</article>`;}).join('\n');
  await writeFile(path.join(outputDir,'preview.html'),`<!doctype html><meta charset="utf-8"><title>Asset preview — ${htmlEscape(plan.episodeId)}</title><style>body{background:#10151c;color:#eee;font:16px system-ui;margin:2rem}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem}article{padding:1rem;border:1px solid #343a42}img{width:100%;max-height:360px;object-fit:contain;background:#07090d}p{line-height:1.5}.warning{color:#f2ca78}</style><h1>${htmlEscape(plan.episodeId)} assets · human review required</h1><main>${cards}</main>`,'utf8');
  return {dryRun:false,requested:prepared.length,cached:cacheHits,generate:generated,highRisk:highRiskSkipped,recraftCalls:calls,report};
}
