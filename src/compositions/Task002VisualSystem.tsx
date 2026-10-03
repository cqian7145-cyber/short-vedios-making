import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {CameraDrift} from '../components/CameraDrift';
import {CinematicBackground} from '../components/CinematicBackground';
import {AtmosphericFade} from '../components/transitions/AtmosphericFade';
import {FocusTransition} from '../components/transitions/FocusTransition';
import {SpatialCrossfade} from '../components/transitions/SpatialCrossfade';
import {SectionLabel} from '../components/typography/Type';
import {HistoricalScene} from '../scenes/HistoricalScene';
import {ScientificField} from '../scenes/ScientificField';
import {SystemSimulation} from '../scenes/SystemSimulation';
import {vibeTheme} from '../themes/vibeTheme';

export const Task002VisualSystem: React.FC = () => {
  const frame = useCurrentFrame();
  const brand = interpolate(frame, [808, 842, 875, 900], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const closing = interpolate(frame, [804, 900], [0, 0.94], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  return <AbsoluteFill style={{backgroundColor: vibeTheme.colors.background.primary, color: vibeTheme.colors.text.primary, overflow: 'hidden'}}>
    <CameraDrift durationFrames={900} move="parallax" amount={0.32}>
      <CinematicBackground durationFrames={900} />
    </CameraDrift>

    <Sequence from={0} durationInFrames={330}>
      <SpatialCrossfade enter={[18, 54]} exit={[282, 330]} direction="left">
        <CameraDrift durationFrames={330} move="driftLeft" amount={0.34}><HistoricalScene /></CameraDrift>
      </SpatialCrossfade>
    </Sequence>
    <Sequence from={282} durationInFrames={342}>
      <SpatialCrossfade enter={[10, 52]} exit={[294, 342]} direction="right">
        <CameraDrift durationFrames={342} move="slowPushIn" amount={0.54}><SystemSimulation /></CameraDrift>
      </SpatialCrossfade>
    </Sequence>
    <Sequence from={582} durationInFrames={318}>
      <SpatialCrossfade enter={[8, 54]} exit={[228, 278]} direction="left">
        <CameraDrift durationFrames={318} move="slowPullBack" amount={0.48}><ScientificField /></CameraDrift>
      </SpatialCrossfade>
    </Sequence>

    <AtmosphericFade start={282} duration={vibeTheme.motion.duration.transition} strength={0.22} />
    <AtmosphericFade start={582} duration={vibeTheme.motion.duration.transition} strength={0.2} />
    <FocusTransition start={582} duration={vibeTheme.motion.duration.transition + 10} x={54} y={50} strength={0.12} />

    <AbsoluteFill style={{zIndex: vibeTheme.zIndex.transition, backgroundColor: vibeTheme.colors.background.primary, opacity: closing, pointerEvents: 'none'}} />
    <AbsoluteFill style={{zIndex: vibeTheme.zIndex.brand, alignItems: 'center', justifyContent: 'center', opacity: brand, pointerEvents: 'none'}}>
      <div style={{width: 48, height: vibeTheme.lineWidths.thin, backgroundColor: vibeTheme.colors.accent.gold, opacity: 0.76, marginBottom: 28}} />
      <SectionLabel color={vibeTheme.colors.text.primary} style={{fontSize: 17, letterSpacing: '.42em'}}>Vibe Knowledge</SectionLabel>
      <SectionLabel color={vibeTheme.colors.text.secondary} style={{fontSize: 10, letterSpacing: '.21em', marginTop: 16}}>Counterintuitive ideas, visualized.</SectionLabel>
    </AbsoluteFill>
  </AbsoluteFill>;
};
