import type { Book, Author, BookReview } from './types';

const KEY = 'book-poster:books';

export interface StoredBook {
  id: string;
  year: number;
  order: number;
  title: string;
  authors: Author[];
  pageCount: number;
  cover: string;
  coverProxiedUrl?: string;
  isbn?: string;
  rating?: number;
  review?: BookReview | null;
  description?: string;
  tags?: string[];
  slug: string;
  source: Book['source'];
}

function read(): StoredBook[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as StoredBook[]) : [];
  } catch {
    return [];
  }
}

function write(books: StoredBook[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEY, JSON.stringify(books));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function loadBooks(): StoredBook[] {
  return read();
}

export function addBook(book: Omit<StoredBook, 'id' | 'order'>): StoredBook[] {
  const books = read();
  const maxOrder = books.filter((b) => b.year === book.year).reduce((m, b) => Math.max(m, b.order), -1);
  const next = [...books, { ...book, id: generateId(), order: maxOrder + 1 }];
  write(next);
  return next;
}

export function updateBook(id: string, patch: Partial<Omit<StoredBook, 'id'>>): StoredBook[] {
  const next = read().map((b) => (b.id === id ? { ...b, ...patch } : b));
  write(next);
  return next;
}

export function deleteBook(id: string): StoredBook[] {
  const next = read().filter((b) => b.id !== id);
  write(next);
  return next;
}

export function moveBook(id: string, toYear: number, toOrder: number): StoredBook[] {
  const next = read().map((b) => (b.id === id ? { ...b, year: toYear, order: toOrder } : b));
  write(next);
  return next;
}

function bookKey(b: { isbn?: string; title: string; authors: Author[] }): string {
  return b.isbn
    ? `isbn:${b.isbn}`
    : `title:${b.title.toLowerCase()}|author:${b.authors[0]?.name?.toLowerCase() ?? ''}`;
}

export function bulkAddBooks(incoming: Omit<StoredBook, 'id' | 'order'>[]): StoredBook[] {
  const books = read();

  // Build key → existing book id map
  const existingById = new Map<string, string>(books.map((b) => [bookKey(b), b.id]));

  const enrichmentUpdates = new Map<string, Partial<StoredBook>>();
  const toAdd: Omit<StoredBook, 'id' | 'order'>[] = [];
  const seenKeys = new Set<string>();

  for (const b of incoming) {
    const key = bookKey(b);
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const existingId = existingById.get(key);
    if (existingId) {
      // Upsert enrichment-only fields — never overwrite year/order the user may have edited
      const patch: Partial<StoredBook> = {};
      if (b.rating != null) patch.rating = b.rating;
      if (b.review) patch.review = b.review;
      if (b.description) patch.description = b.description;
      if (Object.keys(patch).length > 0) enrichmentUpdates.set(existingId, patch);
    } else {
      toAdd.push(b);
    }
  }

  const maxByYear: Record<number, number> = {};
  for (const b of books) {
    maxByYear[b.year] = Math.max(maxByYear[b.year] ?? -1, b.order);
  }

  const newBooks: StoredBook[] = toAdd.map((b) => {
    const order = (maxByYear[b.year] ?? -1) + 1;
    maxByYear[b.year] = order;
    return { ...b, id: generateId(), order };
  });

  const next = [
    ...books.map((b) => {
      const patch = enrichmentUpdates.get(b.id);
      return patch ? { ...b, ...patch } : b;
    }),
    ...newBooks,
  ];
  write(next);
  return next;
}

export function clearBooks(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEY);
}
