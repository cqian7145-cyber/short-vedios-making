import type {CameraMove} from '../components/CameraDrift';

export type SceneType = 'hook' | 'setup' | 'history' | 'diagram' | 'simulation' | 'comparison' | 'reveal' | 'explanation' | 'ending';
export type AccentName = 'gold' | 'red' | 'cyan';

export type SceneTransitionSpec = {
  overlapFrames?: number;
  direction?: 'left' | 'right';
};

export type SceneIntent = {
  focus?: string;
  accent?: AccentName;
  density?: 'sparse' | 'balanced' | 'dense';
  camera?: CameraMove;
};

export type DiagramNodeSpec = {id: string; label: string; x: number; y: number};
export type DiagramEdgeSpec = {id: string; from: string; to: string; path?: string; label?: string; role?: 'base' | 'added'};
export type DiagramRouteSpec = {id: string; label: string; path: string; accent?: AccentName};
export type NetworkDiagramSpec = {
  id: string;
  nodes: readonly DiagramNodeSpec[];
  edges: readonly DiagramEdgeSpec[];
  routes: readonly DiagramRouteSpec[];
  addedEdgeId?: string;
  bottleneck?: {x: number; y: number; nodeId?: string};
};

export type BaseSceneSpec<K extends SceneType, C> = {
  id: string;
  type: K;
  durationInFrames: number;
  transition?: SceneTransitionSpec;
  subtitle?: string;
  intent?: SceneIntent;
  content: C;
};

export type HookSceneSpec = BaseSceneSpec<'hook', {networkId?: string; eyebrow: string; headline: string; emphasis: string; question: string; participants?: readonly [string, string]; relationshipLabel?: string}>;
export type SetupSceneSpec = BaseSceneSpec<'setup', {networkId?: string; eyebrow: string; title: string; routeLabel?: string; destinationLabel?: string; participants?: readonly [string, string]; relationshipLabel?: string}>;
export type HistorySceneSpec = BaseSceneSpec<'history', {eyebrow: string; year: string; name: string; mark: string; formula: string; formulaAnnotation: string}>;
export type DiagramSceneSpec = BaseSceneSpec<'diagram', {networkId: string; eyebrow: string; title: string; footnote: string; highlightNodeId?: string; highlightEdgeId?: string; annotations: readonly {label: string; detail?: string; anchorNodeId: string}[]}>;
export type NetworkFlowSimulationContent = {
  mode: 'networkFlow';
  networkId: string;
  eyebrow: string;
  metricLabel: string;
  beforeCaption: string;
  afterCaption: string;
  from: number;
  to: number;
  unit: string;
  baselineRouteCounts: Readonly<Record<string, number>>;
  redistributedRouteCounts: Readonly<Record<string, number>>;
  addedEdgeId: string;
  newRouteId: string;
  bottleneckLabel: string;
};
export type BiddingSimulationContent = {
  mode: 'bidding';
  eyebrow: string;
  metricLabel: string;
  participants: readonly [{id: string; label: string; accent?: AccentName}, {id: string; label: string; accent?: AccentName}];
  bids: readonly {bidderId: string; amount: number}[];
  prizeValue: number;
  currencyPrefix: string;
  relationshipLabel: string;
  exceedsLabel: string;
};
export type SimulationSceneSpec = BaseSceneSpec<'simulation', NetworkFlowSimulationContent | BiddingSimulationContent>;
export type ComparisonSceneSpec = BaseSceneSpec<'comparison', {networkId?: string; eyebrow: string; metricLabel: string; before: number; after: number; unit: string; prefix?: string; decimals?: number; beforeLabel: string; afterLabel: string}>;
export type RevealSceneSpec = BaseSceneSpec<'reveal', {networkId?: string; eyebrow: string; headline: string; emphasis: string; highlightNodeId?: string; highlightEdgeId?: string; participants?: readonly [string, string]; relationshipLabel?: string}>;
export type ExplanationSceneSpec = BaseSceneSpec<'explanation', {networkId?: string; individualLabel: string; individualStatement: string; systemLabel: string; systemStatement: string; principle: string; bottleneckLabel: string; driverLabels: readonly [string, string]; sharedLinkLabel: string; focusNodeId?: string}>;
export type EndingSceneSpec = BaseSceneSpec<'ending', {networkId?: string; concept: string; summary: string; brand: string}>;

export type SceneSpec = HookSceneSpec | SetupSceneSpec | HistorySceneSpec | DiagramSceneSpec | SimulationSceneSpec | ComparisonSceneSpec | RevealSceneSpec | ExplanationSceneSpec | EndingSceneSpec;

export type SceneTimelineEntry = {
  spec: SceneSpec;
  startFrame: number;
  endFrame: number;
  transitionInFrames: number;
  transitionOutFrames: number;
};

export type Task004Episode = {
  id: string;
  title: string;
  durationInFrames: number;
  networks: Readonly<Record<string, NetworkDiagramSpec>>;
  scenes: readonly SceneSpec[];
};
