import type { Artwork, Theme } from '../types';

export const palettes = [
  {
    id: 'garden',
    name: '莫奈的花园',
    english: 'A GARDEN IN THE LIGHT',
    movement: '印象派灵感',
    note: '让光线把颜色轻轻融在一起。',
    colors: ['#768A69', '#A9BDA2', '#D8AFBC', '#E9D69C', '#6A86A0'],
    prompt: '观察窗外十分钟，用五种颜色记录光线的变化。',
  },
  {
    id: 'wild',
    name: '野兽派的午后',
    english: 'COLOUR WITHOUT PERMISSION',
    movement: '野兽派灵感',
    note: '颜色不必真实，感受必须自由。',
    colors: ['#C34534', '#ECA44D', '#E5D599', '#3D6A78', '#4C4C86'],
    prompt: '用一种不属于它的颜色，画出桌上最普通的物品。',
  },
  {
    id: 'water',
    name: '水面上的呼吸',
    english: 'THE WATER REMEMBERS',
    movement: '印象派灵感',
    note: '蓝与绿之间，还有无数次心动。',
    colors: ['#355F78', '#6B9B9B', '#B9C6A4', '#DBD5B1', '#A293B1'],
    prompt: '寻找一处倒影，记录水面或玻璃里不完整的世界。',
  },
  {
    id: 'night',
    name: '夜色有它的声音',
    english: 'WHEN THE WORLD TURNS BLUE',
    movement: '表现性色彩',
    note: '把深蓝留给安静，把金黄留给星星。',
    colors: ['#283754', '#555B8D', '#9C88AA', '#DAA86F', '#EED49E'],
    prompt: '关掉主灯，画下只被一束光照亮的角落。',
  },
  {
    id: 'sun',
    name: '一颗橙色的太阳',
    english: 'A LITTLE MORE SUNSHINE',
    movement: '野兽派灵感',
    note: '温暖不是温度，而是一种笔触。',
    colors: ['#AE4B41', '#DF8152', '#F0B25C', '#F0DBAA', '#6B7963'],
    prompt: '用温暖的色彩重画一段寒冷的记忆。',
  },
  {
    id: 'violet',
    name: '紫罗兰来信',
    english: 'LET THE SOFT THINGS STAY',
    movement: '印象派灵感',
    note: '灰调之中，藏着温柔的张力。',
    colors: ['#626A8A', '#A495B4', '#C6ACBC', '#E6D3BB', '#7A8E75'],
    prompt: '为今天的心情写一句话，再为这句话选三种颜色。',
  },
];
export function seriesGroups(artworks: Artwork[]) {
  const groups = new Map<string, Artwork[]>();
  artworks.forEach((art) => {
    const name = art.series?.trim();
    if (name) groups.set(name, [...(groups.get(name) ?? []), art]);
  });
  return [...groups].map(([name, items]) => ({ name, artworks: items }));
}
export function parseTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(/[,，]/)
        .map((tag) => tag.trim().slice(0, 24))
        .filter(Boolean),
    ),
  ].slice(0, 8);
}
export function getInitialTheme(): Theme {
  try {
    const saved = localStorage.getItem('art-archive-theme');
    if (saved === 'day' || saved === 'night') return saved;
  } catch {
    /* Storage may be unavailable in private mode. */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
}
