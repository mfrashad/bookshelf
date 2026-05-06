import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';

const ALLOWED_HOSTS = [
  'assets.hardcover.app',
  'covers.openlibrary.org',
  'books.google.com',
  'books.googleusercontent.com',
  'i.gr-assets.com',
  'images-na.ssl-images-amazon.com',
  's.gr-assets.com',
  'm.media-amazon.com',
];

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src');
  if (!src) return NextResponse.json({ error: 'Missing src' }, { status: 400 });

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith('.' + h))) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 });
  }

  try {
    const fetchOpts = {
      headers: { 'User-Agent': 'bookshelf-app/1.0' },
      next: { revalidate: 31536000 },
    };

    let upstream = await fetch(src, fetchOpts);

    // Retry once on rate-limit / transient server errors
    if (upstream.status === 503 || upstream.status === 429) {
      await new Promise((r) => setTimeout(r, 600));
      upstream = await fetch(src, fetchOpts);
    }

    if (!upstream.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: upstream.status });
    }

    const body = await upstream.arrayBuffer();

    // Google Books returns a small "no image available" placeholder (~900–1100 bytes)
    // when a book has no real cover scan. Reject it so the client shows the coloured
    // initial placeholder instead. Real covers at zoom=2 are rarely below 1500 bytes.
    if (body.byteLength < 1200) {
      return NextResponse.json({ error: 'Image too small' }, { status: 404 });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/jpeg';
    const etag = `"${createHash('sha1').update(Buffer.from(body)).digest('hex').slice(0, 16)}"`;

    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        ETag: etag,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
  }
}
