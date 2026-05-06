import { NextRequest, NextResponse } from 'next/server';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchGoogleBooks(query: string): Promise<string | null> {
  try {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1&fields=items/volumeInfo/description`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json();
    const raw: string | undefined = data?.items?.[0]?.volumeInfo?.description;
    return raw ? stripHtml(raw) : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const isbn = req.nextUrl.searchParams.get('isbn') ?? '';
  const title = req.nextUrl.searchParams.get('title') ?? '';
  const author = req.nextUrl.searchParams.get('author') ?? '';

  let description: string | null = null;

  if (isbn) description = await fetchGoogleBooks(`isbn:${isbn}`);

  if (!description && title) {
    const q = author ? `intitle:${title} inauthor:${author}` : `intitle:${title}`;
    description = await fetchGoogleBooks(q);
  }

  return NextResponse.json(
    { description },
    { headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' } },
  );
}
