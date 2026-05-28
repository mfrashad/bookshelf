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

const CANVAS_W    = 620;
const CANVAS_H    = 700;

// CSS 3D carousel parameters
const PERSPECTIVE = 560;   // px — lower = more dramatic fish-eye
const VP_Y        = '8%';  // perspectiveOrigin y — back cards converge toward top
const RING_TILT   = 76;    // deg — disc tilt from vertical (76° ≈ nearly flat disc)
const RING_CY     = 350;   // disc centre y in canvas (px)
const RADIUS      = 250;   // disc radius (px)
const CARD_W      = 90;    // card width (px)
const CARD_H      = 126;   // card height (portrait aspect)
const LIFT_Z      = 75;    // extra Z on hover (toward viewer)
const AUTO_DEG    = 0.35;  // degrees/frame auto-spin at 60fps

export function TurntableCarousel({
  shelves,
  showBanned = false,
  onBookSelect,
  exportMode = false,
}: TurntableCarouselProps) {
  const allBooks = useMemo(() =>
    [...shelves]
      .filter(s => s.books.length > 0)
      .sort((a, b) => b.title.localeCompare(a.title))
      .flatMap(s => s.books),
    [shelves],
  );

  const n    = allBooks.length;
  const step = n > 1 ? 360 / n : 0;

  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef      = useRef<HTMLDivElement>(null);
  const rotDeg       = useRef(0);
  const velDeg       = useRef(0);
  const dragging     = useRef(false);
  const lastX        = useRef(0);
  const rafRef       = useRef<number>(0);

  // Animation: only the ring div rotates — individual cards stay at their fixed angleY
  useEffect(() => {
    if (exportMode) return;

    function frame() {
      if (!dragging.current) {
        velDeg.current += (AUTO_DEG - velDeg.current) * 0.04;
      }
      rotDeg.current += velDeg.current;
      if (ringRef.current) {
        ringRef.current.style.transform =
          `rotateX(${RING_TILT}deg) rotateY(${rotDeg.current}deg)`;
      }
      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [exportMode]);

  // Non-passive wheel to prevent page scroll while rotating
  useEffect(() => {
    if (exportMode) return;
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      velDeg.current += e.deltaY * 0.05;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [exportMode]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    lastX.current    = e.clientX;
    velDeg.current   = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const dx         = e.clientX - lastX.current;
    velDeg.current   = dx * 0.5;
    rotDeg.current  += dx * 0.5;
    lastX.current    = e.clientX;
  }
  function onPointerUp() { dragging.current = false; }

  if (allBooks.length === 0) return null;

  // Shared ring wrapper style
  const ringStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%', top: RING_CY,
    width: 0, height: 0,
    transformStyle: 'preserve-3d',
    transform: `rotateX(${RING_TILT}deg) rotateY(0deg)`,
  };

  // ── Card renderer (used in both live and export modes) ──────────────────────
  function renderCards(books: Book[], extraCardStyle?: (i: number) => React.CSSProperties) {
    return books.map((book, i) => {
      const angleY     = i * step;
      const bg         = hashColor(book.title);
      const fg         = spineTextColor(bg);
      const authorName = book.authors?.[0]?.name ?? '';

      const baseTransform = `rotateY(${angleY}deg) translateZ(${RADIUS}px)`;

      return (
        <div
          key={book.id as string}
          title={`${book.title}${authorName ? ` — ${authorName}` : ''}`}
          onClick={() => onBookSelect?.(book)}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform  = `rotateY(${angleY}deg) translateZ(${RADIUS + LIFT_Z}px)`;
            el.style.transition = 'transform 0.25s cubic-bezier(0.23, 1, 0.32, 1)';
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.transform  = baseTransform;
            el.style.transition = 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)';
          }}
          style={{
            position: 'absolute',
            width: CARD_W, height: CARD_H,
            left: -CARD_W / 2, top: -CARD_H / 2,
            transformStyle: 'preserve-3d',
            transform: baseTransform,
            cursor: exportMode ? 'default' : 'pointer',
            ...(extraCardStyle?.(i) ?? {}),
          }}
        >
          {/* ── Card face ─────────────────────────────────────────────────── */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: 3, overflow: 'hidden',
            border: `3px solid ${bg}`,
            boxShadow: '0 6px 28px rgba(0,0,0,0.28)',
          }}>
            {/* Fallback */}
            <div style={{
              position: 'absolute', inset: 0,
              background: bg, color: fg,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
            }}>
              <span style={{ fontSize: Math.max(10, CARD_W * 0.24), fontWeight: 800, lineHeight: 1 }}>
                {book.title[0]?.toUpperCase() ?? '?'}
              </span>
              <span style={{
                fontSize: 7, fontWeight: 500, opacity: 0.88,
                textAlign: 'center', padding: '0 4px', lineHeight: 1.3,
                overflow: 'hidden', display: '-webkit-box',
                WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
              }}>
                {book.title}
              </span>
            </div>
            {/* Cover image */}
            {book.coverProxiedUrl && (
              <img
                src={book.coverProxiedUrl}
                alt={book.title}
                crossOrigin="anonymous"
                loading="lazy"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
            )}
          </div>

          {/* ── Floor label — rotated to lie in the disc plane ────────────── */}
          {/* rotateX(-90deg) pivots the label from card-face plane into the
              floor plane (world horizontal), making text extend radially
              from the vanishing point along each card's spoke line.         */}
          <div style={{
            position: 'absolute',
            top: CARD_H + 6,
            left: '50%',
            transform: 'translateX(-50%) rotateX(-90deg)',
            transformOrigin: 'top center',
            pointerEvents: 'none',
            width: 110,
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: 9, fontWeight: 700, lineHeight: 1.4,
              color: '#1a1a1a',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {book.title}
            </div>
            {authorName && (
              <div style={{
                fontSize: 8, color: '#555', opacity: 0.6,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {authorName}
              </div>
            )}
          </div>
        </div>
      );
    });
  }

  // ── Export: static snapshot ────────────────────────────────────────────────
  if (exportMode) {
    return (
      <div style={{
        width: CANVAS_W, height: CANVAS_H,
        background: '#f8f7f5',
        overflow: 'hidden', position: 'relative',
        perspective: `${PERSPECTIVE}px`,
        perspectiveOrigin: `50% ${VP_Y}`,
      }}>
        <div style={ringStyle}>{renderCards(allBooks)}</div>
      </div>
    );
  }

  // ── Live / interactive ─────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        width: CANVAS_W, height: CANVAS_H,
        background: '#f8f7f5',
        borderRadius: 8, overflow: 'hidden',
        position: 'relative',
        perspective: `${PERSPECTIVE}px`,
        perspectiveOrigin: `50% ${VP_Y}`,
        cursor: 'grab',
        userSelect: 'none',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Rotating ring — carries all cards */}
      <div ref={ringRef} style={ringStyle}>
        {renderCards(allBooks)}
      </div>

      {/* Hint */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 11, color: '#aaa', letterSpacing: '0.05em',
        pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap',
      }}>
        drag or scroll to rotate
      </div>
    </div>
  );
}
