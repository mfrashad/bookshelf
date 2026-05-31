import { NextRequest, NextResponse } from 'next/server';

export type OpenAccessLevel = 'public' | 'borrowable' | 'none';

interface OLSearchDoc {
  ebook_access?: string;
  key?: string;
}

async function checkOpenLibrary(isbn: string): Promise<{ access: OpenAccessLevel; url: string | null }> {
  try {
    const url = `https://openlibrary.org/search.json?isbn=${encodeURIComponent(isbn)}&fields=ebook_access,key&limit=1`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return { access: 'none', url: null };
    const data = await res.json();
    const doc: OLSearchDoc | undefined = data?.docs?.[0];
    if (!doc) return { access: 'none', url: null };

    const access = doc.ebook_access;
    const workUrl = doc.key ? `https://openlibrary.org${doc.key}` : null;

    if (access === 'public') return { access: 'public', url: workUrl };
    if (access === 'borrowable') return { access: 'borrowable', url: workUrl };
    return { access: 'none', url: null };
  } catch {
    return { access: 'none', url: null };
  }
}

export async function GET(req: NextRequest) {
  const isbn = req.nextUrl.searchParams.get('isbn')?.trim();
  if (!isbn) {
    return NextResponse.json({ access: 'none', url: null });
  }

  const result = await checkOpenLibrary(isbn);
  return NextResponse.json(result, {
    headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
  });
}
