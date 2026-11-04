import { categories, type Artwork } from '../types';
import { isValidDate } from './artworks';

const mimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml'];
function asDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('读取作品失败，请重试。'));
    reader.readAsDataURL(blob);
  });
}
export async function createBackup(artworks: Artwork[]): Promise<Blob> {
  const entries = [];
  for (const art of artworks) entries.push({ ...art, image: await asDataURL(art.image) });
  return new Blob(
    [
      JSON.stringify({
        app: 'art-archive',
        version: 1,
        exportedAt: new Date().toISOString(),
        artworks: entries,
      }),
    ],
    { type: 'application/json' },
  );
}
export function parseBackup(text: string): Artwork[] {
  const invalid = () => new Error('这不是有效的 Art Archive 备份文件，原有作品未更改。');
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw invalid();
  }
  if (
    data?.app !== 'art-archive' ||
    data.version !== 1 ||
    !Array.isArray(data.artworks) ||
    data.artworks.length > 10000
  )
    throw invalid();
  const ids = new Set<string>();
  return data.artworks.map((art: Record<string, unknown>) => {
    if (
      !art ||
      typeof art !== 'object' ||
      typeof art.id !== 'string' ||
      !art.id ||
      art.id.length > 200 ||
      ids.has(art.id) ||
      typeof art.title !== 'string' ||
      !art.title.trim() ||
      art.title.length > 120 ||
      typeof art.date !== 'string' ||
      !isValidDate(art.date) ||
      !categories.includes(art.category as Artwork['category']) ||
      typeof art.medium !== 'string' ||
      art.medium.length > 120 ||
      typeof art.notes !== 'string' ||
      art.notes.length > 5000 ||
      typeof art.image !== 'string' ||
      art.image.length > 30 * 1024 * 1024 ||
      ![art.width, art.height].every(
        (n) => typeof n === 'number' && Number.isInteger(n) && n > 0 && n <= 50000,
      ) ||
      ![art.createdAt, art.updatedAt].every(
        (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0,
      ) ||
      typeof art.isDemo !== 'boolean'
    )
      throw invalid();
    const match = /^data:([^;]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(art.image);
    if (!match || !mimeTypes.includes(match[1]) || !match[2]) throw invalid();
    let binary;
    try {
      binary = atob(match[2]);
    } catch {
      throw invalid();
    }
    if (!binary.length) throw invalid();
    ids.add(art.id);
    // Explicit fields prevent unrelated data from entering the archive.
    return {
      id: art.id,
      title: art.title.trim(),
      date: art.date,
      category: art.category as Artwork['category'],
      medium: art.medium,
      notes: art.notes,
      width: art.width as number,
      height: art.height as number,
      createdAt: art.createdAt as number,
      updatedAt: art.updatedAt as number,
      isDemo: art.isDemo,
      image: new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], { type: match[1] }),
    };
  });
}
export async function readBackup(file: File): Promise<Artwork[]> {
  if (file.size > 200 * 1024 * 1024) throw new Error('备份文件不能超过 200 MB。');
  const artworks = parseBackup(await file.text());
  // Validate actual image data before replacing anything in IndexedDB.
  for (const art of artworks) {
    const url = URL.createObjectURL(art.image);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      art.width = img.naturalWidth;
      art.height = img.naturalHeight;
    } catch {
      throw new Error('备份中有无法读取的图片，原有作品未更改。');
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  return artworks;
}
export function downloadFile(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10000);
}
