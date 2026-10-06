import {createHash} from 'node:crypto';
import {mkdir, open, readFile, rename, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {FACTORY_V2_STAGES, FactoryV2StateSchema, type FactoryV2StageName, type FactoryV2State} from './factoryV2Schema';

export const sha256 = (value: string | Buffer): string => createHash('sha256').update(value).digest('hex');
export const stableFingerprint = (value: unknown): string => sha256(JSON.stringify(value));
export async function fingerprintFile(file: string): Promise<string> { return sha256(await readFile(file)); }
export async function writeJsonAtomic(file: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(file), {recursive:true});
  const temp = `${file}.${process.pid}.${Date.now()}.tmp`;
  const handle = await open(temp, 'w');
  try { await handle.writeFile(`${JSON.stringify(value,null,2)}\n`, 'utf8'); await handle.sync(); }
  finally { await handle.close(); }
  await rename(temp, file);
}
export async function readJson<T>(file:string, parse:(value:unknown)=>T):Promise<T>{return parse(JSON.parse(await readFile(file,'utf8')) as unknown);}
export function initialV2State(input:{episodeId:string;topic:string;durationSeconds:number;mode:'draft'|'release';now?:Date}):FactoryV2State {
  const {episodeId,topic,durationSeconds,mode}=input;
  return FactoryV2StateSchema.parse({schemaVersion:'factory-v2-state-v1',episodeId,topic,durationSeconds,mode,status:'pending',stages:Object.fromEntries(FACTORY_V2_STAGES.map((stage)=>[stage,{status:'pending'}])),updatedAt:(input.now??new Date()).toISOString()});
}
export function invalidateFrom(state:FactoryV2State, stage:FactoryV2StageName):FactoryV2State {
  const index=FACTORY_V2_STAGES.indexOf(stage);
  for(const name of FACTORY_V2_STAGES.slice(index)) state.stages[name]={status:'pending'};
  return state;
}
export function staleFromFingerprint(state:FactoryV2State, fingerprints:Partial<Record<FactoryV2StageName,string>>):FactoryV2StageName|undefined {
  return FACTORY_V2_STAGES.find((name)=>state.stages[name].status==='completed'&&fingerprints[name]!==undefined&&state.stages[name].fingerprint!==fingerprints[name]);
}

export async function acquireFactoryLock(file:string, options:{staleAfterMs?:number;now?:number}={}):Promise<()=>Promise<void>> {
  await mkdir(path.dirname(file),{recursive:true});
  const now=options.now??Date.now();
  try {
    const handle=await open(file,'wx');
    await handle.writeFile(JSON.stringify({pid:process.pid,createdAt:new Date(now).toISOString()})); await handle.sync(); await handle.close();
    return async()=>{await rm(file,{force:true});};
  } catch(error) {
    if((error as NodeJS.ErrnoException).code!=='EEXIST') throw error;
    let stale=false;
    try {
      const raw=JSON.parse(await readFile(file,'utf8')) as {pid?:number;createdAt?:string};
      const age=now-new Date(raw.createdAt??0).getTime();
      let alive=true;
      try { process.kill(Number(raw.pid),0); } catch { alive=false; }
      stale=!alive || age>(options.staleAfterMs??6*60*60*1000);
    } catch { const info=await stat(file).catch(()=>undefined); stale=!!info&&now-info.mtimeMs>(options.staleAfterMs??6*60*60*1000); }
    if(!stale) throw new Error(`Factory V2 is already running for this episode (lock: ${file}).`);
    await rm(file,{force:true});
    return acquireFactoryLock(file,{...options,now});
  }
}
