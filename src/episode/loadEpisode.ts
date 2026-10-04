import { readFile } from 'node:fs/promises';
import { normalizeEpisode } from './normalizeEpisode';
export async function loadEpisode(path: string) {
    let raw: string;
    try {
        raw = await readFile(path, 'utf8');
    }
    catch (error) {
        throw new Error(`${path}: cannot read JSON: ${String(error)}`);
    }
    let input: unknown;
    try {
        input = JSON.parse(raw.replace(/^\uFEFF/, ''));
    }
    catch (error) {
        throw new Error(`${path}: invalid JSON: ${String(error)}`);
    }
    return normalizeEpisode(input, path);
}
