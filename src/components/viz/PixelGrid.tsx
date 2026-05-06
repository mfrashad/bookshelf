'use client';

import { useEffect, useRef, useState } from 'react';
import type { Book, Shelf } from '@/lib/types';
import { hashNum } from '@/lib/spine';

// ─── Color filters applied to the brown pixel-book.png sprite ─────────────────
// sepia(1) normalises hue, then saturate + hue-rotate shifts to target color.

const B = 'brightness(0.58)'; // darken all variants for text contrast

const BOOK_FILTERS = [
  `sepia(1) saturate(4) hue-rotate(175deg) ${B}`,   // blue
  `sepia(1) saturate(2) ${B}`,                        // brown
  `sepia(1) saturate(4) hue-rotate(90deg) ${B}`,     // green
  `sepia(1) saturate(4) hue-rotate(255deg) ${B}`,    // purple
  `sepia(1) saturate(5) hue-rotate(335deg) ${B}`,    // red
  `sepia(1) saturate(4) hue-rotate(155deg) ${B}`,    // teal
  `sepia(1) saturate(3) hue-rotate(195deg) ${B}`,    // navy
  `sepia(1) saturate(3) hue-rotate(45deg) ${B}`,     // olive
  `sepia(1) saturate(5) hue-rotate(305deg) ${B}`,    // magenta
  `sepia(1) saturate(4) hue-rotate(120deg) ${B}`,    // cyan-green
];

const BOOKMARK_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#27ae60',
  '#2980b9', '#8e44ad', '#e91e63', '#00bcd4',
  '#ff5722', '#4caf50',
];

function getFilter(title: string)   { return BOOK_FILTERS[Math.abs(hashNum(title)) % BOOK_FILTERS.length]; }
function getBookmark(id: string)    { return BOOKMARK_COLORS[Math.abs(hashNum(id)) % BOOKMARK_COLORS.length]; }

// ─── Dimensions ───────────────────────────────────────────────────────────────

const COVER_W    = 112;  // front-face width
const COVER_H    = 168;  // front-face height (2:3 ratio)
const DEPTH      = 20;   // fore-edge / pages thickness
const LABEL_H    = 52;   // space below the book for the title label

const PIXEL_BLOCK = 3; // each logical "pixel" = 3×3 display px

// ─── Canvas-based pixelation ──────────────────────────────────────────────────
// CSS transform+image-rendering:pixelated doesn't work because GPU compositing
// applies bilinear filtering after rasterization. Canvas two-step is the fix:
// (1) downsample to tiny canvas with smooth interpolation (correct cover crop),
// (2) upsample to full canvas with imageSmoothingEnabled=false → blocky pixels.

function PixelatedCover({ src, width, height }: { src: string; width: number; height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tinyW = Math.ceil(width / PIXEL_BLOCK);
    const tinyH = Math.ceil(height / PIXEL_BLOCK);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Step 1: smooth cover-crop downsample
      const tiny = document.createElement('canvas');
      tiny.width  = tinyW;
      tiny.height = tinyH;
      const tc = tiny.getContext('2d')!;
      tc.imageSmoothingEnabled = true;
      const scale = Math.max(tinyW / img.naturalWidth, tinyH / img.naturalHeight);
      const sw = tinyW / scale;
      const sh = tinyH / scale;
      const sx = (img.naturalWidth  - sw) / 2;
      const sy = (img.naturalHeight - sh) / 2;
      tc.drawImage(img, sx, sy, sw, sh, 0, 0, tinyW, tinyH);

      // Step 2: nearest-neighbor upsample → visible pixel blocks
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(tiny, 0, 0, width, height);
    };
    img.src = src;
  }, [src, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, display: 'block' }}
    />
  );
}

// ─── Single pixel-art book ────────────────────────────────────────────────────

// ─── Single pixel-art book (3D, WallShelf approach) ──────────────────────────

