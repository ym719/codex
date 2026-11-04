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
}
export type ArtworkInput = Omit<Artwork, 'id' | 'createdAt' | 'updatedAt' | 'isDemo'>;
export type SortOrder = 'newest' | 'oldest' | 'added';
