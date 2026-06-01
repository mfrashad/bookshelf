import type { Book, Shelf, VizMode } from './types';

// Compact wire format — shorter keys reduce URL length
export interface EmbedBook {
  t: string;       // title
  a?: string;      // author (first)
  y?: number;      // year
  c?: string;      // coverProxiedUrl
  i?: string;      // isbn
  p?: number;      // pageCount
  r?: number;      // rating (1-5)
}

export interface EmbedPayload {
  books: EmbedBook[];
  viz?: VizMode;
}

export function encodeShelves(shelves: Shelf[], viz?: VizMode): string {
  const books: EmbedBook[] = shelves
    .filter((s) => s.books.length > 0)
    .flatMap((s) =>
      s.books.map((b) => {
        const entry: EmbedBook = { t: b.title };
        if (b.authors?.[0]?.name) entry.a = b.authors[0].name;
        const year = parseInt(s.title, 10);
        if (!isNaN(year)) entry.y = year;
        if (b.coverProxiedUrl) entry.c = b.coverProxiedUrl;
        if (b.isbn) entry.i = b.isbn;
        if (b.pageCount) entry.p = b.pageCount;
        if (b.rating) entry.r = b.rating;
        return entry;
      }),
    );
  const payload: EmbedPayload = { books };
  if (viz) payload.viz = viz;
  return btoa(JSON.stringify(payload));
}

export function decodePayload(data: string): EmbedPayload | null {
  try {
    return JSON.parse(atob(data)) as EmbedPayload;
  } catch {
    return null;
  }
}

export function payloadToShelves(payload: EmbedPayload): Shelf[] {
  const byYear = new Map<string, Book[]>();
  payload.books.forEach((b, i) => {
    const year = String(b.y ?? 'Unknown');
    if (!byYear.has(year)) byYear.set(year, []);
    byYear.get(year)!.push({
      id: `embed-${i}`,
      title: b.t,
      cover: b.c ?? '',
      coverProxiedUrl: b.c,
      pageCount: b.p ?? 0,
      slug: b.t.toLowerCase().replace(/\s+/g, '-'),
      authors: b.a ? [{ name: b.a }] : [],
      isbn: b.i,
      rating: b.r,
    });
  });
  return Array.from(byYear.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([title, books]) => ({ title, books }));
}
