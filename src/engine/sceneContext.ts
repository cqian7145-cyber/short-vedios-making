import type {NetworkDiagramSpec} from './sceneTypes';
import type {SceneFrame} from './useSceneFrame';
import type {ResolvedVisualStrategy} from '../factory/renderStrategy';

export type SceneContext = SceneFrame & {network?: NetworkDiagramSpec; visualStrategy?: ResolvedVisualStrategy};
