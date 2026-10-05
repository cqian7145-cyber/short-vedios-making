import { RecraftImageRequest } from '../types';

export function buildObjectPrompt(request: RecraftImageRequest): string {
  const parts = [
    `OBJECT IDENTITY: ${request.subject}.`,
    request.physicalStructure ? `PHYSICAL STRUCTURE: ${request.physicalStructure}.` : '',
    request.viewpoint ? `VIEWPOINT: ${request.viewpoint}.` : '',
    request.composition ? `ISOLATION AND COMPOSITION: ${request.composition}.` : 'ISOLATION: one complete subject, separated from other objects.',
    request.avoidConcepts?.length ? `NOT THESE OTHER OBJECTS: ${request.avoidConcepts.join('; ')}.` : '',
  ];
  return parts.filter(Boolean).join(' ');
}
