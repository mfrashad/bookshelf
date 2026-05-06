'use client';

import { useEffect, useRef, useState } from 'react';
import type { Book, Shelf } from '@/lib/types';
import { hashNum } from '@/lib/spine';
import './bookshelf.css';

// ─── Exact color palette from itsmeray.com/readings ──────────────────────────
const SPINE_PALETTE = [
  { bg: '#1a1a2e', text: '#e0e0e0', accent: '#e94560' },
  { bg: '#f4a261', text: '#1a1a1a', accent: '#264653' },
  { bg: '#e9c46a', text: '#1a1a1a', accent: '#2a9d8f' },
  { bg: '#264653', text: '#e9c46a', accent: '#e76f51' },
  { bg: '#2a9d8f', text: '#ffffff', accent: '#264653' },
  { bg: '#e76f51', text: '#ffffff', accent: '#264653' },
  { bg: '#606c38', text: '#fefae0', accent: '#dda15e' },
  { bg: '#283618', text: '#fefae0', accent: '#bc6c25' },
  { bg: '#dda15e', text: '#283618', accent: '#606c38' },
  { bg: '#fefae0', text: '#283618', accent: '#bc6c25' },
  { bg: '#003049', text: '#fcbf49', accent: '#eae2b7' },
  { bg: '#d62828', text: '#eae2b7', accent: '#003049' },
  { bg: '#f77f00', text: '#003049', accent: '#eae2b7' },
  { bg: '#fcbf49', text: '#003049', accent: '#d62828' },
  { bg: '#8338ec', text: '#ffffff', accent: '#ffbe0b' },
  { bg: '#3a86ff', text: '#ffffff', accent: '#ff006e' },
  { bg: '#ff006e', text: '#ffffff', accent: '#3a86ff' },
  { bg: '#ffbe0b', text: '#1a1a1a', accent: '#8338ec' },
  { bg: '#023047', text: '#8ecae6', accent: '#ffb703' },
  { bg: '#219ebc', text: '#023047', accent: '#ffb703' },
  { bg: '#fb8500', text: '#023047', accent: '#8ecae6' },
  { bg: '#6d6875', text: '#e5989b', accent: '#b5838d' },
  { bg: '#e5989b', text: '#1a1a1a', accent: '#6d6875' },
];

function spineColor(title: string) {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = title.charCodeAt(i) + ((h << 5) - h);
  return SPINE_PALETTE[Math.abs(h) % SPINE_PALETTE.length];
}

// Height: 300–440px based on pages (same formula as reference)
function spineHeight(pages: number): number {
  return 300 + 140 * Math.min((pages || 250) / 500, 1);
}

// Width: max(page-based, author-length-based) — same as reference
function spineWidth(pages: number, authorName: string): number {
  const pageBased = 20 + 45 * Math.min(Math.max(((pages || 0) - 3) / 477, 0), 1);
  const authorBased = authorName.length * (6 * 0.55 + 0.5) + 16;
  return Math.max(pageBased, authorBased, 40); // min 40px for usability
}

// ─── Canvas noise (animated, same algorithm as reference) ─────────────────────
let _noiseFrames: string[] | null = null;
let _noiseRaf: number | null = null;
let _noiseRefCount = 0;
let _noiseIdx = 0;
let _noiseLast = 0;

function generateNoiseFrames(): string[] {
  if (_noiseFrames) return _noiseFrames;
  const SIZE = 150;
  _noiseFrames = [];
  for (let f = 0; f < 12; f++) {
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(SIZE, SIZE);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (Math.random() > 0.94) {
        d[i] = d[i + 1] = d[i + 2] = 255;
        d[i + 3] = 180 + Math.random() * 75;
      } else {
        d[i] = d[i + 1] = d[i + 2] = Math.floor(Math.random() * 256);
        d[i + 3] = 40 + Math.random() * 80;
      }
    }
    ctx.putImageData(img, 0, 0);
    _noiseFrames.push(canvas.toDataURL('image/png'));
  }
  return _noiseFrames;
}

