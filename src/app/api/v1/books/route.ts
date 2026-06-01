import { NextRequest, NextResponse } from 'next/server';
import { decodePayload, payloadToShelves } from '@/lib/embed';

export const runtime = 'edge';

export function GET(req: NextRequest) {
  const d = req.nextUrl.searchParams.get('d');
  if (!d) {
    return NextResponse.json(
      { error: 'Missing required parameter: d (base64-encoded library data)' },
      {
        status: 400,
        headers: cors(),
      },
    );
  }

  const payload = decodePayload(d);
  if (!payload) {
    return NextResponse.json(
      { error: 'Invalid data parameter — expected base64-encoded JSON' },
      { status: 400, headers: cors() },
    );
  }

  const shelves = payloadToShelves(payload);
  const books = shelves.flatMap((s) =>
    s.books.map((b) => ({
      title: b.title,
      author: b.authors[0]?.name ?? null,
      year: parseInt(s.title, 10) || null,
      isbn: b.isbn ?? null,
      pageCount: b.pageCount || null,
      rating: b.rating ?? null,
      coverUrl: b.coverProxiedUrl ?? null,
    })),
  );

  return NextResponse.json(
    { count: books.length, books },
    { headers: cors() },
  );
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': 'public, max-age=3600',
  };
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: cors() });
}
