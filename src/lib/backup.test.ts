import { describe, expect, it } from 'vitest';
import { parseBackup } from './backup';
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
    backup([], 2),
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
