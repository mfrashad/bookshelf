'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Papa from 'papaparse';
import { bulkAddBooks } from '@/lib/local-storage';

const CONCURRENCY = 4;

// ── server-side lookup helper ─────────────────────────────────────────────────

async function serverLookup(params: Record<string, string>): Promise<string> {
  try {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`/api/cover-lookup?${qs}`);
    if (!res.ok) return '';
    const data = await res.json();
    const raw: string = data.url ?? '';
    if (!raw) return '';
    return `/api/cover?src=${encodeURIComponent(raw)}`;
  } catch {
    return '';
  }
}

// ── source 1: Goodreads (server-side scrape) ─────────────────────────────────

async function goodreadsQuery(goodreadsId: string): Promise<string> {
  if (!goodreadsId) return '';
  return serverLookup({ goodreadsId });
}

// ── source 2: Open Library (by ISBN) ─────────────────────────────────────────

async function openLibraryQuery(isbn: string): Promise<string> {
  if (!isbn) return '';
  const src = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  const proxyUrl = `/api/cover?src=${encodeURIComponent(src)}`;
  try {
    // A real fetch through the proxy validates size and availability
    const res = await fetch(proxyUrl);
    return res.ok ? proxyUrl : '';
  } catch {
    return '';
  }
}

// ── source 3: Google Books ────────────────────────────────────────────────────

