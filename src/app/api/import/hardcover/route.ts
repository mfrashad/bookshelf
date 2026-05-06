import { NextRequest, NextResponse } from 'next/server';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

const QUERY = `
  query {
    me {
      user_books(where: { status_id: { _eq: 3 } }, order_by: [{ date_added: desc }]) {
        rating
        review
        reviewed_at
        date_added
        book {
          id title slug pages description
          contributions { author { name } }
          cached_contributors
        }
        user_book_reads {
          finished_at
          edition { image { url } cached_contributors }
        }
      }
    }
  }
`;

export async function POST(req: NextRequest) {
  const { apiKey: rawKey } = await req.json();
  if (!rawKey) return NextResponse.json({ error: 'API key required' }, { status: 400 });
  const apiKey = rawKey.trim().replace(/^Bearer\s+/i, '');

  const res = await fetch('https://api.hardcover.app/v1/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ query: QUERY }),
  });

  if (!res.ok) return NextResponse.json({ error: `Hardcover API error: ${res.status}` }, { status: 502 });

  const data = await res.json();
  if (data.errors?.length) return NextResponse.json({ error: 'Invalid API key or no books found' }, { status: 401 });

  const me = data?.data?.me;
  if (!Array.isArray(me) || me.length === 0)
    return NextResponse.json({ error: 'Invalid API key or no books found' }, { status: 401 });

  const userBooks: any[] = me[0]?.user_books ?? [];

  const books = userBooks.map((ub: any) => {
    const dateStr = ub.user_book_reads?.[0]?.finished_at ?? ub.reviewed_at ?? ub.date_added;
    const year = new Date(dateStr).getFullYear();
    const authors: { name: string }[] =
      ub.book.contributions?.length > 0
        ? ub.book.contributions.map((c: any) => ({ name: c.author.name }))
        : Array.isArray(ub.book.cached_contributors)
        ? ub.book.cached_contributors.map((c: any) => ({
            name: typeof c === 'string' ? c : c?.name ?? 'Unknown',
          }))
        : [{ name: 'Unknown' }];
    const cover: string = ub.user_book_reads?.[0]?.edition?.image?.url ?? '';
    return {
      year,
      title: ub.book.title,
      authors,
      pageCount: ub.book.pages || 0,
      cover,
      coverProxiedUrl: cover ? `/api/cover?src=${encodeURIComponent(cover)}` : '',
      slug: ub.book.slug ?? '',
      source: 'hardcover' as const,
      rating: ub.rating != null ? Number(ub.rating) : undefined,
      description: ub.book.description ? stripHtml(ub.book.description) : undefined,
      review: ub.review
        ? {
            id: String(ub.book.id),
            rating: ub.rating ?? 0,
            spoiler: false,
            text: stripHtml(ub.review),
            createdAt: ub.reviewed_at ?? ub.date_added ?? '',
            updatedAt: ub.reviewed_at ?? ub.date_added ?? '',
            tags: [],
          }
        : undefined,
    };
  });

  return NextResponse.json({ books });
}
