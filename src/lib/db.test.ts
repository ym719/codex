import 'fake-indexeddb/auto';
import { expect, it, vi } from 'vitest';
import {
  deleteArtworks,
  getArtworks,
  initializeLibrary,
  restoreArtworks,
  saveArtwork,
  getJournals,
  updateJournal,
  toggleArtworkFavorite,
  assignSeries,
  removeSeries,
} from './db';
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
  await toggleArtworkFavorite('test-art');
  await assignSeries(['test-art'], '观察');
  expect((await getArtworks()).find((art) => art.id === 'test-art')).toMatchObject({
    favorite: true,
    series: '观察',
    isDemo: false,
  });
  await removeSeries('观察');
  expect((await getArtworks()).find((art) => art.id === 'test-art')?.series).toBe('');
  const journal = {
    id: 'j',
    title: '灵感',
    body: '内容',
    date: '2026-11-05',
    colors: ['#112233'],
    updatedAt: 1,
  };
  await Promise.all([updateJournal(journal, 'j'), updateJournal({ ...journal, id: 'j2' }, 'j2')]);
  expect(await getJournals()).toHaveLength(2);
  await updateJournal({ ...journal, title: '修改' }, 'j');
  expect((await getJournals()).find((note) => note.id === 'j')?.title).toBe('修改');
  await updateJournal(null, 'j2');
  expect(await getJournals()).toHaveLength(1);
  await restoreArtworks([artwork], [{ ...journal, id: 'restored' }]);
  expect((await getJournals())[0].id).toBe('restored');
  expect(await getArtworks()).toHaveLength(1);
  await restoreArtworks([], []);
  expect(await getJournals()).toEqual([]);
  expect(await getArtworks()).toEqual([]);
});
