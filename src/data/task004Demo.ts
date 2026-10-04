import type {Task004Episode} from '../engine/sceneTypes';

const networkId = 'braess-network';

const braessNetwork = {
  id: networkId,
  nodes: [
    {id: 'start', label: 'A', x: 600, y: 490},
    {id: 'upper', label: 'B', x: 920, y: 340},
    {id: 'lower', label: 'C', x: 920, y: 650},
    {id: 'finish', label: 'D', x: 1280, y: 490},
  ],
  edges: [
    {id: 'north-west', from: 'start', to: 'upper', path: 'M 600 490 Q 748 378 920 340'},
    {id: 'north-east', from: 'upper', to: 'finish', path: 'M 920 340 Q 1108 369 1280 490'},
    {id: 'south-west', from: 'start', to: 'lower', path: 'M 600 490 Q 748 602 920 650'},
    {id: 'south-east', from: 'lower', to: 'finish', path: 'M 920 650 Q 1108 611 1280 490'},
    {id: 'new-road', from: 'upper', to: 'lower', path: 'M 920 340 L 920 650', role: 'added', label: 'NEW LINK'},
  ],
  routes: [
    {id: 'north-route', label: 'NORTH ROUTE', path: 'M 600 490 Q 748 378 920 340 Q 1108 369 1280 490', accent: 'gold'},
    {id: 'south-route', label: 'SOUTH ROUTE', path: 'M 600 490 Q 748 602 920 650 Q 1108 611 1280 490', accent: 'cyan'},
    {id: 'shortcut-route', label: 'SHORTCUT ROUTE', path: 'M 600 490 Q 748 378 920 340 L 920 650 Q 1108 611 1280 490', accent: 'red'},
  ],
  addedEdgeId: 'new-road',
  bottleneck: {x: 920, y: 495, nodeId: 'upper'},
} as const;

export const task004Demo: Task004Episode = {
  id: 'task004-braess-paradox',
  title: 'Why Can More Roads Make Traffic Worse?',
  durationInFrames: 1800,
  networks: {[networkId]: braessNetwork},
  scenes: [
    {id: 'hook', type: 'hook', durationInFrames: 204, content: {networkId, eyebrow: 'A QUESTION ABOUT CHOICE', headline: 'MORE ROADS\nSHOULD MEAN LESS TRAFFIC.', emphasis: 'LESS TRAFFIC', question: 'RIGHT?'}, subtitle: 'Could one new link slow everyone down?', intent: {focus: 'two paths to one destination', accent: 'gold', density: 'sparse', camera: 'slowPushIn'}},
    {id: 'setup', type: 'setup', durationInFrames: 234, transition: {overlapFrames: 34}, content: {networkId, eyebrow: 'THE NETWORK', title: 'Two routes. One destination.', routeLabel: 'TWO AVAILABLE ROUTES', destinationLabel: 'SHARED DESTINATION'}, subtitle: 'Before anything changes, the routes share the load.', intent: {focus: 'two balanced routes', density: 'balanced', camera: 'parallax'}},
    {id: 'history', type: 'history', durationInFrames: 174, transition: {overlapFrames: 34}, content: {eyebrow: 'A COUNTERINTUITIVE RESULT', year: '1968', name: 'Dietrich Braess', mark: 'NETWORK EQUILIBRIUM', formula: 'individual choice ≠ collective optimum', formulaAnnotation: 'A system can settle into a slower balance'}, subtitle: 'A network paradox described by Dietrich Braess.', intent: {focus: 'paradox origin', accent: 'gold', density: 'sparse', camera: 'slowPushIn'}},
    {id: 'diagram', type: 'diagram', durationInFrames: 324, transition: {overlapFrames: 34}, content: {networkId, eyebrow: 'THE ROUTE STRUCTURE', title: 'Every driver picks a fastest route.', footnote: 'Travel time rises with congestion.', highlightNodeId: 'upper', annotations: [{label: 'START', anchorNodeId: 'start'}, {label: 'SAME DESTINATION', anchorNodeId: 'finish'}]}, subtitle: 'Each driver optimizes one trip, with the same shared roads.', intent: {focus: 'route topology and shared links', density: 'balanced', camera: 'parallax'}},
    {id: 'simulation', type: 'simulation', durationInFrames: 414, transition: {overlapFrames: 34}, content: {mode: 'networkFlow', networkId, eyebrow: 'A SYSTEM IN MOTION', metricLabel: 'Average travel time', beforeCaption: 'BEFORE THE NEW LINK', afterCaption: 'AFTER ROUTES REBALANCE', from: 65, to: 80, unit: ' min', baselineRouteCounts: {'north-route': 7, 'south-route': 7}, redistributedRouteCounts: {'north-route': 3, 'south-route': 2, 'shortcut-route': 9}, addedEdgeId: 'new-road', newRouteId: 'shortcut-route', bottleneckLabel: 'BOTTLENECK'}, subtitle: 'A new shortcut attracts drivers toward the same bottleneck.', intent: {focus: 'new link and bottleneck', accent: 'red', density: 'dense', camera: 'slowPushIn'}},
    {id: 'comparison', type: 'comparison', durationInFrames: 204, transition: {overlapFrames: 34}, content: {networkId, eyebrow: 'THE OUTCOME', metricLabel: 'Average travel time', before: 65, after: 80, unit: ' min', beforeLabel: 'WITHOUT THE NEW ROAD', afterLabel: 'WITH THE NEW ROAD'}, subtitle: 'The shorter-looking option makes the whole trip longer.', intent: {focus: 'before and after result', accent: 'red', density: 'sparse', camera: 'parallax'}},
    {id: 'reveal', type: 'reveal', durationInFrames: 204, transition: {overlapFrames: 34}, content: {networkId, eyebrow: 'THE PARADOX', headline: 'THE EXTRA ROAD\nMADE TRAFFIC WORSE.', emphasis: 'MADE TRAFFIC WORSE', highlightNodeId: 'upper', highlightEdgeId: 'new-road'}, subtitle: 'More capacity can produce a worse equilibrium.', intent: {focus: 'new link into bottleneck', accent: 'gold', density: 'balanced', camera: 'slowPushIn'}},
    {id: 'explanation', type: 'explanation', durationInFrames: 174, transition: {overlapFrames: 34}, content: {networkId, individualLabel: 'INDIVIDUAL LOGIC', individualStatement: 'Choose the route that looks fastest.', systemLabel: 'SYSTEM RESULT', systemStatement: 'Everyone crowds the same shortcut.', principle: 'LOCAL OPTIMA CAN CREATE GLOBAL COST.', bottleneckLabel: 'SHARED BOTTLENECK', driverLabels: ['DRIVER A', 'DRIVER B'], sharedLinkLabel: 'SHARED LINK', focusNodeId: 'upper'}, subtitle: 'What is best for one driver can be worse for everyone.', intent: {focus: 'individual versus system outcome', accent: 'red', density: 'sparse', camera: 'parallax'}},
    {id: 'ending', type: 'ending', durationInFrames: 140, transition: {overlapFrames: 34}, content: {networkId, concept: "BRAESS'S PARADOX", summary: 'More connections do not always mean better systems.', brand: 'VIBE KNOWLEDGE'}, intent: {focus: 'quiet branded close', accent: 'gold', density: 'sparse', camera: 'slowPullBack'}},
  ],
};
