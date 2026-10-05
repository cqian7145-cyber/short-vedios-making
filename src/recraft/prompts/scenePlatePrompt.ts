import { RecraftImageRequest } from '../types';

export function buildScenePlatePrompt(request: RecraftImageRequest): string {
  const parts = [
    `SCENE SUBJECT: ${request.subject}.`,
    request.physicalStructure ? `SPATIAL STRUCTURE: ${request.physicalStructure}.` : '',
    request.viewpoint ? `VIEWPOINT: ${request.viewpoint}.` : '',
    request.composition ? `LAYOUT AND NEGATIVE SPACE: ${request.composition}.` : '',
    request.avoidConcepts?.length ? `EXCLUDE THESE MISREADINGS: ${request.avoidConcepts.join('; ')}.` : '',
  ];
  return parts.filter(Boolean).join(' ');
}
