import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Caption, SectionLabel, Type} from '../components/typography/Type';
import {vibeTheme} from '../themes/vibeTheme';

const wavePath=(frame:number,phaseOffset:number,amplitude:number,frequency:number):string => {
  const left=340,right=1580,center=548,steps=76;
  const points=Array.from({length:steps+1},(_,i)=>{
    const x=left+(right-left)*i/steps;
    const envelope=.34+Math.sin((x-left)/(right-left)*Math.PI)*.66;
    const phase=x*.0125-frame*.018+phaseOffset;
    const y=center+Math.sin(phase*frequency)*amplitude*envelope;
    return `${i===0?'M':'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return points.join(' ');
};

export const ScientificField: React.FC = () => {
  const frame=useCurrentFrame();
  const reveal=interpolate(frame,[18,66],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const amplitude=interpolate(frame,[42,250],[86,108],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const secondaryOpacity=interpolate(frame,[32,92],[0,.34],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const a=wavePath(frame,0,amplitude*.62,1);
  const b=wavePath(frame,Math.PI,amplitude*.62,1);
  const sum=wavePath(frame,0,amplitude*.92,2);

  return <AbsoluteFill style={{opacity:reveal}}>
    <div style={{position:'absolute',left:vibeTheme.safeArea.titleLeft,top:155}}><SectionLabel>Scientific / Field Study · 03</SectionLabel></div>
    <div style={{position:'absolute',left:222,top:242,maxWidth:710}}>
      <Type variant="title" style={{fontSize:43}}>When waves meet,<br/>the pattern changes.</Type>
    </div>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0,overflow:'visible'}}>
      {[0,1,2,3,4,5].map(i=><ellipse key={i} cx="960" cy="548" rx={220+i*90} ry={52+i*22} fill="none" stroke={vibeTheme.colors.line.subtle} strokeWidth={vibeTheme.lineWidths.hairline} opacity=".45"/>)}
      <path d={a} fill="none" stroke={vibeTheme.colors.accent.cyan} strokeWidth={vibeTheme.lineWidths.thin} opacity={secondaryOpacity}/>
      <path d={b} fill="none" stroke={vibeTheme.colors.accent.red} strokeWidth={vibeTheme.lineWidths.thin} opacity={secondaryOpacity}/>
      <path d={sum} fill="none" stroke={vibeTheme.colors.accent.gold} strokeWidth={vibeTheme.lineWidths.regular} opacity=".86" style={{filter:'drop-shadow(0 0 9px rgba(217,182,110,.18))'}}/>
      <path d="M 340 730 L 1580 730" fill="none" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.hairline} opacity=".7"/>
      {[0,1,2,3,4,5,6,7,8].map(i=><path key={i} d={`M ${340+i*155} 723 L ${340+i*155} 737`} stroke={vibeTheme.colors.text.muted} strokeWidth={vibeTheme.lineWidths.hairline}/>)}
    </svg>
    <div style={{position:'absolute',left:222,bottom:166,display:'flex',alignItems:'baseline',gap:26}}>
      <Type variant="formula" style={{fontSize:48,color:vibeTheme.colors.text.primary}}>ψ = ψ₁ + ψ₂</Type>
      <Caption color={vibeTheme.colors.text.secondary}>INTERFERENCE · AMPLITUDE</Caption>
    </div>
    <div style={{position:'absolute',right:vibeTheme.safeArea.edgeX,bottom:169,textAlign:'right'}}>
      <SectionLabel color={vibeTheme.colors.accent.mutedGold}>FIELD / 03</SectionLabel>
      <Type variant="numeric" color={vibeTheme.colors.text.muted} style={{marginTop:12}}>φ {((frame/300)*Math.PI).toFixed(2)} rad</Type>
    </div>
  </AbsoluteFill>;
};
