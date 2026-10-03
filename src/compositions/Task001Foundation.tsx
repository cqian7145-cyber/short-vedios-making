import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CinematicBackground} from '../components/CinematicBackground';
import {TextReveal} from '../components/TextReveal';
import {NetworkExperiment} from '../scenes/NetworkExperiment';
import {vibeTheme} from '../themes/vibeTheme';

export const Task001Foundation: React.FC = () => {
  const frame=useCurrentFrame();
  const hook=interpolate(frame,[88,112,190,224],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const reveal=interpolate(frame,[384,412,487,516],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const exit=interpolate(frame,[510,532,585,600],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const exitFade=interpolate(frame,[520,555,600],[1,.74,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const camera=interpolate(frame,[0,600],[1,1.018]);
  return <AbsoluteFill style={{backgroundColor:vibeTheme.colors.background,color:vibeTheme.colors.ivory,fontFamily:vibeTheme.fonts.display,overflow:'hidden'}}>
    <AbsoluteFill style={{transform:`scale(${camera})`}}><CinematicBackground/><NetworkExperiment/></AbsoluteFill>
    <AbsoluteFill style={{justifyContent:'center',alignItems:'center',opacity:hook,pointerEvents:'none'}}>
      <TextReveal start={94} duration={42} style={{textAlign:'center',fontFamily:vibeTheme.fonts.display,fontSize:68,fontWeight:400,letterSpacing:'.105em',lineHeight:1.45,color:vibeTheme.colors.ivory,textShadow:vibeTheme.glow.soft}}>
        <div>MORE CAN MAKE</div><div style={{fontSize:78,letterSpacing:'.14em'}}>THINGS <span style={{color:vibeTheme.colors.gold}}>WORSE.</span></div>
      </TextReveal>
    </AbsoluteFill>
    <AbsoluteFill style={{justifyContent:'center',paddingLeft:230,pointerEvents:'none',opacity:reveal}}>
      <TextReveal start={390} duration={38} style={{maxWidth:540}}><div style={{fontFamily:vibeTheme.fonts.body,fontSize:14,letterSpacing:'.34em',color:vibeTheme.colors.mutedGold,marginBottom:25}}>A SYSTEM IN TENSION</div><div style={{fontSize:46,lineHeight:1.3,letterSpacing:'.055em'}}>THE PARADOX<br/><span style={{color:vibeTheme.colors.gold}}>IS THE POINT.</span></div></TextReveal>
    </AbsoluteFill>
    <AbsoluteFill style={{alignItems:'center',justifyContent:'center',opacity:exit,pointerEvents:'none'}}><div style={{fontFamily:vibeTheme.fonts.body,fontSize:16,letterSpacing:'.48em',color:vibeTheme.colors.ivory,opacity:.74}}>VIBE KNOWLEDGE</div><div style={{position:'absolute',top:'53%',width:42,height:1,backgroundColor:vibeTheme.colors.mutedGold,opacity:.55}}/></AbsoluteFill>
    <AbsoluteFill style={{backgroundColor:vibeTheme.colors.background,opacity:1-exitFade,pointerEvents:'none'}}/>
  </AbsoluteFill>;
};
