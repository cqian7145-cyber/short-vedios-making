import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Caption, SectionLabel, Type} from '../components/typography/Type';
import {GlowPath} from '../components/GlowPath';
import {vibeTheme} from '../themes/vibeTheme';

const points = [[610,450],[850,330],[1150,375],[1370,600],[1080,750],[760,700]] as const;
const base = ['M610 450 Q720 380 850 330','M850 330 Q1000 340 1150 375','M1150 375 Q1300 455 1370 600','M1370 600 Q1270 710 1080 750','M1080 750 Q900 760 760 700','M760 700 Q640 600 610 450'];
const added = 'M610 450 Q930 485 1370 600';
const routePoint = (route: number,t: number): [number,number] => {
  const start=points[route],end=points[(route+1)%points.length];
  const controlX=(start[0]+end[0])/2 + (route%2===0?18:-18), controlY=(start[1]+end[1])/2 - 24;
  const u=1-t;
  return [u*u*start[0]+2*u*t*controlX+t*t*end[0],u*u*start[1]+2*u*t*controlY+t*t*end[1]];
};
const addedPoint = (t:number): [number,number] => {
  const u=1-t; return [u*u*points[0][0]+2*u*t*970+t*t*points[3][0],u*u*points[0][1]+2*u*t*500+t*t*points[3][1]];
};

export const SystemSimulation: React.FC = () => {
  const frame=useCurrentFrame();
  const change=interpolate(frame,[128,224],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const load=1+change*.42;
  const addedEdge=interpolate(frame,[118,172],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const pulse=interpolate(frame,[160,228],[0,.52],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const dot=(route:number,index:number,start:number,speed:number,extra=false) => {
    if(frame<start) return null;
    const t=((frame-start)*speed*load/170+index*.22)%1;
    const [cx,cy]=extra?addedPoint(t):routePoint(route,t);
    return <circle key={`${route}-${index}`} cx={cx} cy={cy} r={index%3===0?3:2.2} fill={index%4===0?vibeTheme.colors.text.primary:vibeTheme.colors.accent.gold} opacity={.66} style={{filter:'drop-shadow(0 0 4px rgba(217,182,110,.46))'}}/>;
  };

  return <AbsoluteFill>
    <div style={{position:'absolute',left:vibeTheme.safeArea.titleLeft,top:155}}><SectionLabel>System / Simulation · 02</SectionLabel></div>
    <div style={{position:'absolute',left:222,top:414,width:350}}>
      <SectionLabel color={vibeTheme.colors.text.muted}>Change one variable</SectionLabel>
      <Type variant="year" style={{fontSize:124,marginTop:20,color:vibeTheme.colors.accent.gold}}>+1</Type>
      <Type variant="body" style={{fontFamily:vibeTheme.typography.family.display,fontSize:31,marginTop:12}}>One route enters<br/>the system.</Type>
      <div style={{width:222,height:vibeTheme.lineWidths.hairline,backgroundColor:vibeTheme.colors.line.gold,marginTop:30,transformOrigin:'left',transform:`scaleX(${addedEdge})`}}/>
      <Caption style={{marginTop:19,color:vibeTheme.colors.text.secondary}}>Flow pressure <span style={{color:vibeTheme.colors.accent.gold}}>×{load.toFixed(2)}</span></Caption>
    </div>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,overflow:'visible'}}>
      {base.map((d,i)=><g key={i}>
        <path d={d} fill="none" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.thin} strokeLinecap="round" opacity={.82}/>
        <GlowPath d={d} start={12+i*8} end={58+i*8} color={vibeTheme.colors.accent.gold} width={vibeTheme.lineWidths.regular} opacity={.52}/>
      </g>)}
      <g opacity={addedEdge}><GlowPath d={added} start={118} end={172} color={vibeTheme.colors.accent.gold} width={vibeTheme.lineWidths.emphasis} opacity={.82}/></g>
      {base.map((_,i)=>dot(i,i,65+i*13,48))}
      {Array.from({length:7},(_,i)=>dot(6,i,150+i*6,92,true))}
      <g opacity={pulse}><circle cx="970" cy="500" r="31" fill="none" stroke={vibeTheme.colors.accent.red} strokeWidth={vibeTheme.lineWidths.hairline} opacity=".3"/><circle cx="970" cy="500" r="53" fill="none" stroke={vibeTheme.colors.accent.red} strokeWidth={vibeTheme.lineWidths.hairline} opacity=".16"/></g>
      {points.map((p,i)=><g key={i}><circle cx={p[0]} cy={p[1]} r="13" fill={vibeTheme.colors.background.primary} stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.thin}/><circle cx={p[0]} cy={p[1]} r="3" fill={vibeTheme.colors.text.primary}/><text x={p[0]} y={p[1]+32} fill={vibeTheme.colors.text.muted} fontFamily={vibeTheme.typography.family.technical} fontSize="12" letterSpacing="2" textAnchor="middle">{`0${i+1}`}</text></g>)}
      <path d="M 610 850 L 1370 850" stroke={vibeTheme.colors.line.subtle} strokeWidth={vibeTheme.lineWidths.hairline}/>
      {[0,1,2,3,4,5].map(i=><path key={i} d={`M ${610+i*152} 844 L ${610+i*152} 857`} stroke={vibeTheme.colors.text.muted} strokeWidth={vibeTheme.lineWidths.hairline} opacity=".62"/>)}
    </svg>
    <div style={{position:'absolute',right:250,bottom:152}}><Caption color={vibeTheme.colors.text.muted}>ROUTE DENSITY · {interpolate(frame,[0,300],[.28,.46]).toFixed(2)}</Caption></div>
  </AbsoluteFill>;
};
