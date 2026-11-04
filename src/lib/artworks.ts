import type { Artwork, Category, SortOrder } from '../types';

export function localDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '0001-01-01') return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function displayDate(value: string): string {
  return value.replaceAll('-', '.');
}
export function selectArtworks(
  artworks: Artwork[],
  category: Category | '全部',
  query: string,
  sort: SortOrder,
): Artwork[] {
  const needle = query.trim().toLocaleLowerCase();
  return artworks
    .filter(
      (art) =>
        (category === '全部' || art.category === category) &&
        `${art.title} ${art.medium} ${art.notes}`.toLocaleLowerCase().includes(needle),
    )
    .sort((a, b) =>
      sort === 'added'
        ? b.createdAt - a.createdAt
        : (sort === 'newest' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)) ||
          b.createdAt - a.createdAt,
    );
}
export function countCategories(artworks: Artwork[]): Record<Category, number> {
  return artworks.reduce(
    (counts, art) => {
      counts[art.category]++;
      return counts;
    },
    { 绘画: 0, 摄影: 0, 速写: 0 },
  );
}
export function groupByMonth(artworks: Artwork[]): { month: string; artworks: Artwork[] }[] {
  const groups = new Map<string, Artwork[]>();
  for (const art of [...artworks].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt,
  )) {
    const month = art.date.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), art]);
  }
  return [...groups].map(([month, items]) => ({ month, artworks: items }));
}