function startNoise() {
  _noiseRefCount++;
  if (_noiseRefCount > 1 || _noiseRaf !== null) return;
  const frames = generateNoiseFrames();
  function tick(t: number) {
    if (t - _noiseLast > 70) {
      _noiseIdx = (_noiseIdx + 1) % frames.length;
      const url = `url(${frames[_noiseIdx]})`;
      document.querySelectorAll<HTMLElement>('.spine-noise').forEach(el => {
        el.style.backgroundImage = url;
      });
      _noiseLast = t;
    }
    _noiseRaf = requestAnimationFrame(tick);
  }
  _noiseRaf = requestAnimationFrame(tick);
}

function stopNoise() {
  _noiseRefCount = Math.max(0, _noiseRefCount - 1);
  if (_noiseRefCount > 0) return;
  if (_noiseRaf !== null) { cancelAnimationFrame(_noiseRaf); _noiseRaf = null; }
}

// ─── 4-pointed sparkle drawn on canvas ───────────────────────────────────────
function drawSparkle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
  glow: number,
) {
  ctx.fillStyle = color;
  if (glow > 0) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.beginPath();
  ctx.moveTo(x - 2 * r, y);
  ctx.lineTo(x - 0.3 * r, y - 0.3 * r);
  ctx.lineTo(x, y - 2 * r);
  ctx.lineTo(x + 0.3 * r, y - 0.3 * r);
  ctx.lineTo(x + 2 * r, y);
  ctx.lineTo(x + 0.3 * r, y + 0.3 * r);
  ctx.lineTo(x, y + 2 * r);
  ctx.lineTo(x - 0.3 * r, y + 0.3 * r);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
}

function sparkleColor(bg: string): string {
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  const lum = (299 * r + 587 * g + 114 * b) / 1000;
  if (lum < 100) return 'rgba(255,255,255,';
  if (lum < 160) return 'rgba(255,245,220,';
  return 'rgba(60,40,20,';
}

// ─── Wandering sparkle component ─────────────────────────────────────────────
interface WanderingSparkleProps {
  books: Book[];
  spineHeights: number[];
  spineWidths: number[];
}

