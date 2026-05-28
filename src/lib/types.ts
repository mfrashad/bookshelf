export interface Author {
  name: string;
}

export interface BookReview {
  id: string;
  rating: number;
  spoiler: boolean;
  text: string;
  createdAt: string;
  updatedAt: string;
  tags: unknown[];
}

export interface Book {
  id: string;
  title: string;
  cover: string;
  coverProxiedUrl?: string;
  pageCount: number;
  slug: string;
  authors: Author[];
  currentlyReading?: boolean;
  description?: string;
  tags?: string[];
  review?: BookReview | null;
  isbn?: string;
  rating?: number;
  source?: 'hardcover' | 'goodreads' | 'manual' | 'openlibrary';
}

export interface Shelf {
  title: string; // year as string, e.g. "2024", or "Unknown"
  books: Book[];
}

export type AspectRatio = 'square' | 'story' | 'wide' | 'portrait';

export const ASPECT_RATIO_DIMS: Record<AspectRatio, { width: number; height: number; label: string }> = {
  square:   { width: 1080, height: 1080, label: 'Square (1:1)' },
  story:    { width: 1080, height: 1920, label: 'Story (9:16)' },
  wide:     { width: 1600, height:  900, label: 'Wide (16:9)' },
  portrait: { width: 1080, height: 1350, label: 'Portrait (4:5)' },
};

export type VizMode = 'stack' | 'shelf' | 'grid' | 'wall' | 'mosaic' | 'pixel' | 'scatter' | 'turntable';
