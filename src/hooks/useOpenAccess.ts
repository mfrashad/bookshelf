'use client';

import { useEffect, useState } from 'react';
import type { OpenAccessLevel } from '@/app/api/open-access/route';
import type { Book } from '@/lib/types';

export interface OpenAccessInfo {
  access: OpenAccessLevel;
  url: string | null;
}

// Stable key per book: isbn takes priority, fall back to title+author.
function bookKey(book: Book): string {
  return book.isbn || `title:${book.title}__${book.authors?.[0]?.name ?? ''}`;
}

// Module-level cache persists for the page session without hitting the API repeatedly.
const cache = new Map<string, OpenAccessInfo>();
const inFlight = new Set<string>();

export function useOpenAccess(books: Book[]): Map<string, OpenAccessInfo> {
  const [results, setResults] = useState<Map<string, OpenAccessInfo>>(new Map(cache));

  useEffect(() => {
    const candidates = books.filter((b) => {
      const key = bookKey(b);
      return !cache.has(key) && !inFlight.has(key);
    });
    if (candidates.length === 0) return;

    candidates.forEach((b) => inFlight.add(bookKey(b)));

    // Stagger requests to avoid hammering Open Library
    candidates.forEach((b, i) => {
      setTimeout(async () => {
        const key = bookKey(b);
        try {
          const params = new URLSearchParams();
          if (b.isbn) params.set('isbn', b.isbn);
          params.set('title', b.title);
          if (b.authors?.[0]?.name) params.set('author', b.authors[0].name);

          const res = await fetch(`/api/open-access?${params}`);
          const data: OpenAccessInfo = await res.json();
          cache.set(key, data);
          inFlight.delete(key);
          setResults(new Map(cache));
        } catch {
          inFlight.delete(key);
        }
      }, i * 150);
    });
  }, [books]);

  return results;
}

export function getAccessInfo(results: Map<string, OpenAccessInfo>, book: Book): OpenAccessInfo | null {
  return results.get(bookKey(book)) ?? null;
}
