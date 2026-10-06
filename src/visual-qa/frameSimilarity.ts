import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {PNG} from 'pngjs';

export type FrameFeatures={hash:string;meanLuminance:number;meanSaturation:number;darkPixelRatio:number;coarseHue:number;width:number;height:number};
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));
export async function analyzePng(filePath:string):Promise<FrameFeatures>{
  const bytes=await readFile(filePath);const png=PNG.sync.read(bytes,{skipRescale:true});const {width,height,data}=png;
  if(width<2||height<2)throw new Error(`Image dimensions are too small for QA: ${filePath}`);
  let lumTotal=0,saturationTotal=0,dark=0,count=0;const hues=Array(8).fill(0) as number[];
  const step=Math.max(1,Math.floor(Math.min(width,height)/180));
  for(let y=0;y<height;y+=step)for(let x=0;x<width;x+=step){const i=(y*width+x)*4;const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255;const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;const lum=.2126*r+.7152*g+.0722*b;lumTotal+=lum;saturationTotal=max===0?0:delta/max;if(lum<.18)dark++;let hue=0;if(delta){if(max===r)hue=((g-b)/delta)%6;else if(max===g)hue=(b-r)/delta+2;else hue=(r-g)/delta+4;hue=((hue*60)%360+360)%360;}hues[Math.floor(hue/45)%8]++;count++;}
  const grid:number[]=[];for(let gy=0;gy<8;gy++)for(let gx=0;gx<9;gx++){const x=Math.min(width-1,Math.floor((gx+.5)*width/9)),y=Math.min(height-1,Math.floor((gy+.5)*height/8)),i=(y*width+x)*4;grid.push(.2126*data[i]+.7152*data[i+1]+.0722*data[i+2]);}
  let hash=0n;for(let y=0;y<8;y++)for(let x=0;x<8;x++){hash=(hash<<1n)|(grid[y*9+x]>grid[y*9+x+1]?1n:0n);}const dominantHue=hues.indexOf(Math.max(...hues));
  return{hash:hash.toString(16).padStart(16,'0'),meanLuminance:lumTotal/count,meanSaturation:saturationTotal/count,darkPixelRatio:dark/count,coarseHue:dominantHue,width,height};
}
export function hammingDistance(hashA:string,hashB:string):number{let bits=BigInt(`0x${hashA}`)^BigInt(`0x${hashB}`),count=0;while(bits){count++;bits&=bits-1n;}return count;}
export function hashSimilarity(hashA:string,hashB:string):number{return 1-hammingDistance(hashA,hashB)/64;}
export function fingerprint(bytes:Buffer|string):string{return createHash('sha256').update(bytes).digest('hex');}
export function median(values:number[]):number|null{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b);const mid=Math.floor(sorted.length/2);return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2;}
export function sampleRepresentativeIndices(frameCount:number,sceneCount:number):number[]{if(frameCount<=0||sceneCount<=0)return[];const picks:number[]=[];for(let i=0;i<Math.min(frameCount,sceneCount);i++)picks.push(clamp(Math.floor((i+.5)*frameCount/Math.min(frameCount,sceneCount)),0,frameCount-1));return[...new Set(picks)];}
