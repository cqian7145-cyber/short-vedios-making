import {inflateSync} from 'node:zlib';

export type PngInfo = {width: number; height: number; hasAlpha: boolean; format: 'png'};
export function inspectPng(bytes: Buffer): PngInfo {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  if (bytes.length < 57 || !bytes.subarray(0,8).equals(signature)) throw new Error('Image payload is not a readable PNG.');
  let offset = 8; let width = 0; let height = 0; let bitDepth = 0; let colorType = -1; let sawIdat = false; let sawEnd = false; let transparency = false; const data: Buffer[] = [];
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset); const type = bytes.toString('ascii', offset + 4, offset + 8); const end = offset + 12 + length;
    if (end > bytes.length) throw new Error('PNG chunk is truncated.');
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') { if (length !== 13 || width) throw new Error('PNG header is invalid.'); width = chunk.readUInt32BE(0); height = chunk.readUInt32BE(4); bitDepth = chunk[8]; colorType = chunk[9]; }
    if (type === 'IDAT') { sawIdat = true; data.push(chunk); }
    if (type === 'tRNS') transparency = true;
    if (type === 'IEND') { sawEnd = true; break; }
    offset = end;
  }
  if (!width || !height || !sawIdat || !sawEnd || ![0,2,3,4,6].includes(colorType)) throw new Error('PNG is missing required image data.');
  try {
    const channels = ({0:1,2:3,3:1,4:2,6:4} as Record<number,number>)[colorType];
    const expected = (Math.ceil(width * channels * bitDepth / 8) + 1) * height;
    const raw = inflateSync(Buffer.concat(data), {maxOutputLength: Math.min(expected + 1, 128 * 1024 * 1024)});
    if (raw.length !== expected) throw new Error();
    const rowBytes = Math.ceil(width * channels * bitDepth / 8) + 1;
    for (let y = 0; y < height; y += 1) if (raw[y * rowBytes] > 4) throw new Error();
  } catch { throw new Error('PNG image data is corrupt or unsupported.'); }
  return {width,height,hasAlpha: colorType === 4 || colorType === 6 || transparency,format:'png'};
}
