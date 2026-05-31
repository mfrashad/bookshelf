import { NextRequest, NextResponse } from 'next/server';

export type OpenAccessLevel = 'public' | 'borrowable' | 'none';

interface OLSearchDoc {
  ebook_access?: string;
  key?: string;
}

async function queryOpenLibrary(params: string): Promise<{ access: OpenAccessLevel; url: string | null }> {
  try {
    const url = `https://openlibrary.org/search.json?${params}&fields=ebook_access,key&limit=1`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
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
  const isbn  = req.nextUrl.searchParams.get('isbn')?.trim();
  const title = req.nextUrl.searchParams.get('title')?.trim();
  const author = req.nextUrl.searchParams.get('author')?.trim();

  if (isbn) {
    const result = await queryOpenLibrary(`isbn=${encodeURIComponent(isbn)}`);
    if (result.access !== 'none') {
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
      });
    }
  }

  if (title) {
    const q = author
      ? `q=${encodeURIComponent(`${title} ${author}`)}`
      : `q=${encodeURIComponent(title)}`;
    const result = await queryOpenLibrary(q);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    });
  }

  return NextResponse.json({ access: 'none', url: null });
}
