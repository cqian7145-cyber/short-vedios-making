import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Caption, SectionLabel, Type, YearText} from '../components/typography/Type';
import {vibeTheme} from '../themes/vibeTheme';

export const HistoricalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const reveal = (from: number, duration: number = vibeTheme.motion.duration.reveal) => interpolate(frame, [from, from + duration], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const rule = interpolate(frame, [42, 112], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const marker = interpolate(frame, [92, 246], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return <AbsoluteFill style={{color: vibeTheme.colors.text.primary}}>
    <div style={{position:'absolute',left: vibeTheme.safeArea.titleLeft,top: 168,opacity: reveal(6)}}>
      <SectionLabel>Historical note · 01</SectionLabel>
    </div>
    <div style={{position:'absolute',left: 204,top: 273,opacity: reveal(18),textShadow: vibeTheme.glow.soft}}>
      <YearText>1968</YearText>
    </div>
    <div style={{position:'absolute',left: 222,top: 584,opacity: reveal(50)}}>
      <SectionLabel color={vibeTheme.colors.accent.gold}>Germany</SectionLabel>
      <Type variant="title" style={{fontSize: 40,marginTop: 24,maxWidth: 590}}>A mathematician notices<br/>something strange.</Type>
    </div>

    <div style={{position:'absolute',left: 780,top: 421,width: 504,height: 240,opacity: reveal(80, 48)}}>
      <SectionLabel color={vibeTheme.colors.text.muted}>From the notebook</SectionLabel>
      <div style={{position:'relative',marginTop: 28,borderLeft:`${vibeTheme.lineWidths.hairline}px solid ${vibeTheme.colors.line.subtle}`,paddingLeft: 26}}>
        <Type variant="formula" color={vibeTheme.colors.text.secondary} style={{fontSize: 36}}>x² + y² ≠ x + y</Type>
        <Caption style={{marginTop: 17,maxWidth: 390}}>A quiet question begins to alter the whole picture.</Caption>
        <div style={{position:'absolute',left:-4,top:13,width:7,height:7,borderRadius:vibeTheme.radii.pill,backgroundColor:vibeTheme.colors.accent.gold,opacity:.72}}/>
      </div>
    </div>

    <div style={{position:'absolute',left: 218,top: 835,width: 1110,height: 1,backgroundColor:vibeTheme.colors.line.subtle,transformOrigin:'left center',transform:`scaleX(${rule})`}}/>
    {[0,1,2,3,4,5,6,7].map((tick) => <div key={tick} style={{position:'absolute',left: 218 + tick * 158,top: 828,width: vibeTheme.lineWidths.hairline,height: tick === 2 ? 17 : 9,backgroundColor: tick === 2 ? vibeTheme.colors.accent.gold : vibeTheme.colors.text.muted,opacity: rule * (tick === 2 ? marker : .58)}}/>)}
    <div style={{position:'absolute',left: 505,top: 861,opacity: marker}}><Caption color={vibeTheme.colors.accent.mutedGold}>1968 · THE FIRST TRACE</Caption></div>
    <div style={{position:'absolute',right: vibeTheme.safeArea.edgeX,top: 170,writingMode:'vertical-rl',opacity:.3}}><Type variant="numeric" color={vibeTheme.colors.text.muted}>ARCHIVE STUDY / 01</Type></div>
  </AbsoluteFill>;
};
