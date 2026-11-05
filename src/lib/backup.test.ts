import { describe, expect, it } from 'vitest';
import { parseBackup, parseArchiveBackup } from './backup';
const artwork = {
  id: 'a',
  title: '作品',
  date: '2024-02-29',
  category: '绘画',
  medium: '油画',
  notes: '测试',
  image: 'data:image/png;base64,aGVsbG8=',
  width: 10,
  height: 10,
  createdAt: 1,
  updatedAt: 2,
  isDemo: false,
};
const backup = (artworks: unknown[] = [artwork], version = 1) =>
  JSON.stringify({ app: 'art-archive', version, artworks });

describe('backup validation', () => {
  it('restores binary image and explicit metadata fields', async () => {
    const parsed = parseBackup(backup([{ ...artwork, unrelated: 'ignored' }]));
    expect(parsed[0].title).toBe('作品');
    expect(parsed[0].image.type).toBe('image/png');
    expect(await parsed[0].image.text()).toBe('hello');
    expect(parsed[0]).not.toHaveProperty('unrelated');
  });
  it('accepts an empty archive', () => {
    expect(parseBackup(backup([]))).toEqual([]);
  });
  it.each([
    'not json',
    '{}',
    'null',
    backup([], 3),
    backup([artwork, artwork]),
    backup([{ ...artwork, date: '2023-02-29' }]),
    backup([{ ...artwork, width: -1 }]),
    backup([{ ...artwork, category: 'bad' }]),
    backup([{ ...artwork, image: 'data:text/html;base64,aGVsbG8=' }]),
    backup([{ ...artwork, image: 'data:image/png;base64,%%%%' }]),
    backup([{ ...artwork, notes: null }]),
    backup([{ ...artwork, title: '' }]),
  ])('rejects malformed backups without partial data: %s', (text) => {
    expect(() => parseBackup(text)).toThrow('有效的 Art Archive 备份文件');
  });
});

describe('expanded archive backups', () => {
  const journal = {
    id: 'note-1',
    title: '光影',
    body: '今天的观察',
    date: '2026-11-05',
    colors: ['#AABBCC'],
    updatedAt: 5,
  };
  it('opens legacy version 1 backups with safe defaults', () => {
    const parsed = parseArchiveBackup(backup());
    expect(parsed.journals).toEqual([]);
    expect(parsed.artworks[0]).toMatchObject({ favorite: false, series: '', tags: [] });
  });
  it('preserves version 2 favorites, series, tags and journal colors', () => {
    const parsed = parseArchiveBackup(
      JSON.stringify({
        app: 'art-archive',
        version: 2,
        artworks: [{ ...artwork, favorite: true, series: '旅行', tags: ['日常'] }],
        journals: [journal],
      }),
    );
    expect(parsed.artworks[0]).toMatchObject({ favorite: true, series: '旅行', tags: ['日常'] });
    expect(parsed.journals).toEqual([journal]);
  });
  it.each([
    undefined,
    [null],
    [journal, journal],
    [{ ...journal, colors: ['javascript:alert(1)'] }],
    [{ ...journal, date: '2026-02-30' }],
  ])('rejects malformed journals before restoration', (journals) => {
    expect(() =>
      parseArchiveBackup(
        JSON.stringify({ app: 'art-archive', version: 2, artworks: [artwork], journals }),
      ),
    ).toThrow('手记数据无效');
  });
  it.each([
    { favorite: 'true' },
    { series: 'a'.repeat(51) },
    { tags: [null] },
    { tags: Array(9).fill('tag') },
  ])('rejects invalid new artwork metadata', (fields) => {
    expect(() => parseBackup(backup([{ ...artwork, ...fields }]))).toThrow();
  });
});
