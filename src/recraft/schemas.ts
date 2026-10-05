import { z } from 'zod';
import { RECRAFT_ASSET_TYPES } from './types';

export const RecraftImageRequestSchema = z.object({
  subject: z.string().trim().min(1).max(1000),
  composition: z.string().trim().min(1).max(1000).optional(),
  assetType: z.enum(RECRAFT_ASSET_TYPES),
  aspectRatio: z.string().regex(/^\d{1,2}:\d{1,2}$/).optional(),
  transparentBackground: z.boolean().optional(),
}).strict();

export const RecraftApiResponseSchema = z.object({
  data: z.array(z.object({ b64_json: z.string().min(1) }).passthrough()).min(1),
}).passthrough();

export const RecraftAssetManifestItemSchema = z.object({
  id: z.string().min(1),
  episodeId: z.string().min(1).optional(),
  sceneId: z.string().min(1).optional(),
  provider: z.literal('recraft'),
  assetType: z.enum(RECRAFT_ASSET_TYPES),
  subject: z.string().min(1),
  prompt: z.string().min(1).optional(),
  promptVersion: z.enum(['recraft-style-v1', 'recraft-style-v2']),
  profileVersion: z.enum(['recraft-v1', 'midnight-scientific-editorial-v1']),
  filePath: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  createdAt: z.string().datetime(),
}).strict();

export const RecraftAssetManifestSchema = z.object({
  schemaVersion: z.literal('recraft-asset-manifest-v1'),
  assets: z.array(RecraftAssetManifestItemSchema),
}).strict();

export const RecraftStyleValidationReportSchema = z.object({
  profileVersion: z.literal('recraft-v1'),
  profileName: z.literal('Selected Editorial Scientific Style'),
  provider: z.literal('recraft'),
  apiSmokePassed: z.boolean(),
  assetCount: z.number().int().nonnegative(),
  characterConsistency: z.number().min(0).max(100).nullable(),
  objectConsistency: z.number().min(0).max(100).nullable(),
  sceneConsistency: z.number().min(0).max(100).nullable(),
  iconConsistency: z.number().min(0).max(100).nullable(),
  darkBackgroundCompatibility: z.number().min(0).max(100).nullable(),
  remotionCompatibility: z.number().min(0).max(100).nullable(),
  embeddedTextRisk: z.enum(['low', 'medium', 'high', 'not-reviewed']),
  scoreBreakdown: z.object({
    styleConsistency: z.number().min(0).max(25).nullable(),
    objectClarity: z.number().min(0).max(15).nullable(),
    characterConsistency: z.number().min(0).max(10).nullable(),
    sceneCompatibility: z.number().min(0).max(10).nullable(),
    iconReadability: z.number().min(0).max(10).nullable(),
    darkBackgroundFit: z.number().min(0).max(15).nullable(),
    remotionCompatibility: z.number().min(0).max(15).nullable(),
  }).strict(),
  overallScore: z.number().min(0).max(100).nullable(),
  status: z.enum(['blocked', 'needs-review', 'rejected', 'validated']),
  humanApproval: z.literal('required'),
  humanApprovalStatus: z.enum(['pending', 'approved', 'rejected']),
  warnings: z.array(z.string()),
  styleLocked: z.boolean(),
}).strict();

export const RecraftStyleAssessmentSchema = z.object({
  reviewType: z.literal('editorial-heuristic'),
  reviewer: z.string().min(1),
  humanApprovalStatus: z.enum(['pending', 'approved', 'rejected']),
  embeddedTextRisk: z.enum(['low', 'medium', 'high', 'not-reviewed']),
  scoreBreakdown: z.object({
    styleConsistency: z.number().min(0).max(25),
    objectClarity: z.number().min(0).max(15),
    characterConsistency: z.number().min(0).max(10),
    sceneCompatibility: z.number().min(0).max(10),
    iconReadability: z.number().min(0).max(10),
    darkBackgroundFit: z.number().min(0).max(15),
    remotionCompatibility: z.number().min(0).max(15),
  }).strict(),
  warnings: z.array(z.string()),
  notes: z.array(z.string()),
}).strict();

export const MidnightStyleAssessmentSchema = z.object({
  reviewType: z.literal('editorial-heuristic'),
  reviewer: z.string().min(1),
  humanApprovalStatus: z.enum(['pending', 'approved', 'rejected']),
  embeddedTextRisk: z.enum(['low', 'medium', 'high', 'not-reviewed']),
  semanticAccuracyScore: z.number().min(0).max(20),
  criticalSemanticFailures: z.array(z.string()),
  scoreBreakdown: z.object({
    styleConsistency: z.number().min(0).max(20),
    semanticAccuracy: z.number().min(0).max(20),
    objectClarity: z.number().min(0).max(15),
    characterConsistency: z.number().min(0).max(10),
    iconReadability: z.number().min(0).max(10),
    darkBackgroundFit: z.number().min(0).max(10),
    remotionCompatibility: z.number().min(0).max(15),
  }).strict(),
  warnings: z.array(z.string()),
  notes: z.array(z.string()),
}).strict();

export const MidnightStyleValidationReportSchema = z.object({
  profileVersion: z.literal('midnight-scientific-editorial-v1'),
  profileName: z.literal('Midnight Scientific Editorial v1'),
  provider: z.literal('recraft'),
  styleConfigured: z.boolean(),
  apiSmokePassed: z.boolean(),
  assetCount: z.number().int().nonnegative(),
  semanticAccuracyScore: z.number().min(0).max(20).nullable(),
  criticalSemanticFailures: z.array(z.string()),
  scoreBreakdown: z.object({
    styleConsistency: z.number().min(0).max(20).nullable(),
    semanticAccuracy: z.number().min(0).max(20).nullable(),
    objectClarity: z.number().min(0).max(15).nullable(),
    characterConsistency: z.number().min(0).max(10).nullable(),
    iconReadability: z.number().min(0).max(10).nullable(),
    darkBackgroundFit: z.number().min(0).max(10).nullable(),
    remotionCompatibility: z.number().min(0).max(15).nullable(),
  }).strict(),
  overallScore: z.number().min(0).max(100).nullable(),
  status: z.enum(['blocked', 'needs-review', 'rejected', 'validated']),
  humanApproval: z.literal('required'),
  humanApprovalStatus: z.enum(['pending', 'approved', 'rejected']),
  warnings: z.array(z.string()),
  styleLocked: z.boolean(),
}).strict();
