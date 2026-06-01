import { NextRequest, NextResponse } from 'next/server';

export type OpenAccessLevel = 'public' | 'borrowable' | 'none';

interface GutendexAuthor {
  name: string;
  birth_year: number | null;
  death_year: number | null;
}

interface GutendexBook {
  id: number;
  title: string;
  authors: GutendexAuthor[];
}

interface OLSearchDoc {
  ebook_access?: string;
  key?: string;
  title?: string;
  author_name?: string[];
}

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' };

// ─── String helpers ────────────────────────────────────────────────────────────

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function titlesMatch(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return true;
  // Allow one to be a prefix/suffix of the other only if they're very close in length
  const ratio = Math.min(na.length, nb.length) / Math.max(na.length, nb.length);
  return ratio > 0.85 && (na.includes(nb) || nb.includes(na));
}

// Gutenberg stores names as "Last, First" — normalize both sides for comparison
function authorsMatch(gutenbergName: string, searchAuthor: string): boolean {
  const nSearch = norm(searchAuthor);
  const nGuten  = norm(gutenbergName);
  // Direct match
  if (nGuten.includes(nSearch) || nSearch.includes(nGuten)) return true;
  // Flip "Last, First" → "First Last" and retry
  const flipped = norm(gutenbergName.split(',').reverse().join(' '));
  return flipped.includes(nSearch) || nSearch.includes(flipped);
}

// ─── Gutenberg check ───────────────────────────────────────────────────────────

async function checkGutenberg(title: string, author?: string): Promise<{ access: OpenAccessLevel; url: string | null }> {
  try {
    const q = author ? `${title} ${author}` : title;
    const res = await fetch(
      `https://gutendex.com/books?search=${encodeURIComponent(q)}&mime_type=text%2Fhtml`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return { access: 'none', url: null };
    const data = await res.json();
    const results: GutendexBook[] = data?.results ?? [];

    for (const book of results.slice(0, 3)) {
      if (!titlesMatch(book.title, title)) continue;
      // If caller supplied an author, at least one of the book's authors must match
      if (author && !book.authors.some((a) => authorsMatch(a.name, author))) continue;
      return { access: 'public', url: `https://www.gutenberg.org/ebooks/${book.id}` };
    }
    return { access: 'none', url: null };
  } catch {
    return { access: 'none', url: null };
  }
}

// ─── Open Library check ────────────────────────────────────────────────────────

async function queryOpenLibrary(
  params: string,
  verifyTitle?: string,
  verifyAuthor?: string,
): Promise<{ access: OpenAccessLevel; url: string | null }> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?${params}&fields=ebook_access,key,title,author_name&limit=3`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return { access: 'none', url: null };
    const data = await res.json();
    const docs: OLSearchDoc[] = data?.docs ?? [];

    for (const doc of docs) {
      // For text-based searches, verify the returned title matches
      if (verifyTitle && doc.title && !titlesMatch(doc.title, verifyTitle)) continue;
      // If author provided, verify it matches
      if (verifyAuthor && doc.author_name?.length) {
        if (!doc.author_name.some((a) => authorsMatch(a, verifyAuthor))) continue;
      }

      const workUrl = doc.key ? `https://openlibrary.org${doc.key}` : null;
      if (doc.ebook_access === 'public')     return { access: 'public',     url: workUrl };
      if (doc.ebook_access === 'borrowable') return { access: 'borrowable', url: workUrl };
    }
    return { access: 'none', url: null };
  } catch {
    return { access: 'none', url: null };
  }
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const isbn   = req.nextUrl.searchParams.get('isbn')?.trim();
  const title  = req.nextUrl.searchParams.get('title')?.trim();
  const author = req.nextUrl.searchParams.get('author')?.trim() || undefined;

  // 1. Gutenberg — definitively public domain, but verify title+author match
  if (title) {
    const gutenberg = await checkGutenberg(title, author);
    if (gutenberg.access === 'public') {
      return NextResponse.json(gutenberg, { headers: CACHE_HEADERS });
    }
  }

  // 2. Open Library by ISBN (exact — no title verification needed)
  if (isbn) {
    const result = await queryOpenLibrary(`isbn=${encodeURIComponent(isbn)}`);
    if (result.access !== 'none') {
      return NextResponse.json(result, { headers: CACHE_HEADERS });
    }
  }

  // 3. Open Library by title+author text search — verify the result actually matches
  if (title) {
    const q = author
      ? `q=${encodeURIComponent(`${title} ${author}`)}`
      : `q=${encodeURIComponent(title)}`;
    const result = await queryOpenLibrary(q, title, author);
    return NextResponse.json(result, { headers: CACHE_HEADERS });
  }

  return NextResponse.json({ access: 'none', url: null });
}
