'use client';

import { useEffect, useState } from 'react';
import type { OpenAccessLevel } from '@/app/api/open-access/route';
import type { Book } from '@/lib/types';

export interface OpenAccessInfo {
  access: OpenAccessLevel;
  url: string | null;
}

// Module-level cache persists for the page session without hitting the API repeatedly.
const cache = new Map<string, OpenAccessInfo>();
const inFlight = new Set<string>();

export function useOpenAccess(books: Book[]): Map<string, OpenAccessInfo> {
  const [results, setResults] = useState<Map<string, OpenAccessInfo>>(new Map(cache));

  useEffect(() => {
    const candidates = books.filter(
      (b) => b.isbn && !cache.has(b.isbn) && !inFlight.has(b.isbn),
    );
    if (candidates.length === 0) return;

    candidates.forEach((b) => inFlight.add(b.isbn!));

    // Stagger requests to avoid hammering Open Library
    candidates.forEach((b, i) => {
      setTimeout(async () => {
        try {
          const res = await fetch(`/api/open-access?isbn=${encodeURIComponent(b.isbn!)}`);
          const data: OpenAccessInfo = await res.json();
          cache.set(b.isbn!, data);
          inFlight.delete(b.isbn!);
          setResults(new Map(cache));
        } catch {
          inFlight.delete(b.isbn!);
        }
      }, i * 120);
    });
  }, [books]);

  return results;
}

export function getAccessInfo(results: Map<string, OpenAccessInfo>, book: Book): OpenAccessInfo | null {
  if (!book.isbn) return null;
  return results.get(book.isbn) ?? null;
}
