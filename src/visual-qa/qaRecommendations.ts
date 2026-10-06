import type {QaRecommendation,QaWarning} from './qaSchema';

export function recommendationsFromWarnings(warnings:QaWarning[],sceneLayouts:Record<string,string>,_sceneAssets:Record<string,string[]>):QaRecommendation[]{
  const out:QaRecommendation[]=[];
  for(const issue of warnings){const ids=issue.sceneIds;
    if(issue.code==='layout-dominance'||issue.code==='layout-run'){const alternatives=['full-field','center-stage','split-focus'].filter((layout)=>!ids.some((id)=>sceneLayouts[id]===layout));out.push({priority:'medium',title:'Vary the repeated composition',action:`Move ${ids.slice(-2).join(' and ')||'one middle scene'} to ${alternatives[0]??'a different layout'} while retaining the same visual identity.`,sceneIds:ids});}
    else if(issue.code==='asset-repetition')out.push({priority:'medium',title:'Keep the motif selective',action:`Retain the repeated subject in the hook or ending and remove it from middle explanation scenes: ${ids.slice(1,-1).join(', ')||ids.join(', ')}.`,sceneIds:ids});
    else if(issue.code==='structural-repetition')out.push({priority:'high',title:'Break the repeated scene pattern',action:`Change the layout, primary archetype, or production strategy in ${ids.slice(1).join(', ')}; keep adjacent scenes related through palette and motif.`,sceneIds:ids});
    else if(issue.code==='signature-not-distinctive')out.push({priority:'high',title:'Make the signature moment read differently',action:`Change the signature scene framing or visual mechanism to differ from its neighbors: ${ids.join(', ')}.`,sceneIds:ids});
    else if(issue.code==='palette-drift')out.push({priority:'medium',title:'Inspect palette outliers',action:`Check exposure, background separation, and saturation in ${ids.join(', ')}; retain intentional signature contrast.`,sceneIds:ids});
    else if(issue.code==='frame-repetition')out.push({priority:'medium',title:'Inspect highly similar representative frames',action:'Review the paired stills and change one composition only if the similarity reflects an unintended template repeat.',sceneIds:ids});
    else if(issue.code==='illustration-dominance')out.push({priority:'high',title:'Restore information-led scene balance',action:`Replace illustration-only sections with procedural diagrams, paths, or measured relationships in ${ids.join(', ')||'the illustration-dominant scenes'}.`,sceneIds:ids});
    else if(issue.code==='text-dominance')out.push({priority:'medium',title:'Reduce text-led scenes',action:`Move a text-dominant beat into an animated relationship in ${ids.join(', ')}.`,sceneIds:ids});
    else if(issue.code==='opening-repeated')out.push({priority:'high',title:'Differentiate this opening from recent episodes',action:'Change the hook composition or subject arrangement while preserving the channel palette.',sceneIds:ids});
    else if(issue.code==='ending-repeated')out.push({priority:'medium',title:'Vary the ending composition',action:'Use a different ending layout or visual subject while preserving channel identity.',sceneIds:ids});
    else if(issue.code==='unreviewed-draft-assets')out.push({priority:'high',title:'Resolve pending asset review before release',action:'Review each pending local illustration or render the safe procedural fallback before creating a release candidate.',sceneIds:ids});
    else if(issue.code==='compositing-matte')out.push({priority:'high',title:'Inspect the illustration matte edge',action:'Open the representative still over the dark background and approve the asset only if no visible rectangular matte competes with the scene.',sceneIds:ids});
  }
  const seen=new Set<string>();return out.filter((item)=>{const key=`${item.title}:${item.sceneIds.join(',')}`;if(seen.has(key))return false;seen.add(key);return true;});
}
