import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {HybridLayout} from '../composition/hybridTypes';
import type {ResolvedHybridAsset} from '../composition/assetResolver';
import type {HybridSceneAsset} from '../assets/hybridComposer';

type LegacyAsset=HybridSceneAsset;
const layoutFor=(asset:ResolvedHybridAsset|LegacyAsset):HybridLayout=>('layout' in asset?asset.layout:asset.position==='left'?'subject-right':asset.position==='right'?'subject-left':'center-stage');
const placement=(layout:HybridLayout,signature:boolean)=>{
  if(signature)return{right:'5%',top:'4%',width:'25%',height:'37%'};
  switch(layout){case'subject-left':return{left:'8%',top:'17%',width:'39%',height:'68%'};case'subject-right':return{right:'8%',top:'17%',width:'39%',height:'68%'};case'center-stage':return{left:'31%',top:'15%',width:'38%',height:'70%'};case'full-field':return{left:'20%',top:'6%',width:'60%',height:'86%'};case'split-focus':return{right:'9%',top:'19%',width:'34%',height:'62%'};case'corner-anchor':return{right:'10%',top:'10%',width:'30%',height:'48%'};}
};
export const HybridAssetLayer: React.FC<{assets: readonly (ResolvedHybridAsset|LegacyAsset)[]; durationInFrames: number; signature?:boolean}> = ({assets,durationInFrames,signature=false}) => {
  const frame=useCurrentFrame();const fade=Math.min(24,Math.max(1,Math.floor(durationInFrames/5)));
  const opacity=interpolate(frame,[0,fade,Math.max(fade,durationInFrames-fade),durationInFrames],[0,1,1,0],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  return <AbsoluteFill style={{pointerEvents:'none',zIndex:2}}>{assets.map((asset,index)=>{
    const layout=layoutFor(asset);const bounds=placement(layout,signature);const drift=interpolate(frame,[0,Math.max(1,durationInFrames-1)],[7,-7],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});const scale=1+0.009*Math.sin(frame/150);const isAlpha='hasAlpha'in asset&&asset.hasAlpha;const architectureMatte=!isAlpha&&asset.assetKind==='architecture'?'radial-gradient(ellipse 38% 55% at 50% 50%, black 62%, transparent 100%)':undefined;const softMatte=architectureMatte??'radial-gradient(ellipse 72% 82% at 50% 50%, black 42%, transparent 100%)';
    return <div key={`${asset.assetId}-${index}`} style={{position:'absolute',...bounds,opacity:opacity*(assets.length>1?0.76:0.94),transform:`translateY(${drift}px) scale(${scale})`,transformOrigin:'center',overflow:'hidden',maskImage:isAlpha?undefined:softMatte,WebkitMaskImage:isAlpha?undefined:softMatte}}>
      <Img src={staticFile(asset.publicPath)} style={{width:'100%',height:'100%',objectFit:'contain',mixBlendMode:isAlpha?'normal':'lighten',filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.2))'}} />
    </div>;
  })}</AbsoluteFill>;
};
