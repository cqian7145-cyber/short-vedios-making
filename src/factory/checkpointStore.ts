import {readFile, writeFile} from 'node:fs/promises';

export type Checkpoint<T> = {value: T; path: string};

export async function readJsonFile(file: string): Promise<unknown | null> {
  try { return JSON.parse(await readFile(file, 'utf8')) as unknown; }
  catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return null;
    throw new Error(`Could not read JSON checkpoint ${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function readFirstCheckpoint<T>(files: readonly string[], parse: (value: unknown) => T): Promise<Checkpoint<T> | null> {
  for (const file of files) {
    const json = await readJsonFile(file);
    if (json === null) continue;
    try { return {value: parse(json), path: file}; }
    catch { continue; }
  }
  return null;
}

export async function writeJsonFile(file: string, value: unknown): Promise<void> {
  const {mkdir} = await import('node:fs/promises');
  const {dirname} = await import('node:path');
  await mkdir(dirname(file), {recursive: true});
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
