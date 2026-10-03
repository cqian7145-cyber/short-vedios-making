import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {GlowPath} from '../components/GlowPath';
import {vibeTheme} from '../themes/vibeTheme';

const pts = [[315,105],[715,150],[355,480],[760,450]] as const;
const edges = [[0,1],[0,2],[1,3],[2,3]] as const;
const pointOnRoute = (route: number, t: number): [number,number] => {
  if (route < 4) { const [a,b] = edges[route]; return [pts[a][0]+(pts[b][0]-pts[a][0])*t, pts[a][1]+(pts[b][1]-pts[a][1])*t]; }
  const u=1-t, a=pts[0], b=pts[3];
  return [u*u*a[0]+2*u*t*525+t*t*b[0],u*u*a[1]+2*u*t*285+t*t*b[1]];
};

export const NetworkExperiment: React.FC = () => {
  const frame=useCurrentFrame();
  const fade=interpolate(frame,[198,222,492,520],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const complexity=interpolate(frame,[282,354],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const scale=interpolate(frame,[210,480],[1,1.07]);
  const basePaths=['M 315 105 L 715 150','M 315 105 L 355 480','M 715 150 L 760 450','M 355 480 L 760 450'];
  const allPaths=[...basePaths,'M 315 105 Q 525 285 760 450'];
  const traffic=(route:number,index:number,start:number,speed:number) => {
    if(frame<start) return null;
    const t=((frame-start)*speed/170+index*.23)%1;
    const [cx,cy]=pointOnRoute(route,t);
    return <circle key={`${route}-${index}`} cx={cx} cy={cy} r={index%3===0?3:2} fill={index%4===0?vibeTheme.colors.text.primary:vibeTheme.colors.accent.gold} opacity={.72} style={{filter:'drop-shadow(0 0 5px rgba(217,182,110,.65))'}}/>;
  };
  return <AbsoluteFill style={{opacity:fade,transform:`scale(${scale}) translateX(195px)`,transformOrigin:'58% 48%'}}>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{overflow:'visible'}}>
      <g transform="translate(475 285)">
        {basePaths.map((d,i)=><g key={i}><GlowPath d={d} start={204+i*9} end={250+i*9} color={vibeTheme.colors.accent.mutedGold} width={vibeTheme.lineWidths.thin} opacity={.8}/></g>)}
        <g opacity={complexity}><GlowPath d={allPaths[4]} start={282} end={336} color={vibeTheme.colors.accent.gold} width={vibeTheme.lineWidths.emphasis} opacity={.78}/></g>
        {edges.map((_,i)=>traffic(i,i,252+i*11,52))}
        {Array.from({length:7},(_,i)=>traffic(4,i,306+i*4,106))}
        <g opacity={complexity}><circle cx="525" cy="285" r="34" fill="none" stroke={vibeTheme.colors.accent.red} strokeWidth={vibeTheme.lineWidths.hairline} opacity=".3"/><circle cx="525" cy="285" r="52" fill="none" stroke={vibeTheme.colors.accent.red} strokeWidth={vibeTheme.lineWidths.hairline} opacity=".16"/><circle cx="525" cy="285" r="4" fill={vibeTheme.colors.accent.red}/></g>
        {pts.map((p,i)=><g key={i}><circle cx={p[0]} cy={p[1]} r="15" fill="rgba(217,182,110,.04)" stroke="rgba(217,182,110,.55)" strokeWidth={vibeTheme.lineWidths.thin}/><circle cx={p[0]} cy={p[1]} r="3.3" fill={vibeTheme.colors.text.primary} opacity=".88"/><text x={p[0]} y={p[1]+36} fill={vibeTheme.colors.text.muted} fontSize={vibeTheme.typography.size.numeric} letterSpacing="3" textAnchor="middle" fontFamily={vibeTheme.typography.family.body}>{String.fromCharCode(65+i)}</text></g>)}
      </g>
    </svg>
  </AbsoluteFill>;
};