function WanderingSparkle({ books, spineHeights, spineWidths }: WanderingSparkleProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || books.length === 0) return;
    const c: HTMLCanvasElement = canvas; // non-null alias for use in closures
    const ctx = canvas.getContext('2d')!;

    let bookIdx = Math.floor(Math.random() * books.length);
    let x = 0, y = 0, r = 3 + 8 * Math.random();
    let phase = 0; // 0=fadein, 1=fadeout
    let alpha = 0;
    let dwellFrames = 0;
    const maxDwell = 20 + 40 * Math.random();
    let raf: number;

    function resize() {
      const parent = c.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.offsetWidth;
      const h = parent.offsetHeight;
      c.width = w * dpr;
      c.height = h * dpr;
      c.style.width = w + 'px';
      c.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function pickNewTarget() {
      bookIdx = Math.floor(Math.random() * books.length);
      const col = spineColor(books[bookIdx].title);
      r = 3 + 8 * Math.random();
      phase = 0;
      alpha = 0;
      dwellFrames = 0;
      // Estimate x position by summing widths of prior books + gaps
      let xOff = 16; // left padding
      for (let i = 0; i < bookIdx; i++) xOff += spineWidths[i] + 4;
      x = xOff + spineWidths[bookIdx] * Math.random();
      const sh = spineHeights[bookIdx];
      y = Math.random() * (sh - 40) + 20;
    }

    resize();
    pickNewTarget();
    window.addEventListener('resize', resize);

    raf = requestAnimationFrame(function tick() {
      const parent = c.parentElement;
      if (!parent) { raf = requestAnimationFrame(tick); return; }
      ctx.clearRect(0, 0, parent.offsetWidth, parent.offsetHeight);

      if (phase === 0) {
        alpha += 0.025;
        if (alpha >= 1) { alpha = 1; phase = 1; }
      } else {
        dwellFrames++;
        if (dwellFrames > maxDwell) {
          alpha -= 0.03;
          if (alpha <= 0) { alpha = 0; pickNewTarget(); }
        }
      }

      if (alpha > 0.1) {
        const col = spineColor(books[bookIdx].title);
        const baseColor = sparkleColor(col.bg);
        drawSparkle(ctx, x, y, r * alpha, `${baseColor}${alpha})`, r * 2 * alpha);
      }

      raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [books, spineHeights, spineWidths]);

  return (
    <canvas
      ref={canvasRef}
      className="shelf-sparkle-canvas"
    />
  );
}

// ─── Single book spine ────────────────────────────────────────────────────────
interface SpineBookProps {
  book: Book;
  exportMode: boolean;
  onBookSelect?: (book: Book) => void;
  draggingId?: string | null;
  draggingBook?: Book | null;
  onReorderBooks?: (draggedId: string, targetId: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

function SpineBook({ book, exportMode, onBookSelect, draggingId, draggingBook, onReorderBooks, onDragStart, onDragEnd }: SpineBookProps) {
  const [hovered, setHovered] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const dragEnterCount = useRef(0);
  const col = spineColor(book.title);
  const pages = book.pageCount || 250;
  const h = spineHeight(pages);
  const authorName = (book.authors?.[0]?.name ?? '').toUpperCase();
  const w = spineWidth(pages, authorName);
  const rating = book.rating ?? 0;

  return (
    <div
      className={`spine-wrap${hovered && !exportMode ? ' spine-hovered' : ''}`}
      style={{ width: w, height: h, '--spine-height': `${h}px`, position: 'relative', opacity: draggingId === (book.id as string) ? 0.35 : 1, transition: 'opacity 0.15s' } as React.CSSProperties}
      draggable={!exportMode}
      onDragStart={(e) => {
        if (exportMode) return;
        e.dataTransfer.setData('text/plain', book.id as string);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(book.id as string);
      }}
      onDragEnd={() => !exportMode && onDragEnd?.()}
      onDragOver={(e) => { if (!exportMode) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; } }}
      onDragEnter={() => {
        if (!exportMode && draggingId && draggingId !== (book.id as string)) {
          dragEnterCount.current++;
          setIsDropTarget(true);
        }
      }}
      onDragLeave={() => {
        if (!exportMode) {
          dragEnterCount.current = Math.max(0, dragEnterCount.current - 1);
          if (dragEnterCount.current === 0) setIsDropTarget(false);
        }
      }}
      onDrop={(e) => {
        if (exportMode) return;
        e.preventDefault();
        dragEnterCount.current = 0;
        setIsDropTarget(false);
        const draggedId = e.dataTransfer.getData('text/plain');
        if (draggedId && draggedId !== (book.id as string)) onReorderBooks?.(draggedId, book.id as string);
      }}
      onMouseEnter={() => !exportMode && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => !exportMode && onBookSelect?.(book)}
      title={`${book.title}${authorName ? ` — ${authorName}` : ''}`}
    >
      <div
        className="spine-body"
        style={{ background: col.bg, color: col.text }}
      >
        {/* Animated canvas grain */}
        <div className="spine-noise" />

        {/* Left binding edge */}
        <div className="spine-binding" />

        {/* Spine content */}
        <div className="spine-content">
          {/* Stars at top, accent colored */}
          <div className="spine-rating" style={{ color: col.accent }}>
            {rating > 0 ? '★'.repeat(rating) : ''}
          </div>

          {/* Title — rotated 90° with width = height - 80px */}
          <div className="spine-title-wrapper">
            <span
              className="spine-title"
              style={{ width: `calc(${h}px - 80px)`, maxWidth: `calc(${h}px - 80px)` }}
            >
              {book.title.toUpperCase()}
            </span>
          </div>

          {/* Author — horizontal, bottom */}
          {authorName && (
            <span className="spine-author">{authorName}</span>
          )}
        </div>
      </div>
      {isDropTarget && draggingBook && (draggingBook.id as string) !== (book.id as string) && (() => {
        const ghostCol = spineColor(draggingBook.title);
        return (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5,
            background: ghostCol.bg, borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{
              color: ghostCol.text, fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 10, writingMode: 'vertical-rl', transform: 'rotate(180deg)',
              overflow: 'hidden', maxHeight: '80%', opacity: 0.9,
            }}>
              {draggingBook.title.toUpperCase()}
            </span>
          </div>
        );
      })()}
    </div>
  );
}

// ─── Shelf row ────────────────────────────────────────────────────────────────
interface ShelfRowProps {
  shelf: Shelf;
  exportMode: boolean;
  onBookSelect?: (book: Book) => void;
  draggingId?: string | null;
  draggingBook?: Book | null;
  onReorderBooks?: (draggedId: string, targetId: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

function ShelfRow({ shelf, exportMode, onBookSelect, draggingId, draggingBook, onReorderBooks, onDragStart, onDragEnd }: ShelfRowProps) {
  const heights = shelf.books.map(b => spineHeight(b.pageCount || 250));
  const widths = shelf.books.map(b => spineWidth(b.pageCount || 250, (b.authors?.[0]?.name ?? '').toUpperCase()));

  return (
    <div className="shelf-row">
      <div className="shelf-books-wrap">
        {!exportMode && (
          <WanderingSparkle books={shelf.books} spineHeights={heights} spineWidths={widths} />
        )}
        <div className="shelf-books">
          {shelf.books.map((book) => (
            <SpineBook
              key={book.id as string}
              book={book}
              exportMode={exportMode}
              onBookSelect={onBookSelect}
              draggingId={draggingId}
              draggingBook={draggingBook}
              onReorderBooks={onReorderBooks}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      </div>
      <div className="shelf-ledge" />
      <div className="shelf-label">
        <span className="shelf-year">{shelf.title}</span>
        <span className="shelf-count">· {shelf.books.length} book{shelf.books.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

// ─── Full bookshelf ───────────────────────────────────────────────────────────
interface BookshelfProps {
  shelves: Shelf[];
  exportMode?: boolean;
  exportWidth?: number;
  exportHeight?: number;
  onBookSelect?: (book: Book) => void;
  draggingId?: string | null;
  onReorderBooks?: (draggedId: string, targetId: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

export function Bookshelf({ shelves, exportMode = false, exportWidth, exportHeight, onBookSelect, draggingId, onReorderBooks, onDragStart, onDragEnd }: BookshelfProps) {
  const sorted = [...shelves]
    .filter((s) => s.books.length > 0)
    .sort((a, b) => b.title.localeCompare(a.title));

  useEffect(() => {
    if (exportMode) return;
    startNoise();
    return () => stopNoise();
  }, [exportMode]);

  const draggingBook = draggingId
    ? (sorted.flatMap((s) => s.books).find((b) => (b.id as string) === draggingId) ?? null)
    : null;

  if (sorted.length === 0) return null;

  // Compute scale so the bookshelf fits within exportWidth × exportHeight
  let exportScale = 1;
  if (exportMode && exportWidth && exportHeight && sorted.length > 0) {
    let naturalH = 52; // 32px cabinet-top-pad + 20px cabinet-bottom-pad
    for (const shelf of sorted) {
      const maxSpineH = Math.max(...shelf.books.map((b) => spineHeight(b.pageCount || 250)));
      naturalH += 40 + maxSpineH + 60; // books-top-pad + tallest-spine + ledge+label
    }
    naturalH += Math.max(0, sorted.length - 1) * 52;

    let naturalW = 40; // cabinet horizontal padding (20×2)
    for (const shelf of sorted) {
      let shelfW = 32; // shelf-books padding (16×2)
      for (const b of shelf.books) {
        shelfW += spineWidth(b.pageCount || 0, (b.authors?.[0]?.name ?? '').toUpperCase()) + 2;
      }
      naturalW = Math.max(naturalW, shelfW + 40);
    }

    exportScale = Math.min(exportWidth / naturalW, exportHeight / naturalH, 1);
  }

  const cabinet = (
    <div className="bookshelf-cabinet" style={{ borderRadius: exportMode ? 12 : 8 }}>
      {sorted.map((shelf) => (
        <ShelfRow
          key={shelf.title}
          shelf={shelf}
          exportMode={exportMode}
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

  if (exportMode && exportWidth && exportHeight) {
    return (
      <div style={{
        width: exportWidth, height: exportHeight,
        background: '#0d1117',
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        overflow: 'hidden',
      }}>
        <div style={{
          transform: `scale(${exportScale})`,
          transformOrigin: 'top center',
          flexShrink: 0,
        }}>
          {cabinet}
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'transparent' }}>
      {cabinet}
    </div>
  );
}
