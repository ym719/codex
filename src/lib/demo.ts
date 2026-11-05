import type { Artwork } from '../types';

const samples = [
  {
    file: 'tides.svg',
    title: '缓慢的潮汐',
    date: '2026-06-18',
    category: '绘画',
    medium: '布面丙烯 · 色彩习作',
    width: 800,
    height: 980,
    notes: '海并不总是蓝色。试着用灰绿和砂色，留下潮水退去之后的安静。',
  },
  {
    file: 'architecture.svg',
    title: '光经过的地方',
    date: '2026-06-12',
    category: '摄影',
    medium: '建筑摄影 · 构图示意',
    width: 1000,
    height: 760,
    notes: '一扇门后还有一扇门。午后的光线，把普通的建筑变成了一首缓慢的诗。',
  },
  {
    file: 'still-life.svg',
    title: '日常的轮廓',
    date: '2026-06-08',
    category: '速写',
    medium: '纸本铅笔 · 静物练习',
    width: 800,
    height: 1000,
    notes: '桌上的一枝叶子、一只陶瓶。用不那么准确的线条，记录非常真实的此刻。',
  },
  {
    file: 'ochre.svg',
    title: '落日之后',
    date: '2026-05-24',
    category: '绘画',
    medium: '纸本水粉 · 风景习作',
    width: 1000,
    height: 760,
    notes: '赭石、靛蓝，和地平线上最后一点温度。记忆中的风景不需要那么多细节。',
  },
  {
    file: 'light.svg',
    title: '寂静的阶梯',
    date: '2026-05-16',
    category: '摄影',
    medium: '光影摄影 · 构图示意',
    width: 800,
    height: 1000,
    notes: '当光成为主角，空间也有了自己的节奏。停下来，等影子慢慢走过台阶。',
  },
  {
    file: 'garden.svg',
    title: '一座小小的花园',
    date: '2026-04-03',
    category: '绘画',
    medium: '数字拼贴 · 植物研究',
    width: 900,
    height: 1050,
    notes: '把喜欢的绿色收集起来，拼成一座不需要围墙的花园。',
  },
] satisfies {
  file: string;
  title: string;
  date: string;
  category: Artwork['category'];
  medium: string;
  width: number;
  height: number;
  notes: string;
}[];

export async function createDemoArtworks(): Promise<Artwork[]> {
  return Promise.all(
    samples.map(async (sample, i) => {
      const { file, ...fields } = sample;
      const response = await fetch(`${import.meta.env.BASE_URL}artworks/${file}`);
      if (!response.ok) throw new Error('示例作品加载失败，请刷新页面重试。');
      return {
        ...fields,
        id: `sample-${i}`,
        image: await response.blob(),
        isDemo: true,
        favorite: false,
        series: i === 0 || i === 3 ? '风景里的光' : i === 1 || i === 4 ? '城市漫游' : '日常小事',
        tags: i % 2 === 0 ? ['观察', '日常'] : ['光影', '色彩'],
        createdAt: Date.UTC(2026, 5, 20) - i,
        updatedAt: Date.UTC(2026, 5, 20) - i,
      };
    }),
  );
}
