import { expect, it } from 'vitest';
import { parseTags, seriesGroups } from './studio';
import type { Artwork } from '../types';
it('normalizes and limits tags', () => {
  expect(parseTags(' 光影，植物,光影,, 旅行 ')).toEqual(['光影', '植物', '旅行']);
  expect(parseTags(Array.from({ length: 12 }, (_, i) => `tag${i}`).join(','))).toHaveLength(8);
  expect(parseTags('a'.repeat(30))[0]).toHaveLength(24);
  expect(parseTags(`${'a'.repeat(24)}1,${'a'.repeat(24)}2`)).toEqual(['a'.repeat(24)]);
});
it('groups series without putting unassigned legacy artworks into a collection', () => {
  const arts = [
    { id: 'a', series: '夏日' },
    { id: 'b' },
    { id: 'c', series: '夏日' },
    { id: 'd', series: '  ' },
  ] as Artwork[];
  expect(
    seriesGroups(arts).map((group) => ({ name: group.name, ids: group.artworks.map((a) => a.id) })),
  ).toEqual([{ name: '夏日', ids: ['a', 'c'] }]);
});
