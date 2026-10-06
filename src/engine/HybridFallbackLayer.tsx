import React from 'react';
import {AbsoluteFill} from 'remotion';
import {AgentToken} from '../components/entities/AgentToken';
import type {HybridLayout,HybridSceneFallback} from '../composition/hybridTypes';

const point=(layout:HybridLayout)=>{switch(layout){case'subject-left':return{x:580,y:740};case'subject-right':return{x:1340,y:740};case'center-stage':case'full-field':return{x:960,y:760};case'split-focus':return{x:1360,y:740};case'corner-anchor':return{x:1450,y:460};}};
export const HybridFallbackLayer:React.FC<{fallbacks:readonly HybridSceneFallback[];layout:HybridLayout}>=({fallbacks,layout})=>{
  const characters=fallbacks.filter((item)=>item.fallbackKind==='agent-token');if(!characters.length)return null;const {x,y}=point(layout);
  return <AbsoluteFill style={{pointerEvents:'none',zIndex:3}}><svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="none" aria-hidden="true">{characters.map((item,index)=><AgentToken key={`${item.assetId}-${index}`} x={x+index*44} y={y} state="waiting" opacity={0.9} scale={1.25} />)}</svg></AbsoluteFill>;
};
