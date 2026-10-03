import type {SceneContext} from './sceneContext';
import type {SceneSpec} from './sceneTypes';

export type SceneComponentProps<T extends SceneSpec> = {spec: T; context: SceneContext};
