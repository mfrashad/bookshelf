'use client';

import { useRef, useState } from 'react';
import type { Book, Shelf } from '@/lib/types';
import { isBanned } from '@/data/banned-books';

// ─── Original colour palette from the pen ────────────────────────────────────
const YELLOW = 'rgba(238,188,31,1)';
const PINK   = 'rgba(255,82,145,1)';
const BLUE   = 'rgba(64,98,187,1)';
const GREEN  = 'rgba(6,141,126,1)';
const WHITE  = 'rgba(248,255,229,1)';

// CSS cascade: later rule wins. Priority matches original nth-child order.
// i is 1-based to mirror CSS nth-child.
function pair(i: number): [string, string] {
  if (i % 9 === 0 || i % 9 === 4) return [WHITE,  GREEN]; // 9n, 9n-5
  if (i % 7 === 0 || i % 7 === 3) return [BLUE,   WHITE]; // 7n, 7n-4
  if (i % 5 === 0)                  return [GREEN,  PINK];  // 5n
  if (i % 2 === 0)                  return [PINK,   BLUE];  // 2n
  return [YELLOW, GREEN];                                    // default (odd)
}

function readable(rgba: string): string {
  const m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return '#000';
  const [r, g, b] = m.slice(1).map(Number);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.52 ? '#1a1a1a' : '#ffffff';
}

// ─── Injected CSS ─────────────────────────────────────────────────────────────
// Mirrors the original pen's grid + pseudo-element rules exactly.
// ::before/::after inherit --ca/--cb from the <li> inline style.
const CSS = `
.bdg {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 200px -40px;
  padding: 0;
  list-style: none;
}
.bdi {
  grid-column-end: span 2;
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  margin-top: -50%;
}
.bdi:nth-child(2n) { grid-column-start: 2; }

/* Diamond face — ::before sits behind book cover via DOM order */
.bdi::before, .bdi::after {
  content: '';
  position: absolute;
  display: block;
  width: 100%;
  height: 100%;
  background-size: 50% 100%, 100% 100%;
  background-position: left, right;
  background-repeat: no-repeat;
}
.bdi::before {
  z-index: 0;
  clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  -webkit-clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
  background-image:
    linear-gradient(-45deg, var(--ca) 53.5%, var(--cb) 53.5%, var(--cb) 60%, var(--ca) 60%),
    linear-gradient( 45deg, var(--ca) 65.3%, var(--cb) 65.3%, var(--cb) 69.9%, var(--ca) 69.9%);
}
/* Bottom-face depth shadow */
.bdi::after {
  clip-path: polygon(100% 50%, 50% 100%, 0 50%, 20% 50%, 50% 80%, 80% 50%);
  -webkit-clip-path: polygon(100% 50%, 50% 100%, 0 50%, 20% 50%, 50% 80%, 80% 50%);
  background-image:
    linear-gradient( 45deg, var(--ca) 40%, var(--cb) 40%),
    linear-gradient(-45deg, var(--ca) 30%, var(--cb) 30%);
}

/* Book cover — exact original img rule */
.bdi-book {
  position: absolute;
  width: 43%;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-60%);
  box-shadow: 5px -5px 10px rgba(0,0,0,0.3);
  transition-property: transform;
  transition-duration: .3s;
  display: block;
  cursor: pointer;
  border: none;
  text-decoration: none;
}
.bdi-book:hover {
  transform: translateX(-40%) translateY(-70%) rotateZ(25deg);
}
/* Fallback card */
.bdi-fallback {
  aspect-ratio: 0.66;
  background: var(--ca);
  color: var(--ct);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 6px;
  gap: 3px;
  overflow: hidden;
  font-family: var(--font-display, sans-serif);
  container-type: inline-size;
}

/* ── Responsive column counts + offset resets ── */
@media (min-width: 450px) {
  .bdg { margin: 190px 40px; }
}
@media (min-width: 600px) {
  .bdg { grid-template-columns: repeat(5, 1fr); }
  .bdi:nth-child(2n)   { grid-column-start: auto; }
  .bdi:nth-child(4n-1) { grid-column-start: 2; }
}
@media (min-width: 900px) {
  .bdg { grid-template-columns: repeat(7, 1fr); }
  .bdi:nth-child(4n-1) { grid-column-start: auto; }
  .bdi:nth-child(6n-2) { grid-column-start: 2; }
}
@media (min-width: 1200px) {
  .bdg { grid-template-columns: repeat(9, 1fr); }
  .bdi:nth-child(6n-2) { grid-column-start: auto; }
  .bdi:nth-child(8n-3) { grid-column-start: 2; }
}
@media (min-width: 1500px) {
  .bdg { grid-template-columns: repeat(11, 1fr); }
  .bdi:nth-child(8n-3)  { grid-column-start: auto; }
  .bdi:nth-child(10n-4) { grid-column-start: 2; }
}
@media (min-width: 1800px) {
  .bdg { grid-template-columns: repeat(13, 1fr); }
  .bdi:nth-child(10n-4) { grid-column-start: auto; }
  .bdi:nth-child(12n-5) { grid-column-start: 2; }
}
@media (min-width: 2100px) {
  .bdg { grid-template-columns: repeat(15, 1fr); }
  .bdi:nth-child(12n-5) { grid-column-start: auto; }
  .bdi:nth-child(14n-6) { grid-column-start: 2; }
}
`;

// ─── Diamond item ─────────────────────────────────────────────────────────────

