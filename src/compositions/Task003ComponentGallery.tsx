import React from 'react';
import {AbsoluteFill, Sequence, interpolate, useCurrentFrame} from 'remotion';
import {CameraDrift} from '../components/CameraDrift';
import {CinematicBackground} from '../components/CinematicBackground';
import {SectionLabel} from '../components/typography/Type';
import {AtmosphericFade} from '../components/transitions/AtmosphericFade';
import {SpatialCrossfade} from '../components/transitions/SpatialCrossfade';
import {AgentsAndRelationshipsScene, CombinedSystemScene, NetworkPrimitivesScene, NumbersAndDataScene, TimeAndKnowledgeScene} from '../scenes/ComponentGalleryScenes';
import {vibeTheme} from '../themes/vibeTheme';

type GallerySectionProps = {from: number; duration: number; direction: 'left' | 'right'; children: React.ReactNode};

const GallerySection: React.FC<GallerySectionProps> = ({from, duration, direction, children}) => <Sequence from={from} durationInFrames={duration}>
  <SpatialCrossfade enter={[10, 42]} exit={[duration - 42, duration]} direction={direction}>
    <CameraDrift durationFrames={duration} move={direction === 'left' ? 'driftLeft' : 'driftRight'} amount={0.26}>{children}</CameraDrift>
  </SpatialCrossfade>
</Sequence>;

export const Task003ComponentGallery: React.FC = () => {
  const frame = useCurrentFrame();
  const brand = interpolate(frame, [1258, 1290, 1318, 1350], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const closing = interpolate(frame, [1286, 1350], [0, 0.96], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill style={{backgroundColor: vibeTheme.colors.background.primary, color: vibeTheme.colors.text.primary, overflow: 'hidden'}}>
    <CameraDrift durationFrames={1350} move="parallax" amount={0.28}><CinematicBackground durationFrames={1350} /></CameraDrift>
    <GallerySection from={0} duration={270} direction="left"><NetworkPrimitivesScene /></GallerySection>
    <GallerySection from={222} duration={270} direction="right"><NumbersAndDataScene /></GallerySection>
    <GallerySection from={444} duration={276} direction="left"><TimeAndKnowledgeScene /></GallerySection>
    <GallerySection from={690} duration={342} direction="right"><AgentsAndRelationshipsScene /></GallerySection>
    <GallerySection from={990} duration={270} direction="left"><CombinedSystemScene /></GallerySection>

    <AtmosphericFade start={222} duration={48} strength={0.16} />
    <AtmosphericFade start={444} duration={48} strength={0.14} />
    <AtmosphericFade start={690} duration={48} strength={0.14} />
    <AtmosphericFade start={990} duration={48} strength={0.18} />
    <AbsoluteFill style={{zIndex: vibeTheme.zIndex.transition, backgroundColor: vibeTheme.colors.background.primary, opacity: closing, pointerEvents: 'none'}} />
    <AbsoluteFill style={{zIndex: vibeTheme.zIndex.brand, alignItems: 'center', justifyContent: 'center', opacity: brand, pointerEvents: 'none'}}>
      <div style={{width: 48, height: vibeTheme.lineWidths.thin, backgroundColor: vibeTheme.colors.accent.gold, opacity: 0.76, marginBottom: 28}} />
      <SectionLabel color={vibeTheme.colors.text.primary} style={{fontSize: 17, letterSpacing: '.42em'}}>Vibe Knowledge</SectionLabel>
      <SectionLabel color={vibeTheme.colors.text.secondary} style={{fontSize: 10, letterSpacing: '.21em', marginTop: 16}}>Visual Primitives</SectionLabel>
    </AbsoluteFill>
  </AbsoluteFill>;
};
