import { NextRequest, NextResponse } from 'next/server';

export type OpenAccessLevel = 'public' | 'borrowable' | 'none';

interface GutendexBook {
  id: number;
  title: string;
}

interface OLSearchDoc {
  ebook_access?: string;
  key?: string;
}

const CACHE_HEADERS = { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' };

async function checkGutenberg(title: string, author?: string): Promise<{ access: OpenAccessLevel; url: string | null }> {
  try {
    const q = author ? `${title} ${author}` : title;
    const res = await fetch(
      `https://gutendex.com/books?search=${encodeURIComponent(q)}&mime_type=text%2Fhtml`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return { access: 'none', url: null };
    const data = await res.json();
    const book: GutendexBook | undefined = data?.results?.[0];
    if (!book) return { access: 'none', url: null };
    return { access: 'public', url: `https://www.gutenberg.org/ebooks/${book.id}` };
  } catch {
    return { access: 'none', url: null };
  }
}

async function queryOpenLibrary(params: string): Promise<{ access: OpenAccessLevel; url: string | null }> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?${params}&fields=ebook_access,key&limit=1`,
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) return { access: 'none', url: null };
    const data = await res.json();
    const doc: OLSearchDoc | undefined = data?.docs?.[0];
    if (!doc) return { access: 'none', url: null };

    const workUrl = doc.key ? `https://openlibrary.org${doc.key}` : null;
    if (doc.ebook_access === 'public') return { access: 'public', url: workUrl };
    if (doc.ebook_access === 'borrowable') return { access: 'borrowable', url: workUrl };
    return { access: 'none', url: null };
  } catch {
    return { access: 'none', url: null };
  }
}

export async function GET(req: NextRequest) {
  const isbn   = req.nextUrl.searchParams.get('isbn')?.trim();
  const title  = req.nextUrl.searchParams.get('title')?.trim();
  const author = req.nextUrl.searchParams.get('author')?.trim();

  // 1. Gutenberg first — if it's there it's definitively public domain
  if (title) {
    const gutenberg = await checkGutenberg(title, author);
    if (gutenberg.access === 'public') {
      return NextResponse.json(gutenberg, { headers: CACHE_HEADERS });
    }
  }

  // 2. Open Library fallback (covers borrowable + public not on Gutenberg)
  if (isbn) {
    const result = await queryOpenLibrary(`isbn=${encodeURIComponent(isbn)}`);
    if (result.access !== 'none') {
      return NextResponse.json(result, { headers: CACHE_HEADERS });
    }
  }

  if (title) {
    const q = author
      ? `q=${encodeURIComponent(`${title} ${author}`)}`
      : `q=${encodeURIComponent(title)}`;
    const result = await queryOpenLibrary(q);
    return NextResponse.json(result, { headers: CACHE_HEADERS });
  }

  return NextResponse.json({ access: 'none', url: null });
}