function Diamond({
  book,
  idx,
  showBanned,
  onBookSelect,
  draggingId,
  draggingBook,
  onReorderBooks,
  onDragStart,
  onDragEnd,
}: {
  book: Book;
  idx: number;
  showBanned: boolean;
  onBookSelect?: (b: Book) => void;
  draggingId?: string | null;
  draggingBook?: Book | null;
  onReorderBooks?: (draggedId: string, targetId: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}) {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const dragEnterCount = useRef(0);
  const [ca, cb] = pair(idx + 1);
  const ct = readable(ca);
  const banned = showBanned && isBanned(book.title);
  const initial = book.title.trim()[0]?.toUpperCase() ?? '?';
  const author  = book.authors?.[0]?.name ?? '';

  return (
    <li
      className="bdi"
      style={{ '--ca': ca, '--cb': cb, '--ct': ct, opacity: draggingId === (book.id as string) ? 0.35 : 1 } as React.CSSProperties}
      title={`${book.title}${author ? ` — ${author}` : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', book.id as string);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(book.id as string);
      }}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={() => {
        if (draggingId && draggingId !== (book.id as string)) {
          dragEnterCount.current++;
          setIsDropTarget(true);
        }
      }}
      onDragLeave={() => {
        dragEnterCount.current = Math.max(0, dragEnterCount.current - 1);
        if (dragEnterCount.current === 0) setIsDropTarget(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragEnterCount.current = 0;
        setIsDropTarget(false);
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== (book.id as string)) onReorderBooks?.(draggedId, book.id as string);
      }}
    >
      {/* ::before (face) and ::after (shadow) are pure CSS — no divs needed */}

      {book.coverProxiedUrl ? (
        <img
          className="bdi-book"
          src={book.coverProxiedUrl}
          alt={book.title}
          crossOrigin="anonymous"
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          onClick={() => onBookSelect?.(book)}
        />
      ) : (
        <div
          className="bdi-book bdi-fallback"
          role="button"
          tabIndex={0}
          onClick={() => onBookSelect?.(book)}
        >
          <span style={{ fontSize: 'clamp(12px, 17cqw, 26px)', fontWeight: 900, lineHeight: 1 }}>
            {initial}
          </span>
          <span style={{
            fontSize: 'clamp(6px, 7cqw, 10px)',
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.3,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as const,
            wordBreak: 'break-word' as const,
          }}>
            {book.title}
          </span>
          {author && (
            <span style={{ fontSize: 'clamp(5px, 5.5cqw, 8px)', opacity: 0.65, textAlign: 'center', lineHeight: 1.2 }}>
              {author}
            </span>
          )}
        </div>
      )}

      {banned && (
        <span style={{
          position: 'absolute',
          top: '12%',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 12,
          zIndex: 20,
          pointerEvents: 'none',
        }}>
          🚫
        </span>
      )}
      {isDropTarget && draggingBook && (draggingBook.id as string) !== (book.id as string) && (
        <div style={{
          position: 'absolute', inset: 0,
          clipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
          WebkitClipPath: 'polygon(50% 0, 100% 50%, 50% 100%, 0 50%)',
          zIndex: 15, pointerEvents: 'none', overflow: 'hidden',
        }}>
          {draggingBook.coverProxiedUrl ? (
            <img src={draggingBook.coverProxiedUrl} alt="" style={{
              position: 'absolute', width: '43%', left: '50%', top: '50%',
              transform: 'translateX(-50%) translateY(-60%)',
              boxShadow: '5px -5px 10px rgba(0,0,0,0.3)',
            }} />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              background: readable(pair(idx + 1)[0]) === '#ffffff' ? '#333' : '#eee',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14cqw', fontWeight: 900,
              color: readable(pair(idx + 1)[0]),
            }}>
              {draggingBook.title.trim()[0]?.toUpperCase()}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface MosaicGridProps {
  shelves: Shelf[];
  showBanned?: boolean;
  onBookSelect?: (book: Book) => void;
  exportMode?: boolean;
  draggingId?: string | null;
  onReorderBooks?: (draggedId: string, targetId: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

export function MosaicGrid({
  shelves,
  showBanned = false,
  onBookSelect,
  exportMode = false,
  draggingId,
  onReorderBooks,
  onDragStart,
  onDragEnd,
}: MosaicGridProps) {
  const allBooks = [...shelves]
    .filter((s) => s.books.length > 0)
    .sort((a, b) => b.title.localeCompare(a.title))
    .flatMap((s) => s.books);

  const draggingBook = draggingId ? (allBooks.find((b) => (b.id as string) === draggingId) ?? null) : null;

  if (allBooks.length === 0) return null;

  return (
    <div
      style={{
        background: '#182028',
        borderRadius: exportMode ? 0 : 8,
        overflowX: 'hidden',
        padding: '0 20px',
        position: 'relative',
        zIndex: 0,
        // position+zIndex creates a local stacking context:
        // position+zIndex creates a local stacking context for correct depth order.
      }}
    >
      <style>{CSS}</style>
      <ul className="bdg" style={exportMode ? { margin: '0 -40px' } : undefined}>
        {allBooks.map((book, i) => (
          <Diamond
            key={book.id as string}
            book={book}
            idx={i}
            showBanned={showBanned}
            onBookSelect={onBookSelect}
            draggingId={draggingId}
            draggingBook={draggingBook}
            onReorderBooks={onReorderBooks}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </ul>
    </div>
  );
}
