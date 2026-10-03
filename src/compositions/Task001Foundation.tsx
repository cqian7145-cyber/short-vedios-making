import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CameraDrift} from '../components/CameraDrift';
import {CinematicBackground} from '../components/CinematicBackground';
import {TextReveal} from '../components/TextReveal';
import {Type} from '../components/typography/Type';
import {NetworkExperiment} from '../scenes/NetworkExperiment';
import {vibeTheme} from '../themes/vibeTheme';

export const Task001Foundation: React.FC = () => {
  const frame = useCurrentFrame();
  const hook = interpolate(frame, [88,112,190,224], [0,1,1,0], {extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const reveal = interpolate(frame, [384,412,487,516], [0,1,1,0], {extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const exit = interpolate(frame, [510,532,585,600], [0,1,1,0], {extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const exitFade = interpolate(frame, [520,555,600], [1,.74,0], {extrapolateLeft:'clamp',extrapolateRight:'clamp'});

  return <AbsoluteFill style={{backgroundColor:vibeTheme.colors.background.primary, color:vibeTheme.colors.text.primary, overflow:'hidden'}}>
    <CameraDrift durationFrames={600} move="slowPushIn"><CinematicBackground/><NetworkExperiment/></CameraDrift>
    <AbsoluteFill style={{justifyContent:'center',alignItems:'center',opacity:hook,pointerEvents:'none'}}>
      <TextReveal start={94} duration={vibeTheme.motion.duration.reveal} style={{textAlign:'center',textShadow:vibeTheme.glow.soft}}>
        <Type variant="title" style={{fontSize:68,letterSpacing:'.105em',lineHeight:1.45}}>MORE CAN MAKE</Type>
        <Type variant="hero" style={{fontSize:78,letterSpacing:'.14em'}}>THINGS <span style={{color:vibeTheme.colors.accent.gold}}>WORSE.</span></Type>
      </TextReveal>
    </AbsoluteFill>
    <AbsoluteFill style={{justifyContent:'center',paddingLeft:vibeTheme.safeArea.titleLeft,pointerEvents:'none',opacity:reveal}}>
      <TextReveal start={390} duration={38} style={{maxWidth:540}}>
        <Type variant="sectionLabel" color={vibeTheme.colors.accent.mutedGold} style={{marginBottom:25}}>A SYSTEM IN TENSION</Type>
        <Type variant="title" style={{fontSize:46}}>THE PARADOX<br/><span style={{color:vibeTheme.colors.accent.gold}}>IS THE POINT.</span></Type>
      </TextReveal>
    </AbsoluteFill>
    <AbsoluteFill style={{alignItems:'center',justifyContent:'center',opacity:exit,pointerEvents:'none',zIndex:vibeTheme.zIndex.brand}}>
      <Type variant="sectionLabel" color={vibeTheme.colors.text.secondary} style={{letterSpacing:'.48em'}}>VIBE KNOWLEDGE</Type>
      <div style={{position:'absolute',top:'53%',width:42,height:vibeTheme.lineWidths.hairline,backgroundColor:vibeTheme.colors.accent.mutedGold,opacity:.55}}/>
    </AbsoluteFill>
    <AbsoluteFill style={{backgroundColor:vibeTheme.colors.background.primary,opacity:1-exitFade,pointerEvents:'none',zIndex:vibeTheme.zIndex.transition}}/>
  </AbsoluteFill>;
};
