'use client';

import { useState } from 'react';
import { Star, StarHalf } from '@phosphor-icons/react';
import type { Book } from '@/lib/types';
import './book-item.css';

interface BookItemProps {
  book: Book;
  onSelect?: (book: Book) => void;
  exportMode?: boolean;
}

const BookItem: React.FC<BookItemProps> = ({ book, onSelect, exportMode = false }) => {
  const [open, setOpen] = useState(false);
  const coverSrc = book.coverProxiedUrl ?? book.cover;

  return (
    <div className="h-full w-full">
      <div
        role={exportMode ? undefined : 'button'}
        tabIndex={exportMode ? undefined : 0}
        aria-label={exportMode ? undefined : `View details for ${book.title}`}
        onClick={() => !exportMode && (onSelect ? onSelect(book) : setOpen(true))}
        onKeyDown={(e) => {
          if (!exportMode && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onSelect ? onSelect(book) : setOpen(true);
          }
        }}
        className={`book-item relative flex w-full flex-col items-center rounded-lg bg-stone-100 px-4 py-20 ${exportMode ? '' : 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400'}`}
      >
        {book.currentlyReading && (
          <span className="absolute -right-3 -top-3 rounded-full bg-amber-400 px-2 py-1 text-[10px] font-semibold text-amber-900 rotate-12">
            reading
          </span>
        )}
        <div className="book self-center">
          <div className="book-cover">
            <img
              src={coverSrc}
              alt={book.title}
              loading={exportMode ? 'eager' : 'lazy'}
              crossOrigin="anonymous"
              className="book-cover-img"
            />
            <div className="effect" />
            <div className="light" />
          </div>
          <div className="book-inside" />
        </div>
      </div>

      <div className="mt-2 text-xs">
        <p className="font-semibold text-stone-900 leading-tight">{book.title}</p>
        <p className="text-stone-500">{book.authors.map((a) => a.name).join(', ')}</p>
        {book.rating != null && book.rating > 0 && (
          <p className="mt-1 flex">
            {[...Array(Math.floor(book.rating))].map((_, i) => (
              <Star key={i} size={14} weight="fill" className="text-stone-600" />
            ))}
            {book.rating % 1 !== 0 && <StarHalf size={14} weight="fill" className="text-stone-600" />}
            {[...Array(5 - Math.floor(book.rating) - (book.rating % 1 !== 0 ? 1 : 0))].map((_, i) => (
              <Star key={`e-${i}`} size={14} weight="regular" className="text-stone-400" />
            ))}
          </p>
        )}
      </div>
    </div>
  );
};

export default BookItem;
