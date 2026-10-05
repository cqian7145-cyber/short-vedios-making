import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { RECRAFT_API_BASE_URL } from './styleApi';
import { persistLocalRecraftStyleId } from './config';

const CreateStyleResponseSchema = z.object({ id: z.string().min(1) }).passthrough();

export async function createRecraftStyleFromReferences(
  apiKey: string,
  imagePaths: string[],
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  if (imagePaths.length < 1 || imagePaths.length > 10) {
    throw new Error('Recraft styles require between one and ten reference images.');
  }

  const form = new FormData();
  form.append('model', 'recraftv3');
  form.append('style', 'digital_illustration');
  form.append('match', 'regular');
  form.append('prompt', 'Midnight scientific editorial illustration: minimal geometric construction, controlled technical outlines, restrained flat shading, limited navy, muted blue, ivory, and warm gold palette.');
  let totalSize = 0;
  for (const [index, imagePath] of imagePaths.entries()) {
    const bytes = await readFile(imagePath);
    if (bytes.length >= 10 * 1024 * 1024) throw new Error('A Recraft style reference exceeds the documented per-file limit.');
    totalSize += bytes.length;
    if (totalSize > 64 * 1024 * 1024) throw new Error('Recraft style references exceed the documented total size limit.');
    const arrayBuffer = Uint8Array.from(bytes).buffer;
    form.append(`file${index + 1}`, new Blob([arrayBuffer], { type: 'image/png' }), `reference-${index + 1}.png`);
  }

  let response: Response;
  try {
    response = await fetchImpl(`${RECRAFT_API_BASE_URL}/styles`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });
  } catch {
    throw new Error('Recraft custom style request could not be completed.');
  }
  if (!response.ok) throw new Error(`Recraft custom style creation failed (HTTP ${response.status}).`);

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error('Recraft custom style response could not be read.');
  }
  const parsed = CreateStyleResponseSchema.safeParse(body);
  if (!parsed.success) throw new Error('Recraft custom style response did not contain a valid style identifier.');
  return parsed.data.id;
}

export async function createAndPersistRecraftStyleFromReferences(
  apiKey: string,
  imagePaths: string[],
  statePath: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const styleId = await createRecraftStyleFromReferences(apiKey, imagePaths, fetchImpl);
  persistLocalRecraftStyleId(styleId, statePath);
  return styleId;
}
