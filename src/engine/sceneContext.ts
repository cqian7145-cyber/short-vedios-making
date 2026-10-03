import type {NetworkDiagramSpec} from './sceneTypes';
import type {SceneFrame} from './useSceneFrame';

export type SceneContext = SceneFrame & {network?: NetworkDiagramSpec};
