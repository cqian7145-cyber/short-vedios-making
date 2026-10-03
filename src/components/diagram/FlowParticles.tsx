import React, {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {useCurrentFrame} from 'remotion';
import {vibeTheme} from '../../themes/vibeTheme';
import {seededValue} from '../../utils/random';
import {progress} from '../../utils/timing';

export type FlowParticlesProps = {
  path: string;
  count?: number;
  density?: number;
  speed?: number;
  size?: number;
  color?: string;
  startFrame?: number;
  endFrame?: number;
  direction?: 'forward' | 'reverse';
  seed?: number | string;
  opacity?: number;
};

export const FlowParticles: React.FC<FlowParticlesProps> = ({path, count = 8, density = 1, speed = 1, size = 2.4, color = vibeTheme.colors.accent.gold, startFrame = 0, endFrame, direction = 'forward', seed = 'flow', opacity = 0.82}) => {
  const frame = useCurrentFrame();
  const pathRef = useRef<SVGPathElement>(null);
  const [samples, setSamples] = useState<readonly {x: number; y: number}[]>([]);
  const particleCount = Math.max(0, Math.round(count * Math.max(0, density)));
  useLayoutEffect(() => {
    const element = pathRef.current;
    if (!element) return;
    try {
      const length = element.getTotalLength();
      if (!Number.isFinite(length) || length <= 0) return;
      const points = Array.from({length: 181}, (_, index) => {
        const point = element.getPointAtLength(length * index / 180);
        return {x: point.x, y: point.y};
      });
      setSamples(points);
    } catch {
      setSamples([]);
    }
  }, [path]);

  const shown = frame >= startFrame && (endFrame === undefined || frame <= endFrame);
  const fade = endFrame === undefined ? progress(frame, startFrame, 1) : Math.min(progress(frame, startFrame, 12), 1 - progress(frame, endFrame - 12, 12));
  const positions = useMemo(() => Array.from({length: particleCount}, (_, index) => {
    if (!samples.length) return null;
    let t = (index / Math.max(1, particleCount) + Math.max(0, frame - startFrame) * speed / 180 + seededValue(seed, index) * 0.12) % 1;
    if (direction === 'reverse') t = 1 - t;
    const sample = t * (samples.length - 1);
    const lower = Math.floor(sample);
    const upper = Math.min(samples.length - 1, lower + 1);
    const ratio = sample - lower;
    return {x: samples[lower].x + (samples[upper].x - samples[lower].x) * ratio, y: samples[lower].y + (samples[upper].y - samples[lower].y) * ratio};
  }), [direction, frame, particleCount, samples, seed, speed, startFrame]);

  return <g opacity={shown ? opacity * Math.max(0, fade) : 0} pointerEvents="none">
    <path ref={pathRef} d={path} fill="none" stroke="none" opacity="0" aria-hidden="true" />
    {positions.map((point, index) => point && <circle key={index} cx={point.x} cy={point.y} r={index % 4 === 0 ? size * 1.2 : size} fill={color} opacity={index % 4 === 0 ? 0.95 : 0.72} />)}
  </g>;
};
