import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Arrow, Callout, Counter, FlowParticles, Formula, MiniChart, Node, ProbabilityBar, Relationship, Timeline, VehicleToken} from '../components';
import {AgentToken} from '../components/entities/AgentToken';
import {SectionLabel, Type} from '../components/typography/Type';
import {vibeTheme} from '../themes/vibeTheme';

const GalleryTitle: React.FC<{children: string; index: string}> = ({children, index}) => <div style={{position: 'absolute', left: vibeTheme.safeArea.titleLeft, top: 142, display: 'flex', alignItems: 'baseline', gap: 18}}>
  <SectionLabel color={vibeTheme.colors.accent.mutedGold}>{children}</SectionLabel>
  <SectionLabel color={vibeTheme.colors.text.muted}>{index}</SectionLabel>
</div>;

export const NetworkPrimitivesScene: React.FC = () => {
  const frame = useCurrentFrame();
  const crowd = interpolate(frame, [112, 205], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const a = 'M 520 470 Q 690 330 850 480';
  const b = 'M 850 480 Q 1010 625 1190 450';
  const extra = 'M 520 470 Q 860 700 1190 450';
  return <AbsoluteFill>
    <GalleryTitle index="01">NETWORK</GalleryTitle>
    <div style={{position: 'absolute', left: 220, top: 395, width: 320}}>
      <Type variant="title" style={{fontSize: 37}}>A path changes<br/>the whole field.</Type>
      <SectionLabel color={vibeTheme.colors.text.muted} style={{marginTop: 22}}>RELATION · FLOW · PRESSURE</SectionLabel>
    </div>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      <path d={a} fill="none" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.hairline} />
      <path d={b} fill="none" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.hairline} />
      <Arrow path={a} label="ROUTE A" labelX={682} labelY={394} startFrame={8} duration={54} color={vibeTheme.colors.accent.mutedGold} />
      <Arrow path={b} label="ROUTE B" labelX={1022} labelY={590} startFrame={30} duration={58} color={vibeTheme.colors.accent.cyan} />
      <g opacity={crowd}><Arrow path={extra} label="+1 CONNECTION" labelX={864} labelY={694} startFrame={112} duration={58} color={vibeTheme.colors.accent.gold} width={vibeTheme.lineWidths.regular} /></g>
      <FlowParticles path={a} count={5} speed={0.8} size={2.3} startFrame={58} seed="network-a" />
      <FlowParticles path={b} count={5} speed={0.72} size={2.2} startFrame={78} seed="network-b" color={vibeTheme.colors.accent.cyan} />
      <FlowParticles path={extra} count={8} speed={1.15} size={2.4} startFrame={154} seed="network-extra" opacity={crowd * 0.82} />
      <Node x={520} y={470} label="A" size={16} active appearFrame={0} pulse />
      <Node x={850} y={480} label="B" size={16} appearFrame={26} />
      <Node x={1190} y={450} label="C" size={16} active appearFrame={48} />
      <Callout x={1450} y={452} anchorX={1240} anchorY={450} label="EDGE DENSITY" detail={`${(1.2 + crowd * 0.8).toFixed(1)}×`} startFrame={100} />
    </svg>
  </AbsoluteFill>;
};

const chartData = [
  {x: 0, y: 65}, {x: 1, y: 67}, {x: 2, y: 66}, {x: 3, y: 70}, {x: 4, y: 72}, {x: 5, y: 77}, {x: 6, y: 80},
];

export const NumbersAndDataScene: React.FC = () => <AbsoluteFill>
  <GalleryTitle index="02">DATA</GalleryTitle>
  <div style={{position: 'absolute', left: 250, top: 360}}>
    <SectionLabel color={vibeTheme.colors.text.muted}>TRAVEL TIME</SectionLabel>
    <Counter from={65} to={80} suffix=" min" startFrame={35} duration={142} highlightOnChange style={{fontSize: 104, marginTop: 16}} />
    <SectionLabel color={vibeTheme.colors.accent.mutedGold} style={{marginTop: 6}}>MEASURED AFTER THE CHANGE</SectionLabel>
  </div>
  <div style={{position: 'absolute', left: 900, top: 332}}>
    <MiniChart data={chartData} xRange={[0, 6]} yRange={[60, 85]} highlightIndex={6} startFrame={30} duration={132} width={690} height={300} xLabel="ADDED LINKS" yLabel="MINUTES" />
  </div>
  <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
    <g transform="translate(430 755)"><ProbabilityBar from={30} to={70} startFrame={55} duration={126} width={680} label="CONGESTION PROBABILITY" /></g>
    <path d="M 1280 745 H 1550" stroke={vibeTheme.colors.line.subtle} strokeWidth={vibeTheme.lineWidths.hairline} />
    <text x="1280" y="778" fill={vibeTheme.colors.text.muted} fontSize="12" fontFamily={vibeTheme.typography.family.technical} letterSpacing="1.6">A NUMBER IS A TRACE OF A SYSTEM</text>
  </svg>
</AbsoluteFill>;

