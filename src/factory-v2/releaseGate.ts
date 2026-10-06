export type UsedAssetDecision='approved'|'pending'|'rejected'|'missing'|'procedural';
export type ReleaseGateInput={researchVerified:boolean;episodeValid:boolean;assetPlanValid:boolean;usedAssets:UsedAssetDecision[];qaStale:boolean;qaResult:'pass'|'warning'|'fail';humanApproved:boolean;qaWarningCodes?:string[];acknowledgedWarningCodes?:string[];overrideQaFail?:boolean;overrideReason?:string};
export type ReleaseGateResult={allowed:boolean;reasons:string[];warnings:string[]};
export function enforceFactoryV2RecraftLimit(newAssets:number,maximum=3):void{
  if(!Number.isInteger(newAssets)||newAssets<0)throw new Error('Estimated new Recraft asset count must be a non-negative integer.');
  if(!Number.isInteger(maximum)||maximum<0||maximum>3)throw new Error('Factory V2 Recraft maximum must be an integer from 0 to 3.');
  if(newAssets>maximum)throw new Error(`Recraft budget stopped before provider calls: ${newAssets} new assets required; Factory V2 limit is ${maximum}.`);
}
export function evaluateReleaseGate(input:ReleaseGateInput):ReleaseGateResult{
  const reasons:string[]=[],warnings:string[]=[];
  if(!input.researchVerified)reasons.push('Research Fact Pack is not publication-ready.');
  if(!input.episodeValid)reasons.push('Episode validation did not pass.');
  if(!input.assetPlanValid)reasons.push('AssetPlan validation did not pass.');
  if(input.usedAssets.some((asset)=>asset==='pending'))reasons.push('A pending asset is used by the release render.');
  if(input.usedAssets.some((asset)=>asset==='rejected'))reasons.push('A rejected asset is used by the release render.');
  if(input.usedAssets.some((asset)=>asset==='missing'))reasons.push('A required production asset is missing.');
  if(input.qaStale)reasons.push('Visual QA is stale for the release inputs.');
  if(!input.humanApproved)reasons.push('Final human approval is missing.');
  if(input.qaResult==='fail'){
    if(!(input.overrideQaFail&&input.overrideReason?.trim()&&input.humanApproved))reasons.push('Visual QA failed; release requires approved human review plus an explicit override reason.');
    else warnings.push(`Visual QA fail was explicitly overridden: ${input.overrideReason.trim()}`);
  }
  if(input.qaResult==='warning'){
    const acknowledged=new Set(input.acknowledgedWarningCodes??[]);
    const unacknowledged=(input.qaWarningCodes??[]).filter((code)=>!acknowledged.has(code));
    if(unacknowledged.length)reasons.push(`QA warning acknowledgement is stale or incomplete: ${unacknowledged.join(', ')}.`);
  }
  return{allowed:reasons.length===0,reasons,warnings};
}
