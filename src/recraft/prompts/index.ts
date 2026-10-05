import { RecraftImageRequest } from '../types';
import { buildCharacterPrompt } from './characterPrompt';
import { buildIconPrompt } from './iconPrompt';
import { buildObjectPrompt } from './objectPrompt';
import { buildScenePlatePrompt } from './scenePlatePrompt';

export function buildSemanticPrompt(request: RecraftImageRequest): string {
  switch (request.assetType) {
    case 'object': return buildObjectPrompt(request);
    case 'icon': return buildIconPrompt(request);
    case 'character': return buildCharacterPrompt(request);
    case 'scene-plate': return buildScenePlatePrompt(request);
  }
}
