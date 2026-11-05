export const categories = ['绘画', '摄影', '速写'] as const;
export type Category = (typeof categories)[number];
export interface Artwork {
  id: string;
  title: string;
  date: string;
  category: Category;
  medium: string;
  notes: string;
  image: Blob;
  width: number;
  height: number;
  createdAt: number;
  updatedAt: number;
  isDemo: boolean;
  favorite?: boolean;
  series?: string;
  tags?: string[];
}
export type ArtworkInput = Omit<Artwork, 'id' | 'createdAt' | 'updatedAt' | 'isDemo'>;
export type SortOrder = 'newest' | 'oldest' | 'added';
export type Theme = 'day' | 'night';
export type PageView = 'home' | 'collections' | 'archive' | 'colors' | 'journal';
export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  date: string;
  colors: string[];
  updatedAt: number;
}
export interface ArchiveBackup {
  artworks: Artwork[];
  journals: JournalEntry[];
}