function PixelBook({
  book,
  onBookSelect,
  draggingId,
  draggingBook,
  onReorderBooks,
  onDragStart,
  onDragEnd,
}: {
  book: Book;
  onBookSelect?: (b: Book) => void;
  draggingId?: string | null;
  draggingBook?: Book | null;
  onReorderBooks?: (from: string, to: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}) {
  const [hovered, setHovered]           = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const dragEnterCount = useRef(0);
  const filter  = getFilter(book.title);
  const bookId  = book.id as string;

  const ghostActive = isDropTarget && draggingBook && (draggingBook.id as string) !== bookId;
  const showCover   = ghostActive ? draggingBook!.coverProxiedUrl : book.coverProxiedUrl;
  const showTitle   = ghostActive ? draggingBook!.title : book.title;
  const showFilter  = ghostActive ? getFilter(draggingBook!.title) : filter;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', bookId);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart?.(bookId);
      }}
      onDragEnd={() => onDragEnd?.()}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDragEnter={() => {
        if (draggingId && draggingId !== bookId) {
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
        const from = e.dataTransfer.getData('text/plain');
        if (from && from !== bookId) onReorderBooks?.(from, bookId);
      }}
      onClick={() => onBookSelect?.(book)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={book.title}
      style={{
        flexShrink: 0,
        width: COVER_W + DEPTH,
        height: COVER_H + LABEL_H,
        position: 'relative',
        cursor: 'grab',
        opacity: draggingId === bookId ? 0.35 : 1,
        transition: 'opacity 0.15s',
        userSelect: 'none',
      }}
    >
      {/* ── 3-D wrapper ── */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: COVER_W, height: COVER_H,
        transformStyle: 'preserve-3d',
        transform: hovered
          ? 'perspective(900px) rotateY(0deg) translateY(-14px) translateZ(24px)'
          : 'perspective(900px) rotateY(-28deg)',
        transition: 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }}>
        {/* ── Front face ── */}
        <div style={{
          position: 'absolute', inset: 0,
          overflow: 'hidden',
          borderRadius: '2px 3px 3px 2px',
          boxShadow: hovered
            ? '0 24px 56px rgba(0,0,0,0.8), 6px 0 14px rgba(0,0,0,0.45)'
            : '0 10px 28px rgba(0,0,0,0.65), 5px 0 10px rgba(0,0,0,0.35)',
          transition: 'box-shadow 0.38s ease',
        }}>
          {/* Sprite colour fallback */}
          <img src="/pixel-book.png" alt="" style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'fill', imageRendering: 'pixelated', display: 'block',
            filter: showFilter,
          }} />

          {/* Pixelated cover */}
          {showCover && <PixelatedCover src={showCover} width={COVER_W} height={COVER_H} />}

          {/* Left binding crease */}
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 7, zIndex: 2, pointerEvents: 'none',
            background: 'linear-gradient(to right, rgba(0,0,0,0.45), transparent)',
          }} />

          {/* Top-left gloss */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 40%)',
          }} />
        </div>

        {/* ── Fore-edge: page stack ── */}
        <div style={{
          position: 'absolute',
          top: 0, right: -DEPTH,
          width: DEPTH, height: COVER_H,
          transformOrigin: 'left center',
          transform: 'rotateY(90deg)',
          borderRadius: '0 2px 2px 0',
          overflow: 'hidden',
          background: `repeating-linear-gradient(
            to bottom,
            #f5f1e8 0px, #f5f1e8 ${PIXEL_BLOCK}px,
            #e6e0d2 ${PIXEL_BLOCK}px, #e6e0d2 ${PIXEL_BLOCK * 2}px,
            #ede8db ${PIXEL_BLOCK * 2}px, #ede8db ${PIXEL_BLOCK * 3}px,
            #d8d0c0 ${PIXEL_BLOCK * 3}px, #d8d0c0 ${PIXEL_BLOCK * 4}px
          )`,
          imageRendering: 'pixelated',
        }}>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(to right, rgba(0,0,0,0.18) 0%, transparent 35%, rgba(0,0,0,0.08) 100%)',
          }} />
        </div>
      </div>

      {/* ── Title label below the book ── */}
      <div style={{
        position: 'absolute',
        top: COVER_H + 10,
        left: 0, right: 0,
        textAlign: 'center',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}>
        <span style={{
          fontFamily: 'var(--font-pixel, "Courier New", monospace)',
          fontSize: 10, lineHeight: 1.45,
          color: 'rgba(255,255,255,0.82)',
          textTransform: 'uppercase',
          wordBreak: 'break-word',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical' as const,
          overflow: 'hidden',
        }}>
          {showTitle}
        </span>
      </div>
    </div>
  );
}

// ─── Grid ─────────────────────────────────────────────────────────────────────

interface PixelGridProps {
  shelves: Shelf[];
  onBookSelect?: (book: Book) => void;
  exportMode?: boolean;
  draggingId?: string | null;
  onReorderBooks?: (from: string, to: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

export function PixelGrid({
  shelves,
  onBookSelect,
  exportMode = false,
  draggingId,
  onReorderBooks,
  onDragStart,
  onDragEnd,
}: PixelGridProps) {
  const allBooks = [...shelves]
    .filter((s) => s.books.length > 0)
    .sort((a, b) => b.title.localeCompare(a.title))
    .flatMap((s) => s.books);

  const draggingBook = draggingId ? (allBooks.find((b) => (b.id as string) === draggingId) ?? null) : null;

  if (allBooks.length === 0) return null;

  return (
    <div style={{
      background: '#1e1e2e',
      borderRadius: exportMode ? 0 : 12,
      padding: exportMode ? '52px 40px 32px' : '36px 20px 20px',
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px 16px',
        alignItems: 'flex-end',
      }}>
        {allBooks.map((book) => (
          <PixelBook
            key={book.id as string}
            book={book}
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
  );
}
