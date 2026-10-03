import React from 'react';
import type {SceneContext} from './sceneContext';
import type {
  ComparisonSceneSpec,
  DiagramSceneSpec,
  EndingSceneSpec,
  ExplanationSceneSpec,
  HistorySceneSpec,
  HookSceneSpec,
  RevealSceneSpec,
  SceneSpec,
  SetupSceneSpec,
  SimulationSceneSpec,
} from './sceneTypes';
import {ComparisonScene} from './scenes/ComparisonScene';
import {DiagramScene} from './scenes/DiagramScene';
import {EndingScene} from './scenes/EndingScene';
import {ExplanationScene} from './scenes/ExplanationScene';
import {HistoryScene} from './scenes/HistoryScene';
import {HookScene} from './scenes/HookScene';
import {RevealScene} from './scenes/RevealScene';
import {SetupScene} from './scenes/SetupScene';
import {SimulationScene} from './scenes/SimulationScene';

type Registry = {
  hook: (spec: HookSceneSpec, context: SceneContext) => React.ReactNode;
  setup: (spec: SetupSceneSpec, context: SceneContext) => React.ReactNode;
  history: (spec: HistorySceneSpec, context: SceneContext) => React.ReactNode;
  diagram: (spec: DiagramSceneSpec, context: SceneContext) => React.ReactNode;
  simulation: (spec: SimulationSceneSpec, context: SceneContext) => React.ReactNode;
  comparison: (spec: ComparisonSceneSpec, context: SceneContext) => React.ReactNode;
  reveal: (spec: RevealSceneSpec, context: SceneContext) => React.ReactNode;
  explanation: (spec: ExplanationSceneSpec, context: SceneContext) => React.ReactNode;
  ending: (spec: EndingSceneSpec, context: SceneContext) => React.ReactNode;
};

/** Explicit discriminated registry keeps scene-specific props checked at compile time. */
export const sceneRegistry: Registry = {
  hook: (spec, context) => <HookScene spec={spec} context={context} />,
  setup: (spec, context) => <SetupScene spec={spec} context={context} />,
  history: (spec, context) => <HistoryScene spec={spec} context={context} />,
  diagram: (spec, context) => <DiagramScene spec={spec} context={context} />,
  simulation: (spec, context) => <SimulationScene spec={spec} context={context} />,
  comparison: (spec, context) => <ComparisonScene spec={spec} context={context} />,
  reveal: (spec, context) => <RevealScene spec={spec} context={context} />,
  explanation: (spec, context) => <ExplanationScene spec={spec} context={context} />,
  ending: (spec, context) => <EndingScene spec={spec} context={context} />,
};

export const renderRegisteredScene = (spec: SceneSpec, context: SceneContext): React.ReactNode => {
  switch (spec.type) {
    case 'hook': return sceneRegistry.hook(spec, context);
    case 'setup': return sceneRegistry.setup(spec, context);
    case 'history': return sceneRegistry.history(spec, context);
    case 'diagram': return sceneRegistry.diagram(spec, context);
    case 'simulation': return sceneRegistry.simulation(spec, context);
    case 'comparison': return sceneRegistry.comparison(spec, context);
    case 'reveal': return sceneRegistry.reveal(spec, context);
    case 'explanation': return sceneRegistry.explanation(spec, context);
    case 'ending': return sceneRegistry.ending(spec, context);
  }
};
