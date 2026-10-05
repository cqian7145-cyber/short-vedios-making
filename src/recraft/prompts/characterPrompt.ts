import { RecraftImageRequest } from '../types';

export function buildCharacterPrompt(request: RecraftImageRequest): string {
  const parts = [
    `CHARACTER IDENTITY: ${request.subject}.`,
    request.physicalStructure ? `VISIBLE FORM: ${request.physicalStructure}.` : '',
    request.viewpoint ? `VIEWPOINT: ${request.viewpoint}.` : '',
    request.composition ? `POSE AND PLACEMENT: ${request.composition}.` : 'POSE AND PLACEMENT: one full figure, centered and isolated.',
    request.avoidConcepts?.length ? `AVOID CONFUSION WITH: ${request.avoidConcepts.join('; ')}.` : '',
  ];
  return parts.filter(Boolean).join(' ');
}
