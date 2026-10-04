import React from 'react';
import { useCurrentFrame } from 'remotion';
import { AgentToken, Relationship, FlowParticles } from '../../components';
import { vibeTheme } from '../../themes/vibeTheme';
export const ParticipantsStage: React.FC<{
    labels: readonly [
        string,
        string
    ];
    label?: string;
}> = ({ labels, label }) => {
    const frame = useCurrentFrame();
    const drift = Math.sin(frame / 140) * 16;
    return <svg viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
 <Relationship from={{ x: 1160, y: 420 + drift }} to={{ x: 1480, y: 650 - drift }} label={label} active startFrame={20}/>
 <FlowParticles path="M 1160 420 Q 1440 400 1480 650" count={5} seed="participants" startFrame={30}/>
 <AgentToken x={1160} y={420 + drift} label={labels[0]} state="active"/>
 <AgentToken x={1480} y={650 - drift} label={labels[1]} accent={vibeTheme.colors.accent.cyan} state="active" appearFrame={18}/>
 </svg>;
};