export const TimeAndKnowledgeScene: React.FC = () => <AbsoluteFill>
  <GalleryTitle index="03">TIME</GalleryTitle>
  <div style={{position: 'absolute', left: 280, top: 442}}>
    <Timeline events={[
      {year: '1968', label: 'QUESTION'},
      {year: '1971', label: 'MODEL'},
      {year: '1990', label: 'EVIDENCE'},
      {year: '2012', label: 'REVISIT'},
      {year: '2024', label: 'NEW LENS'},
    ]} startFrame={8} duration={150} width={1080} height={180} />
  </div>
  <div style={{position: 'absolute', left: 710, top: 265, maxWidth: 420}}>
    <Type variant="title" style={{fontSize: 39}}>Ideas move through time.</Type>
  </div>
  <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
    <g transform="translate(310 790)"><Formula expression="P(A | B) = P(B | A) P(A) / P(B)" highlightTerm="P(A)" annotation="A RELATIONSHIP, NOT A LABEL" startFrame={52} duration={46} fontSize={29} /></g>
    <Callout x={1535} y={760} anchorX={1500} anchorY={700} label="CONDITION" detail="what is already known" startFrame={86} />
    <path d="M 280 720 H 1360" stroke={vibeTheme.colors.line.subtle} strokeWidth={vibeTheme.lineWidths.hairline} />
  </svg>
</AbsoluteFill>;

export const AgentsAndRelationshipsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const vehicleX = interpolate(frame, [38, 192], [750, 1210], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return <AbsoluteFill>
    <GalleryTitle index="04">AGENTS</GalleryTitle>
    <div style={{position: 'absolute', left: 700, top: 252}}><Type variant="title" style={{fontSize: 39}}>Choices connect people.</Type></div>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      <Relationship from={{x: 590, y: 520}} to={{x: 1330, y: 520}} state="positive" active label="SHARED VALUE" startFrame={16} duration={76} />
      <Relationship from={{x: 590, y: 585}} to={{x: 1330, y: 585}} state="neutral" label="INFORMATION" startFrame={64} duration={82} />
      <AgentToken x={590} y={510} label="AGENT A" state="active" appearFrame={0} />
      <AgentToken x={1330} y={510} label="AGENT B" state="selected" appearFrame={22} />
      <path d="M 650 730 H 1275" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.thin} />
      {[0, 1, 2, 3, 4, 5].map((i) => <path key={i} d={`M ${675 + i * 110} 722 V 738`} stroke={vibeTheme.colors.text.muted} strokeWidth={vibeTheme.lineWidths.hairline} />)}
      <VehicleToken x={vehicleX} y={730} label="OFFER" startFrame={24} duration={24} />
      <Callout x={1440} y={560} anchorX={1330} anchorY={520} label="CHOICE" detail="accept / decline" startFrame={90} />
    </svg>
  </AbsoluteFill>;
};

export const CombinedSystemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const extraOpacity = interpolate(frame, [48, 82], [0, 0.88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const originalPath = 'M 435 494 Q 650 410 830 500 L 1080 500';
  const newPath = 'M 435 494 Q 780 665 1080 500';
  return <AbsoluteFill>
    <GalleryTitle index="05">COMBINED SYSTEM</GalleryTitle>
    <div style={{position: 'absolute', left: 245, top: 300}}><Type variant="title" style={{fontSize: 38}}>One route. A different outcome.</Type></div>
    <svg width="100%" height="100%" viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0}}>
      <path d={originalPath} fill="none" stroke={vibeTheme.colors.line.gold} strokeWidth={vibeTheme.lineWidths.thin} />
      <path d={newPath} fill="none" stroke={vibeTheme.colors.accent.gold} strokeWidth={vibeTheme.lineWidths.regular} opacity={extraOpacity} />
      <Arrow path={originalPath} startFrame={4} duration={55} color={vibeTheme.colors.accent.mutedGold} />
      <g opacity={extraOpacity}><Arrow path={newPath} startFrame={44} duration={60} color={vibeTheme.colors.accent.gold} /></g>
      <FlowParticles path={originalPath} count={7} speed={0.9} startFrame={28} seed="combined-main" />
      <FlowParticles path={newPath} count={9} speed={1.2} startFrame={80} seed="combined-new" opacity={extraOpacity * 0.88} />
      <AgentToken x={420} y={490} label="OBSERVER" state="active" />
      <Node x={830} y={500} label="SYSTEM" size={17} active pulse appearFrame={12} />
      <Node x={1120} y={500} label="OUTCOME" size={16} appearFrame={54} />
      <Callout x={950} y={684} anchorX={790} anchorY={632} label="ADD ONE CONNECTION" detail="flow begins to compete" startFrame={82} />
      <g transform="translate(515 830)"><MiniChart data={chartData} xRange={[0, 6]} yRange={[60, 85]} highlightIndex={6} startFrame={70} duration={120} width={450} height={175} xLabel="LINKS" yLabel="TIME" /></g>
    </svg>
    <div style={{position: 'absolute', right: 300, top: 720}}>
      <SectionLabel color={vibeTheme.colors.text.muted}>TRAVEL TIME</SectionLabel>
      <Counter from={65} to={80} suffix=" min" startFrame={55} duration={140} highlightOnChange style={{fontSize: 82, marginTop: 8}} />
      <SectionLabel color={vibeTheme.colors.accent.mutedGold} style={{marginTop: 2}}>MEASURED RESPONSE</SectionLabel>
    </div>
  </AbsoluteFill>;
};
