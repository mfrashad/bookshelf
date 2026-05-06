'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import type { Shelf } from '@/lib/types';
import * as ls from '@/lib/local-storage';
import type { StoredBook } from '@/lib/local-storage';

// When NEXT_PUBLIC_CONVEX_URL is set and user is signed in, this hook will be
// extended to sync to Convex (Week 2). For now localStorage is always the source
// of truth, giving guests full functionality and signed-in users the same UX
// (Convex sync layered on top later without changing this interface).

export interface LibraryActions {
  addBook: (book: Omit<StoredBook, 'id' | 'order'>) => void;
  updateBook: (id: string, patch: Partial<Omit<StoredBook, 'id'>>) => void;
  deleteBook: (id: string) => void;
  moveBook: (id: string, toYear: number, toOrder: number) => void;
  clearLibrary: () => void;
}

export interface UseLibraryReturn extends LibraryActions {
  shelves: Shelf[];
  books: StoredBook[];
  isGuest: boolean;
  loaded: boolean;
  bookCount: number;
}

function booksToShelves(books: StoredBook[]): Shelf[] {
  const byYear: Record<number, StoredBook[]> = {};
  for (const b of books) {
    (byYear[b.year] ??= []).push(b);
  }
  return Object.entries(byYear)
    .sort(([a], [b]) => Number(b) - Number(a))
    .map(([year, ys]) => ({
      title: year === '0' ? 'Unknown' : year,
      books: [...ys].sort((a, b) => a.order - b.order),
    }));
}

export function useLibrary(): UseLibraryReturn {
  const { isSignedIn, isLoaded: clerkLoaded } = useUser();
  const [books, setBooks] = useState<StoredBook[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBooks(ls.loadBooks());
    setLoaded(true);
  }, []);

  // Show as guest until Clerk confirms sign-in. !undefined = true when Clerk hasn't loaded yet.
  const isGuest = !isSignedIn;

  const addBook = useCallback((book: Omit<StoredBook, 'id' | 'order'>) => {
    setBooks(ls.addBook(book));
  }, []);

  const updateBook = useCallback((id: string, patch: Partial<Omit<StoredBook, 'id'>>) => {
    setBooks(ls.updateBook(id, patch));
  }, []);

  const deleteBook = useCallback((id: string) => {
    setBooks(ls.deleteBook(id));
  }, []);

  const moveBook = useCallback((id: string, toYear: number, toOrder: number) => {
    setBooks(ls.moveBook(id, toYear, toOrder));
  }, []);

  const clearLibrary = useCallback(() => {
    ls.clearBooks();
    setBooks([]);
  }, []);

  const shelves = useMemo(() => booksToShelves(books), [books]);

  return {
    shelves,
    books,
    isGuest,
    loaded,
    bookCount: books.length,
    addBook,
    updateBook,
    deleteBook,
    moveBook,
    clearLibrary,
  };
}
