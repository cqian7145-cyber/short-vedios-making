import React from 'react';
import { AbsoluteFill, interpolate } from 'remotion';
import { AgentToken, Relationship, FlowParticles, Callout, Counter } from '../../components';
import { SectionLabel, Type } from '../../components/typography/Type';
import { vibeTheme as theme } from '../../themes/vibeTheme';
import type { BiddingSimulationContent } from '../sceneTypes';
import type { SceneContext } from '../sceneContext';
export const BiddingSimulation: React.FC<{
    content: BiddingSimulationContent;
    context: SceneContext;
}> = ({ content: c, context }) => {
    const { localFrame: f, durationInFrames: d } = context;
    const step = d * .72 / c.bids.length;
    const index = Math.min(c.bids.length - 1, Math.max(0, Math.floor((f - d * .1) / step)));
    const bid = c.bids[index];
    const over = bid.amount > c.prizeValue;
    const drift = interpolate(f, [0, d], [0, 48]);
    return <AbsoluteFill>
 <div style={{ position: 'absolute', left: 210, top: 170 }}><SectionLabel>{c.eyebrow}</SectionLabel><Type variant="title" style={{ fontSize: 44, marginTop: 20 }}>{c.metricLabel}</Type></div>
 <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
 <Relationship from={{ x: 560 + drift, y: 490 }} to={{ x: 1360 - drift, y: 490 }} label={c.relationshipLabel} state={over ? 'negative' : 'positive'} active startFrame={15}/>
 <FlowParticles path="M 560 490 Q 960 260 1360 490" count={3 + index * 2} color={over ? theme.colors.accent.red : theme.colors.accent.gold} seed="bid-flow" startFrame={25}/>
 {c.participants.map((p, i) => <AgentToken key={p.id} x={i === 0 ? 560 + drift : 1360 - drift} y={490} label={p.label} accent={theme.colors.accent[p.accent ?? (i === 0 ? 'gold' : 'cyan')]} state={p.id === bid.bidderId ? 'active' : 'waiting'} highlight={p.id === bid.bidderId} scale={1.5}/>)}
 <path d="M 460 775 H 1460" stroke={theme.colors.line.subtle}/>
 {c.bids.map((b, i) => <g key={i} opacity={i <= index ? 1 : .18}><circle cx={460 + i * 1000 / (c.bids.length - 1)} cy={775} r={i === index ? 7 : 3} fill={b.amount > c.prizeValue ? theme.colors.accent.red : theme.colors.accent.gold}/><text x={460 + i * 1000 / (c.bids.length - 1)} y={819} textAnchor="middle" fill={theme.colors.text.secondary} fontFamily={theme.typography.family.technical} fontSize={23}>{c.currencyPrefix}{b.amount.toFixed(2)}</text></g>)}
 {over && <Callout x={1160} y={640} anchorX={1020} anchorY={590} label={c.exceedsLabel} detail={`${c.currencyPrefix}${c.prizeValue.toFixed(2)} prize`} color={theme.colors.accent.red} startFrame={Math.round(d * .1 + index * step)}/>}
 </svg>
 <div style={{ position: 'absolute', left: 780, top: 525, width: 360, textAlign: 'center' }}><Counter key={index} from={index ? c.bids[index - 1].amount : 0} to={bid.amount} startFrame={Math.max(0, Math.round(d * .1 + index * step))} duration={18} prefix={c.currencyPrefix} decimals={2} color={over ? theme.colors.accent.red : theme.colors.text.primary} style={{ fontSize: 90 }}/></div>
 </AbsoluteFill>;
};
