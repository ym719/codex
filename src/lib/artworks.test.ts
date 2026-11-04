import { describe, expect, it } from 'vitest';
import { countCategories, groupByMonth, isValidDate, selectArtworks } from './artworks';
import type { Artwork } from '../types';

const art = (fields: Partial<Artwork>): Artwork => ({
  id: 'a',
  title: '海边',
  date: '2026-06-12',
  category: '绘画',
  medium: '布面油画',
  notes: '蓝色潮汐',
  image: new Blob(['image']),
  width: 800,
  height: 600,
  createdAt: 1,
  updatedAt: 1,
  isDemo: false,
  ...fields,
});
const artworks = [
  art({}),
  art({ id: 'b', title: '光影', category: '摄影', date: '2025-11-03', createdAt: 3 }),
  art({
    id: 'c',
    title: 'Still life',
    category: '速写',
    medium: 'PENCIL',
    date: '2026-06-18',
    createdAt: 2,
  }),
];

describe('collection filtering and chronology', () => {
  it('counts every category including empty categories', () => {
    expect(countCategories(artworks)).toEqual({ 绘画: 1, 摄影: 1, 速写: 1 });
    expect(countCategories([])).toEqual({ 绘画: 0, 摄影: 0, 速写: 0 });
  });
  it('combines category and case-insensitive search across metadata', () => {
    expect(selectArtworks(artworks, '速写', ' pencil ', 'newest').map((a) => a.id)).toEqual(['c']);
    expect(selectArtworks(artworks, '摄影', '蓝色', 'newest').map((a) => a.id)).toEqual(['b']);
    expect(selectArtworks(artworks, '绘画', 'Still', 'newest')).toEqual([]);
  });
  it('sorts by creation date in both directions or insertion date without mutating input', () => {
    expect(selectArtworks(artworks, '全部', '', 'newest').map((a) => a.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
    expect(selectArtworks(artworks, '全部', '', 'oldest').map((a) => a.id)).toEqual([
      'b',
      'a',
      'c',
    ]);
    expect(selectArtworks(artworks, '全部', '', 'added').map((a) => a.id)).toEqual(['b', 'c', 'a']);
    expect(artworks.map((a) => a.id)).toEqual(['a', 'b', 'c']);
  });
  it('groups by year and month and keeps newest works first', () => {
    expect(groupByMonth(artworks).map((g) => [g.month, g.artworks.map((a) => a.id)])).toEqual([
      ['2026-06', ['c', 'a']],
      ['2025-11', ['b']],
    ]);
  });
  it.each(['2024-02-29', '2026-11-04', '0001-01-01', '9999-12-31'])(
    'accepts valid calendar date %s',
    (value) => {
      expect(isValidDate(value)).toBe(true);
    },
  );
  it.each(['2025-02-29', '2026-02-30', '2026-13-01', '2026-6-3', '', '0000-01-01'])(
    'rejects invalid calendar date %s',
    (value) => {
      expect(isValidDate(value)).toBe(false);
    },
  );
});
