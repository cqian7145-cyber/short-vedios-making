import { RecraftImageRequest } from '../types';

export function buildIconPrompt(request: RecraftImageRequest): string {
  const parts = [
    `ABSTRACT ICON CONCEPT: ${request.subject}.`,
    request.visualRelationship ? `GEOMETRIC RELATIONSHIP: ${request.visualRelationship}.` : '',
    request.composition ? `READABILITY: ${request.composition}.` : 'READABILITY: clear at small size, centered, isolated.',
    request.avoidConcepts?.length ? `DO NOT DEPICT THESE LITERAL METAPHORS: ${request.avoidConcepts.join('; ')}.` : '',
  ];
  return parts.filter(Boolean).join(' ');
}
