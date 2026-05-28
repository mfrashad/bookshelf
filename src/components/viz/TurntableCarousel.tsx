'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { Book, Shelf } from '@/lib/types';
import { hashColor, spineTextColor } from '@/lib/spine';

interface TurntableCarouselProps {
  shelves: Shelf[];
  showBanned?: boolean;
  onBookSelect?: (book: Book) => void;
  exportMode?: boolean;
}

const CANVAS_W = 620;
const CANVAS_H = 700;
const CX = CANVAS_W / 2;

// Perspective parameters — tune these to match the video's "disc from below" look
const DEPTH_RATIO = 0.68;  // R/CAM_Z: higher = more dramatic front-to-back scale difference
const HALF_SPREAD = 240;   // max horizontal offset at 90° (px)
const VP_Y = 85;            // vanishing point y (px from top; back cards converge here)
const CAM_Y = 190;          // vertical offset coefficient (pushes front cards down)
const BASE_W = 58;          // card width at neutral depth (90°)
const BASE_H = BASE_W * 1.36;
const AUTO_SPIN = 0.007;   // rad/frame at 60fps

// perspFactor(a): scale multiplier based on position on the circle
// = 1 at a=90° (side), ~3.1 at a=0 (front), ~0.6 at a=π (back)
function perspFactor(a: number): number {
  return 1 / (1 - DEPTH_RATIO * Math.cos(a));
}

interface Layout { sx: number; sy: number; w: number; h: number; zIndex: number }

function cardLayout(angle: number): Layout {
  const pf = perspFactor(angle);
  return {
    sx: CX + Math.sin(angle) * HALF_SPREAD * pf,
    sy: VP_Y + CAM_Y * pf,
    w: BASE_W * pf,
    h: BASE_H * pf,
    zIndex: Math.round(pf * 1000),
  };
}

function CardFace({ book, w, bg, fg }: { book: Book; w: number; bg: string; fg: string }) {
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0,
        background: bg, color: fg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '4px 3px', gap: 2,
      }}>
        <span style={{ fontSize: Math.max(8, w * 0.22), fontWeight: 800, lineHeight: 1 }}>
          {book.title.trim()[0]?.toUpperCase() ?? '?'}
        </span>
        <span style={{
          fontSize: Math.max(5, w * 0.08), fontWeight: 500, opacity: 0.85,
          textAlign: 'center', lineHeight: 1.2,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          wordBreak: 'break-word' as const,
        }}>{book.title}</span>
      </div>
      {book.coverProxiedUrl && (
        <img
          src={book.coverProxiedUrl}
          alt={book.title}
          crossOrigin="anonymous"
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </>
  );
}

// Static snapshot for PNG export — sorted back-to-front so DOM order matches depth
function StaticCarousel({ allBooks }: { allBooks: Book[] }) {
  const n = allBooks.length;
  const step = n > 1 ? (2 * Math.PI) / n : 0;

  const items = allBooks
    .map((book, i) => {
      const angle = i * step;
      const layout = cardLayout(angle);
      const bg = hashColor(book.title);
      const fg = spineTextColor(bg);
      return { book, ...layout, bg, fg };
    })
    .sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, overflow: 'hidden' }}>
      {items.map(({ book, sx, sy, w, h, zIndex, bg, fg }) => (
        <div
          key={book.id as string}
          style={{
            position: 'absolute',
            left: sx, top: sy, width: w, height: h, zIndex,
            transform: 'translate(-50%, -50%)',
            borderRadius: 3, overflow: 'hidden',
            border: `3px solid ${bg}`,
            boxShadow: '0 2px 16px rgba(0,0,0,0.18)',
          }}
        >
          <CardFace book={book} w={w} bg={bg} fg={fg} />
        </div>
      ))}
    </div>
  );
}

export function TurntableCarousel({ shelves, showBanned = false, onBookSelect, exportMode = false }: TurntableCarouselProps) {
  const allBooks = useMemo(() =>
    [...shelves]
      .filter(s => s.books.length > 0)
      .sort((a, b) => b.title.localeCompare(a.title))
      .flatMap(s => s.books),
    [shelves]
  );

  const n = allBooks.length;
  const step = n > 1 ? (2 * Math.PI) / n : 0;

  const bookRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rotRef = useRef(0);
  const velRef = useRef(0);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation loop — direct DOM mutation, no React re-renders
  useEffect(() => {
    if (exportMode) return;

    function frame() {
      if (!dragging.current) {
        velRef.current += (AUTO_SPIN - velRef.current) * 0.04;
      }
      rotRef.current += velRef.current;

      for (let i = 0; i < allBooks.length; i++) {
        const el = bookRefs.current[i];
        if (!el) continue;
        const { sx, sy, w, h, zIndex } = cardLayout(rotRef.current + i * step);
        el.style.left = `${sx}px`;
        el.style.top = `${sy}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.zIndex = `${zIndex}`;
      }

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [allBooks, step, exportMode]);

  // Non-passive wheel listener so preventDefault works
  useEffect(() => {
    if (exportMode) return;
    const el = containerRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      velRef.current += e.deltaY * 0.00025;
    }
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [exportMode]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    lastX.current = e.clientX;
    velRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    const delta = dx * 0.01;
    rotRef.current += delta;
    velRef.current = delta;
    lastX.current = e.clientX;
  }
  function onPointerUp() { dragging.current = false; }

  if (allBooks.length === 0) return null;

  if (exportMode) {
    return (
      <div style={{ background: '#fff', display: 'flex', justifyContent: 'center' }}>
        <StaticCarousel allBooks={allBooks} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        background: '#fff', borderRadius: 8, overflow: 'hidden',
        userSelect: 'none', display: 'flex', justifyContent: 'center',
        cursor: 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, overflow: 'hidden' }}>
        {/* Vanishing-point glow */}
        <div style={{
          position: 'absolute', left: CX, top: VP_Y,
          width: 120, height: 120,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(200,200,200,0.35) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Hint */}
        <div style={{
          position: 'absolute', bottom: 18, left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11, color: '#bbb', letterSpacing: '0.05em',
          pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap',
        }}>
          drag or scroll to rotate
        </div>

        {/* Book cards — frame loop updates left/top/width/height/zIndex directly */}
        {allBooks.map((book, i) => {
          const init = cardLayout(rotRef.current + i * step);
          const bg = hashColor(book.title);
          const fg = spineTextColor(bg);
          return (
            <div
              key={book.id as string}
              ref={el => { bookRefs.current[i] = el; }}
              title={`${book.title}${book.authors?.[0]?.name ? ` — ${book.authors[0].name}` : ''}`}
              onClick={() => onBookSelect?.(book)}
              style={{
                position: 'absolute',
                left: init.sx, top: init.sy,
                width: init.w, height: init.h,
                zIndex: init.zIndex,
                transform: 'translate(-50%, -50%)',
                borderRadius: 3, overflow: 'hidden',
                border: `3px solid ${bg}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.13)',
                cursor: 'pointer',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 32px rgba(0,0,0,0.28)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.13)'; }}
            >
              <CardFace book={book} w={init.w} bg={bg} fg={fg} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
