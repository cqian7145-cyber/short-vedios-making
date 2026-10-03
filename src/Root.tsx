import React from 'react';
import {Composition} from 'remotion';
import {Task001Foundation} from './compositions/Task001Foundation';

export const RemotionRoot: React.FC = () => <Composition id="Task001Foundation" component={Task001Foundation} width={1920} height={1080} fps={30} durationInFrames={600} />;
