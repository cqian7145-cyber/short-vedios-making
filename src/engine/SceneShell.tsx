import React from 'react';
import {AbsoluteFill} from 'remotion';
import {CameraDrift, type CameraMove} from '../components/CameraDrift';
import {CinematicBackground} from '../components/CinematicBackground';
import {vibeTheme} from '../themes/vibeTheme';

export type SceneShellProps = {children: React.ReactNode; durationInFrames: number; camera?: CameraMove};

/** One persistent background, camera move, safe-area token scope, and content layer for the full episode. */
export const SceneShell: React.FC<SceneShellProps> = ({children, durationInFrames, camera = 'parallax'}) => <AbsoluteFill
  style={{
    backgroundColor: vibeTheme.colors.background.primary,
    color: vibeTheme.colors.text.primary,
    overflow: 'hidden',
    '--vibe-safe-left': `${vibeTheme.safeArea.edgeX}px`,
    '--vibe-safe-right': `${vibeTheme.safeArea.edgeX}px`,
    '--vibe-safe-top': `${vibeTheme.safeArea.contentTop}px`,
    '--vibe-safe-bottom': `${vibeTheme.safeArea.contentBottom}px`,
  } as React.CSSProperties}
>
  <CameraDrift durationFrames={durationInFrames} move={camera} amount={0.12}>
    <CinematicBackground durationFrames={durationInFrames} />
    <AbsoluteFill style={{zIndex: vibeTheme.zIndex.scene}}>{children}</AbsoluteFill>
  </CameraDrift>
</AbsoluteFill>;
