import 'fake-indexeddb/auto';
import { expect, it, vi } from 'vitest';
import { deleteArtworks, getArtworks, initializeLibrary, restoreArtworks, saveArtwork } from './db';
import type { Artwork } from '../types';

it('initializes once, persists binary images, edits, deletes, and restores atomically', async () => {
  const artwork: Artwork = {
    id: 'test-art',
    title: '初稿',
    date: '2026-06-10',
    category: '绘画',
    medium: '油画',
    notes: '笔记',
    image: new Blob(['binary-image'], { type: 'image/png' }),
    width: 10,
    height: 10,
    createdAt: 1,
    updatedAt: 1,
    isDemo: true,
  };
  const seed = vi.fn(async () => [artwork]);
  await Promise.all([initializeLibrary(seed), initializeLibrary(seed)]);
  expect(seed).toHaveBeenCalledOnce();
  expect(await getArtworks()).toHaveLength(1);
  expect(await (await getArtworks())[0].image.text()).toBe('binary-image');
  await saveArtwork({ ...artwork, title: '完成稿', isDemo: false, updatedAt: 2 });
  const saved = await getArtworks();
  expect(saved).toHaveLength(1);
  expect(saved[0].title).toBe('完成稿');
  expect(saved[0].isDemo).toBe(false);
  await deleteArtworks([artwork.id]);
  await initializeLibrary(seed);
  expect(await getArtworks()).toEqual([]);
  expect(seed).toHaveBeenCalledOnce();
  await restoreArtworks([artwork, { ...artwork, id: 'second' }]);
  expect(await getArtworks()).toHaveLength(2);
  await restoreArtworks([]);
  expect(await getArtworks()).toEqual([]);
});