async function googleBooksQuery(query: string): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1&fields=items/volumeInfo/imageLinks`,
  );
  if (!res.ok) return '';
  const data = await res.json();
  const raw: string | undefined = data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;
  if (!raw) return '';
  const src = raw.replace(/^http:/, 'https:').replace('zoom=1', 'zoom=2');
  return `/api/cover?src=${encodeURIComponent(src)}`;
}

// ── priority chain ────────────────────────────────────────────────────────────

async function fetchCoverUrl(
  isbn: string,
  title: string,
  author: string,
  goodreadsId: string,
): Promise<string> {
  try {
    // 1. Goodreads
    if (goodreadsId) {
      const url = await goodreadsQuery(goodreadsId);
      if (url) return url;
    }

    // 2. Open Library
    if (isbn) {
      const url = await openLibraryQuery(isbn);
      if (url) return url;
    }

    // 3. Google Books — ISBN first, title+author fallback
    if (isbn) {
      const url = await googleBooksQuery(`isbn:${isbn}`);
      if (url) return url;
    }
    const gbUrl = await googleBooksQuery(
      `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`,
    );
    if (gbUrl) return gbUrl;

    // 4. Hardcover (server-side, uses default API key, ISBN only)
    if (isbn) {
      const url = await serverLookup({ isbn });
      if (url) return url;
    }

    return '';
  } catch {
    return '';
  }
}

async function enrichCovers(
  books: { isbn: string; title: string; author: string; goodreadsId: string }[],
  onProgress: (done: number) => void,
): Promise<string[]> {
  const results: string[] = new Array(books.length).fill('');
  let done = 0;

  for (let i = 0; i < books.length; i += CONCURRENCY) {
    const batch = books.slice(i, i + CONCURRENCY);
    const urls = await Promise.all(
      batch.map((b) => fetchCoverUrl(b.isbn, b.title, b.author, b.goodreadsId)),
    );
    urls.forEach((url, j) => {
      results[i + j] = url;
    });
    done += batch.length;
    onProgress(Math.min(done, books.length));
  }

  return results;
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function ImportGoodreadsPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<'idle' | 'fetching' | 'done' | 'error'>('idle');
  const [importCount, setImportCount] = useState(0);
  const [coverProgress, setCoverProgress] = useState({ done: 0, total: 0 });
  const [errorMsg, setErrorMsg] = useState('');

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      async complete(results) {
        const readRows = results.data.filter((row) => row['Exclusive Shelf'] === 'read');

        if (readRows.length === 0) {
          setErrorMsg("No 'read' books found in this CSV");
          setStatus('error');
          return;
        }

        const parsed = readRows.map((row) => {
          const dateStr = row['Date Read'] || row['Date Added'] || '';
          const year = parseInt(dateStr.slice(0, 4), 10) || 0;
          const isbn = (row['ISBN'] || '').replace(/^="?(.*?)"?$/, '$1');
          const isbn13 = (row['ISBN13'] || '').replace(/^="?(.*?)"?$/, '$1');
          const rawRating = parseInt(row['My Rating'] || '0', 10);
          const reviewText = (row['My Review'] || '').trim();
          return {
            year,
            title: row['Title'] || 'Unknown Title',
            author: row['Author'] || 'Unknown',
            authors: [{ name: row['Author'] || 'Unknown' }],
            pageCount: parseInt(row['Number of Pages'], 10) || 0,
            isbn: isbn13 || isbn,
            goodreadsId: row['Book Id'] || '',
            rating: rawRating > 0 ? rawRating : undefined,
            reviewText: reviewText || undefined,
            dateStr,
          };
        });

        setStatus('fetching');
        setImportCount(parsed.length);
        setCoverProgress({ done: 0, total: parsed.length });

        const coverUrls = await enrichCovers(
          parsed.map((b) => ({ isbn: b.isbn, title: b.title, author: b.author, goodreadsId: b.goodreadsId })),
          (done) => setCoverProgress({ done, total: parsed.length }),
        );

        const books = parsed.map((b, i) => ({
          year: b.year,
          title: b.title,
          authors: b.authors,
          pageCount: b.pageCount,
          cover: '',
          coverProxiedUrl: coverUrls[i] || '',
          isbn: b.isbn || undefined,
          slug: '',
          source: 'goodreads' as const,
          rating: b.rating,
          review: b.reviewText
            ? {
                id: b.goodreadsId,
                rating: b.rating ?? 0,
                spoiler: false,
                text: b.reviewText,
                createdAt: b.dateStr,
                updatedAt: b.dateStr,
                tags: [] as unknown[],
              }
            : undefined,
        }));

        bulkAddBooks(books);
        setStatus('done');
        setTimeout(() => router.push('/library'), 1200);
      },
    });
  }

  return (
    <main style={{ background: '#fff', minHeight: '100vh', padding: '64px 24px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Link href="/onboarding" style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#666', textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← Back
        </Link>

        <div style={{ background: '#fff200', border: '2px solid #000', padding: '6px 14px', display: 'inline-block', marginBottom: 16, boxShadow: '3px 3px 0px #000' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Goodreads</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(30px, 5vw, 44px)', color: '#000', lineHeight: 1.05, marginBottom: 12 }}>
          Import from Goodreads
        </h1>
        <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 17, color: '#000', marginBottom: 36, lineHeight: 1.5 }}>
          Upload your Goodreads export CSV to import your reading history.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="goodreads-csv-input" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#000', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Goodreads CSV export
            </label>
            <input
              id="goodreads-csv-input"
              ref={fileRef}
              type="file"
              accept=".csv"
              className="w-full text-sm text-stone-700 file:mr-4 file:border-2 file:border-black file:border-solid file:bg-wbd-light file:px-4 file:py-2 file:text-sm file:font-bold file:text-black hover:file:bg-wbd-yellow file:cursor-pointer file:rounded-none"
            />
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#666', marginTop: 6 }}>
              Export from{' '}
              <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'underline' }}>
                goodreads.com/review/import
              </a>
            </p>
          </div>

          {status === 'fetching' && (
            <div style={{ border: '2px solid #000', background: '#94e8ff', padding: '16px 20px' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#000', marginBottom: 8 }}>Fetching book covers…</p>
              <div style={{ width: '100%', background: '#fff', border: '1px solid #000', height: 8 }}>
                <div style={{ background: '#000', height: '100%', transition: 'width 0.3s', width: `${coverProgress.total ? (coverProgress.done / coverProgress.total) * 100 : 0}%` }} />
              </div>
              <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#000', marginTop: 6 }}>{coverProgress.done} / {coverProgress.total}</p>
            </div>
          )}

          {status === 'done' && (
            <p style={{ border: '2px solid #000', background: '#6ff5b6', padding: '12px 14px', fontSize: 14, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              ✓ Imported {importCount} books — redirecting to library…
            </p>
          )}
          {status === 'error' && (
            <p style={{ border: '2px solid #000', background: '#ffc0a1', padding: '12px 14px', fontSize: 14, fontFamily: 'var(--font-geist, sans-serif)' }}>{errorMsg}</p>
          )}

          <button
            onClick={handleImport}
            disabled={status === 'fetching' || status === 'done'}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, background: '#fff200', color: '#000', border: '2px solid #000', borderRadius: 0, padding: '14px 28px', width: '100%', cursor: 'pointer', boxShadow: '4px 4px 0px #000', opacity: (status === 'fetching' || status === 'done') ? 0.5 : 1, transition: 'opacity 0.15s' }}
          >
            {status === 'fetching' ? 'Importing…' : 'Import books'}
          </button>
        </div>
      </div>
    </main>
  );
}
