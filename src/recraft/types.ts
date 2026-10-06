export const RECRAFT_ASSET_TYPES = ['icon', 'object', 'character', 'scene-plate'] as const;
export type RecraftAssetType = typeof RECRAFT_ASSET_TYPES[number];

export type RecraftImageRequest = {
  subject: string;
  composition?: string;
  physicalStructure?: string;
  viewpoint?: string;
  visualRelationship?: string;
  avoidConcepts?: string[];
  assetType: RecraftAssetType;
  aspectRatio?: string;
  transparentBackground?: boolean;
  preparedPrompt?: string;
};

export type RecraftProviderRequest = {
  prompt: string;
  model: 'recraftv3';
  style_id: string;
  size: string;
  n: 1;
  response_format: 'b64_json';
  image_format: 'png';
};

export type GeneratedRecraftImage = {
  bytes: Buffer;
  mimeType: 'image/png';
  prompt: string;
  model: 'recraftv3';
};
