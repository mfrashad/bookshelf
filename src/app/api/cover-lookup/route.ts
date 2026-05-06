import { NextRequest, NextResponse } from 'next/server';

// ── Goodreads scrape ──────────────────────────────────────────────────────────

async function scrapeGoodreads(goodreadsId: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(`https://www.goodreads.com/book/show/${goodreadsId}`, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return '';
    const html = await res.text();
    const match =
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ??
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);
    const url = match?.[1] ?? '';
    return url && (url.includes('gr-assets.com') || url.includes('goodreads.com')) ? url : '';
  } catch {
    clearTimeout(timeout);
    return '';
  }
}

// ── Hardcover ISBN lookup ─────────────────────────────────────────────────────

async function hardcoverCover(isbn: string): Promise<string> {
  const apiKey = process.env.HARDCOVER_API_KEY;
  if (!apiKey || !isbn) return '';

  // Try ISBN-13 first, then ISBN-10 (isbn field from CSV may be either)
  const isIsbn13 = isbn.length === 13;
  const isbnField = isIsbn13 ? 'isbn_13' : 'isbn_10';

  const query = `
    query {
      editions(where: { ${isbnField}: { _eq: "${isbn}" } }, limit: 1) {
        image { url }
      }
    }
  `;

  try {
    const res = await fetch('https://api.hardcover.app/v1/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ query }),
      next: { revalidate: 86400 },
    });
    if (!res.ok) return '';
    const data = await res.json();
    const url: string = data?.data?.editions?.[0]?.image?.url ?? '';
    return url;
  } catch {
    return '';
  }
}

// ── route handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const goodreadsId = req.nextUrl.searchParams.get('goodreadsId');
  const isbn = req.nextUrl.searchParams.get('isbn');

  // Goodreads path
  if (goodreadsId) {
    const url = await scrapeGoodreads(goodreadsId);
    const headers = { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' };
    return NextResponse.json({ url }, { headers });
  }

  // Hardcover path (ISBN-based fallback)
  if (isbn) {
    const url = await hardcoverCover(isbn);
    const headers = { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' };
    return NextResponse.json({ url }, { headers });
  }

  return NextResponse.json({ url: '' });
}
