'use client';

import { useMemo, useRef, useState } from 'react';
import type { Book, Shelf } from '@/lib/types';
import { hashColor, spineTextColor, cleanTitle } from '@/lib/spine';
import { isBanned } from '@/data/banned-books';
import { useOpenAccess, getAccessInfo, type OpenAccessInfo } from '@/hooks/useOpenAccess';
import { BannedBadge, OpenAccessBadge } from './BookBadges';

// ─── Layout constants ─────────────────────────────────────────────────────────
const COVER_W    = 96;
const COVER_H    = 148;
const DEPTH      = 22;   // book thickness (fore-edge visible width)
const BOOK_GAP   = 8;
const PER_ROW    = 7;
const SHELF_TOP  = 22;   // plank thickness
const SHELF_BTM  = 7;    // darker underside
const ROW_GAP    = 44;   // vertical space between shelf rows

// ─── Palette ──────────────────────────────────────────────────────────────────
const WALL    = '#12101c';
const WOOD_A  = '#c8922a';
const WOOD_B  = '#a06c18';
const WOOD_C  = '#7a5010';
const BRACKET = '#6a6a72';

// ─── Book3D ───────────────────────────────────────────────────────────────────

function Book3D({
  book,
  showBanned,
  showOpenAccess,
  accessInfo,
  onBookSelect,
  draggingId,
  draggingBook,
  onReorderBooks,
  onDragStart,
  onDragEnd,
}: {
  book: Book;
  showBanned: boolean;
  showOpenAccess: boolean;
  accessInfo?: OpenAccessInfo | null;
  onBookSelect?: (b: Book) => void;
  draggingId?: string | null;
  draggingBook?: Book | null;
  onReorderBooks?: (draggedId: string, targetId: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const dragEnterCount = useRef(0);

  const banned   = showBanned && isBanned(book.title);
  const color    = hashColor(book.title);
  const fg       = spineTextColor(color);
  const initial  = book.title.trim()[0]?.toUpperCase() ?? '?';
  const title    = cleanTitle(book.title);

  // Spine colour = darkened cover
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const spineColor = `rgb(${Math.round(r * 0.55)},${Math.round(g * 0.55)},${Math.round(b * 0.55)})`;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={book.title}
      title={`${book.title}${book.authors?.[0]?.name ? ` — ${book.authors[0].name}` : ''}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', book.id as string);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(book.id as string);
      }}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
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
      style={{
        flexShrink: 0,
        width: COVER_W + DEPTH,
        height: COVER_H,
        position: 'relative',
        cursor: 'grab',
        opacity: draggingId === (book.id as string) ? 0.35 : 1,
        transition: 'opacity 0.15s',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onBookSelect?.(book)}
    >
      {/* ── 3-D wrapper ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: COVER_W,
          height: COVER_H,
          transformStyle: 'preserve-3d',
          transform: hovered
            ? 'perspective(900px) rotateY(0deg) translateY(-14px) translateZ(24px)'
            : 'perspective(900px) rotateY(-28deg)',
          transition: 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        {/* ── Front cover ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            borderRadius: '2px 3px 3px 2px',
            boxShadow: hovered
              ? '0 24px 56px rgba(0,0,0,0.8), 6px 0 14px rgba(0,0,0,0.45)'
              : '0 10px 28px rgba(0,0,0,0.65), 5px 0 10px rgba(0,0,0,0.35)',
            transition: 'box-shadow 0.38s ease',
          }}
        >
          {/* Colour fallback */}
          <div
            style={{
              position: 'absolute', inset: 0,
              background: color, color: fg,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 8px', gap: 4,
            }}
          >
            <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{initial}</span>
            <span style={{
              fontSize: 8.5, fontWeight: 600, opacity: 0.88,
              textAlign: 'center', lineHeight: 1.35,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as const,
              wordBreak: 'break-word' as const,
            }}>
              {title}
            </span>
            {book.authors?.[0]?.name && (
              <span style={{ fontSize: 7.5, opacity: 0.6, textAlign: 'center' }}>
                {book.authors[0].name}
              </span>
            )}
          </div>

          {/* Cover image */}
          {book.coverProxiedUrl && (
            <img
              src={book.coverProxiedUrl}
              alt={book.title}
              crossOrigin="anonymous"
              loading="lazy"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}

          {/* Top-left gloss highlight → bottom-right shadow */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 42%, rgba(0,0,0,0.28) 100%)',
          }} />

          {/* Left binding crease shadow */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 8, pointerEvents: 'none',
            background: 'linear-gradient(to right, rgba(0,0,0,0.45), transparent)',
          }} />

          {/* Spine line */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, pointerEvents: 'none',
            background: spineColor,
          }} />

          {banned && <BannedBadge title={book.title} />}
          {showOpenAccess && accessInfo?.access === 'public' && (
            <OpenAccessBadge info={accessInfo} isbn={book.isbn} />
          )}
          {isDropTarget && draggingBook && (draggingBook.id as string) !== (book.id as string) && (
            <>
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: hashColor(draggingBook.title) }} />
              {draggingBook.coverProxiedUrl && (
                <img src={draggingBook.coverProxiedUrl} alt="" style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none',
                }} />
              )}
              <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.16) 0%, transparent 42%, rgba(0,0,0,0.28) 100%)',
              }} />
            </>
          )}
        </div>

        {/* ── Right face: pages / fore-edge ── */}
        {/* Placed at the right edge of cover, then rotated 90° inward around left edge */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: -DEPTH,
            width: DEPTH,
            height: COVER_H,
            transformOrigin: 'left center',
            transform: 'rotateY(90deg)',
            borderRadius: '0 2px 2px 0',
            overflow: 'hidden',
            /* Cream page stack with thin lines */
            background: `repeating-linear-gradient(
              to bottom,
              #f5f1e8 0px,
              #f5f1e8 1.5px,
              #e6e0d2 1.5px,
              #e6e0d2 3px
            )`,
          }}
        >
          {/* Edge lighting */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, transparent 35%, rgba(0,0,0,0.08) 100%)',
          }} />
        </div>
      </div>

      {/* ── Shelf shadow (lives outside 3-D context) ── */}
      <div style={{
        position: 'absolute',
        bottom: -16,
        left: '6%',
        width: '82%',
        height: 16,
        background: 'radial-gradient(ellipse at 40% 0%, rgba(0,0,0,0.55) 0%, transparent 72%)',
        filter: 'blur(5px)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─── L-bracket ────────────────────────────────────────────────────────────────

function Bracket({ side }: { side: 'left' | 'right' }) {
  const v = 44; // vertical arm height
  const h = 40; // horizontal arm width
  const t = 9;  // arm thickness

  const sharedStyle: React.CSSProperties = {
    background: `linear-gradient(to bottom, #888, ${BRACKET} 40%, #555)`,
    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
    borderRadius: 2,
  };

  return (
    <div style={{ position: 'absolute', bottom: SHELF_TOP + SHELF_BTM, [side]: 18 }}>
      {/* Vertical arm */}
      <div style={{ ...sharedStyle, width: t, height: v, background: `linear-gradient(to right, #999, ${BRACKET} 50%, #555)` }} />
      {/* Horizontal arm */}
      <div style={{
        ...sharedStyle,
        position: 'absolute',
        bottom: 0,
        [side === 'left' ? 'left' : 'right']: 0,
        width: h,
        height: t,
        borderRadius: side === 'left' ? '0 2px 2px 0' : '2px 0 0 2px',
      }} />
    </div>
  );
}

// ─── Shelf row ────────────────────────────────────────────────────────────────

function ShelfRow({
  books,
  showBanned,
  showOpenAccess,
  openAccess,
  onBookSelect,
  draggingId,
  draggingBook,
  onReorderBooks,
  onDragStart,
  onDragEnd,
}: {
  books: Book[];
  showBanned: boolean;
  showOpenAccess: boolean;
  openAccess: Map<string, OpenAccessInfo>;
  onBookSelect?: (b: Book) => void;
  draggingId?: string | null;
  draggingBook?: Book | null;
  onReorderBooks?: (draggedId: string, targetId: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <Bracket side="left" />
      <Bracket side="right" />

      {/* Books */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: BOOK_GAP,
          paddingLeft: 56,
          paddingRight: 56,
          paddingBottom: SHELF_TOP + SHELF_BTM,
          minHeight: COVER_H + SHELF_TOP + SHELF_BTM,
        }}
      >
        {books.map((book) => (
          <Book3D
            key={book.id as string}
            book={book}
            showBanned={showBanned}
            showOpenAccess={showOpenAccess}
            accessInfo={getAccessInfo(openAccess, book)}
            onBookSelect={onBookSelect}
            draggingId={draggingId}
            draggingBook={draggingBook}
            onReorderBooks={onReorderBooks}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>

      {/* Wood plank top surface */}
      <div
        style={{
          position: 'absolute',
          bottom: SHELF_BTM,
          left: 0,
          right: 0,
          height: SHELF_TOP,
          overflow: 'hidden',
          background: `linear-gradient(to bottom, ${WOOD_A} 0%, ${WOOD_B} 45%, ${WOOD_A} 75%, #b87820 100%)`,
          boxShadow: '0 1px 0 rgba(255,255,255,0.18) inset, 0 8px 24px rgba(0,0,0,0.55)',
        }}
      >
        {/* Wood grain streaks */}
        {[0.12, 0.3, 0.52, 0.7, 0.88].map((t, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: `${t * 100}%`,
              left: 0, right: 0,
              height: 1,
              background: 'rgba(0,0,0,0.09)',
              transform: `skewY(${i % 2 === 0 ? 0.5 : -0.5}deg)`,
            }}
          />
        ))}
        {/* Top highlight */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.28)' }} />
        {/* Subtle knot */}
        <div style={{ position: 'absolute', top: '30%', left: '38%', width: 28, height: 10, borderRadius: '50%', background: 'rgba(0,0,0,0.06)', transform: 'skewX(-6deg)' }} />
      </div>

      {/* Plank underside */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: SHELF_BTM,
          background: WOOD_C,
          boxShadow: '0 10px 32px rgba(0,0,0,0.7)',
        }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WallShelfProps {
  shelves: Shelf[];
  showBanned?: boolean;
  showOpenAccess?: boolean;
  onBookSelect?: (book: Book) => void;
  draggingId?: string | null;
  onReorderBooks?: (draggedId: string, targetId: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

export function WallShelf({ shelves, showBanned = false, showOpenAccess = true, onBookSelect, draggingId, onReorderBooks, onDragStart, onDragEnd }: WallShelfProps) {
  const allBooks = useMemo(() =>
    [...shelves]
      .filter((s) => s.books.length > 0)
      .sort((a, b) => b.title.localeCompare(a.title))
      .flatMap((s) => s.books),
    [shelves],
  );

  const openAccess = useOpenAccess(allBooks);
  const draggingBook = draggingId ? (allBooks.find((b) => (b.id as string) === draggingId) ?? null) : null;

  if (allBooks.length === 0) return null;

  const rows: Book[][] = [];
  for (let i = 0; i < allBooks.length; i += PER_ROW) {
    rows.push(allBooks.slice(i, i + PER_ROW));
  }

  return (
    <div
      style={{
        background: `radial-gradient(ellipse at 30% 15%, #221c34 0%, ${WALL} 65%)`,
        borderRadius: 12,
        padding: '48px 40px 60px',
        display: 'flex',
        flexDirection: 'column',
        gap: ROW_GAP,
        overflowX: 'auto',
      }}
    >
      {rows.map((rowBooks, i) => (
        <ShelfRow
          key={i}
          books={rowBooks}
          showBanned={showBanned}
          showOpenAccess={showOpenAccess}
          openAccess={openAccess}
          onBookSelect={onBookSelect}
          draggingId={draggingId}
          draggingBook={draggingBook}
          onReorderBooks={onReorderBooks}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  );
}
