'use client';

import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import type { Book, Shelf } from '@/lib/types';
import { hashColor, spineTextColor } from '@/lib/spine';
import { isBanned } from '@/data/banned-books';
import { useOpenAccess, getAccessInfo, type OpenAccessInfo } from '@/hooks/useOpenAccess';
import {
  BannedOverlay, BannedTooltip,
  PublicDomainOverlay, OpenAccessBadge,
  BANNED_RING, PUBLIC_DOMAIN_RING,
} from './BookBadges';

interface ScatterDriftProps {
  shelves: Shelf[];
  radius?: number;
  spacing?: number;
  showBanned?: boolean;
  showOpenAccess?: boolean;
  onBookSelect?: (book: Book) => void;
  exportMode?: boolean;
}

const CANVAS_W = 620;
const CX = CANVAS_W / 2;
const PAD = 30;
const DEFAULT_RADIUS  = 220;
const DEFAULT_SPACING = 20;
const AUTO_SPIN = 0.006;             // radians per frame at 60fps

function srnd(i: number, salt: number) {
  const v = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return (v - Math.floor(v)) * 2 - 1; // −1..1
}

// Per-book constants that never change regardless of rotation
interface BookConst {
  t: number;          // 0..1 position along helix axis
  baseAngle: number;  // angle offset within helix (rotation adds to this)
  y: number;          // fixed vertical position
  jx: number;         // fixed horizontal jitter
  rotJitter: number;  // seed for tilt direction/magnitude
}

function buildConstants(count: number, canvasH: number): BookConst[] {
  // ~2 turns for a tight visible helix curve; more turns → more horizontal gap
  const turns = Math.max(1, Math.round(count / 22));
  return Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    return {
      t,
      baseAngle: t * turns * 2 * Math.PI,
      y: PAD + t * (canvasH - PAD * 2) + srnd(i, 1) * 10,
      jx: srnd(i, 0) * 18,
      rotJitter: srnd(i, 2),
    };
  });
}

// Compute one book's visual props from its angle (rotation + baseAngle)
function bookProps(angle: number, rotJitter: number, radius: number) {
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const depthT = (sinA + 1) / 2;                 // 0 (back) → 1 (front)
  return {
    x:     CX + radius * cosA,
    depth: sinA,
    w:     34 + depthT * 20,                      // 34–54px
    h:     (34 + depthT * 20) * 1.32,
    alpha: 0.38 + depthT * 0.62,                  // ghosted (back) → solid (front)
    rot:   rotJitter * (4 + (1 - depthT) * 4),    // more tilt on the far back
    z:     Math.round(50 + sinA * 40),
  };
}

// Static snapshot for export (no animation)
function StaticView({ allBooks }: { allBooks: Book[] }) {
  const canvasH = PAD * 2 + DEFAULT_SPACING * Math.max(1, allBooks.length - 1);
  const consts = useMemo(() => buildConstants(allBooks.length, canvasH), [allBooks.length, canvasH]);
  const startRot = Math.PI;

  return (
    <div style={{ position: 'relative', width: CANVAS_W, height: canvasH }}>
      {allBooks.map((book, i) => {
        const c = consts[i];
        const { x, w, h, alpha, rot, z } = bookProps(startRot + c.baseAngle, c.rotJitter, DEFAULT_RADIUS);
        const fallbackBg = hashColor(book.title);
        const fallbackFg = spineTextColor(fallbackBg);
        return (
          <div
            key={book.id as string}
            style={{
              position: 'absolute',
              left: x + c.jx,
              top: c.y,
              width: w,
              height: h,
              opacity: alpha,
              zIndex: z,
              overflow: 'hidden',
              borderRadius: 2,
              transform: `translate(-50%,-50%) rotate(${rot}deg)`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
            }}
          >
            <BookFace book={book} w={w} fallbackBg={fallbackBg} fallbackFg={fallbackFg} />
          </div>
        );
      })}
    </div>
  );
}

// Per-card component so hover state doesn't cause full ScatterDrift re-renders
const ScatterCard = forwardRef<HTMLDivElement, {
  book: Book;
  initStyle: React.CSSProperties;
  showBanned: boolean;
  showOpenAccess: boolean;
  accessInfo: OpenAccessInfo | null;
  fallbackBg: string;
  fallbackFg: string;
  initW: number;
  onClick: () => void;
}>(function ScatterCard({ book, initStyle, showBanned, showOpenAccess, accessInfo, fallbackBg, fallbackFg, initW, onClick }, ref) {
  const [hovered, setHovered] = useState(false);
  const banned   = showBanned && isBanned(book.title);
  const isPublic = showOpenAccess && accessInfo?.access === 'public';
  const ring     = banned ? BANNED_RING : isPublic ? PUBLIC_DOMAIN_RING : null;
  const baseShadow = '0 2px 8px rgba(0,0,0,0.09), 0 1px 2px rgba(0,0,0,0.05)';
  const hoverShadow = '0 6px 22px rgba(0,0,0,0.18)';

  return (
    <div
      ref={ref}
      title={`${book.title}${book.authors?.[0]?.name ? ` — ${book.authors[0].name}` : ''}`}
      onClick={onClick}
      onMouseEnter={(e) => {
        setHovered(true);
        (e.currentTarget as HTMLElement).style.boxShadow = ring ? `${ring}, ${hoverShadow}` : hoverShadow;
      }}
      onMouseLeave={(e) => {
        setHovered(false);
        (e.currentTarget as HTMLElement).style.boxShadow = ring ? `${ring}, ${baseShadow}` : baseShadow;
      }}
      style={{
        ...initStyle,
        boxShadow: ring ? `${ring}, ${baseShadow}` : baseShadow,
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Inner: overflow:hidden for cover clipping */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 2 }}>
        <BookFace book={book} w={initW} fallbackBg={fallbackBg} fallbackFg={fallbackFg} />
        {banned && <BannedOverlay />}
        {isPublic && !banned && <PublicDomainOverlay />}
      </div>
      {/* Outside overflow:hidden */}
      {banned && <BannedTooltip title={book.title} show={hovered} />}
      {isPublic && accessInfo && <OpenAccessBadge info={accessInfo} isbn={book.isbn} />}
    </div>
  );
});

function BookFace({ book, w, fallbackBg, fallbackFg }: { book: Book; w: number; fallbackBg: string; fallbackFg: string }) {
  const initial = book.title.trim()[0]?.toUpperCase() ?? '?';
  return (
    <>
      <div style={{
        position: 'absolute', inset: 0,
        background: fallbackBg, color: fallbackFg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '3px 2px', gap: 1,
      }}>
        <span style={{ fontSize: Math.max(9, w * 0.26), fontWeight: 700, lineHeight: 1 }}>{initial}</span>
        <span style={{
          fontSize: Math.max(5, w * 0.09), fontWeight: 500, opacity: 0.8,
          textAlign: 'center', lineHeight: 1.2, overflow: 'hidden',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical' as const, wordBreak: 'break-word' as const,
        }}>{book.title}</span>
      </div>
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
    </>
  );
}

export function ScatterDrift({ shelves, radius = DEFAULT_RADIUS, spacing = DEFAULT_SPACING, showBanned = false, showOpenAccess = true, onBookSelect, exportMode = false }: ScatterDriftProps) {
  const allBooks = useMemo(() =>
    [...shelves]
      .filter((s) => s.books.length > 0)
      .sort((a, b) => b.title.localeCompare(a.title))
      .flatMap((s) => s.books),
    [shelves]
  );

  const canvasH    = PAD * 2 + spacing * Math.max(1, allBooks.length - 1);
  const consts     = useMemo(() => buildConstants(allBooks.length, canvasH), [allBooks.length, canvasH]);
  const openAccess = useOpenAccess(exportMode ? [] : allBooks);

  // Year band markers — nominal y without jitter
  const yearMarkers = useMemo(() => {
    const count = allBooks.length;
    const sorted = [...shelves]
      .filter((s) => s.books.length > 0)
      .sort((a, b) => b.title.localeCompare(a.title));
    const nomY = (idx: number) => {
      const t = count <= 1 ? 0.5 : idx / (count - 1);
      return PAD + t * (canvasH - PAD * 2);
    };
    let idx = 0;
    return sorted.map((shelf) => {
      const startIdx  = idx;
      idx += shelf.books.length;
      const startY    = nomY(startIdx);
      const boundaryY = startIdx === 0 ? null : (nomY(startIdx - 1) + nomY(startIdx)) / 2;
      return { year: shelf.title, startY, boundaryY };
    });
  }, [shelves, allBooks.length, canvasH]);

  // DOM refs — updated directly each frame, bypassing React renders
  const bookRefs  = useRef<(HTMLDivElement | null)[]>([]);
  const radiusRef = useRef(radius);
  useEffect(() => { radiusRef.current = radius; }, [radius]);

  // Animation state (all mutable refs, no state)
  const rotRef        = useRef(Math.PI);
  const velRef        = useRef(0);
  const dragging      = useRef(false);
  const lastX         = useRef(0);
  const rafRef        = useRef<number>(0);

  useEffect(() => {
    if (exportMode) return;

    function frame() {
      if (!dragging.current) {
        velRef.current += (AUTO_SPIN - velRef.current) * 0.04;
      }
      rotRef.current += velRef.current;

      consts.forEach((c, i) => {
        const el = bookRefs.current[i];
        if (!el) return;
        const angle = rotRef.current + c.baseAngle;
        const { x, w, h, alpha, rot, z } = bookProps(angle, c.rotJitter, radiusRef.current);
        const px = x + c.jx;

        el.style.left    = `${px}px`;
        el.style.top     = `${c.y}px`;
        el.style.width   = `${w}px`;
        el.style.height  = `${h}px`;
        el.style.opacity = `${alpha}`;
        el.style.zIndex  = `${z}`;
        el.style.transform = `translate(-50%,-50%) rotate(${rot}deg)`;
      });

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [allBooks, consts, exportMode]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true;
    lastX.current = e.clientX;
    velRef.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const dx = e.clientX - lastX.current;
    const delta = dx * 0.009;
    rotRef.current += delta;
    velRef.current = delta;       // remember last delta for release-inertia
    lastX.current = e.clientX;
  }
  function onPointerUp() {
    dragging.current = false;
    // velRef carries the last drag delta → inertia naturally decays toward AUTO_SPIN
  }

  if (allBooks.length === 0) return null;

  if (exportMode) {
    return (
      <div style={{ background: '#fff', display: 'flex', justifyContent: 'center' }}>
        <StaticView allBooks={allBooks} />
      </div>
    );
  }

  return (
    <div
      style={{ background: '#fff', borderRadius: 8, overflow: 'hidden', userSelect: 'none', display: 'flex', justifyContent: 'center', cursor: 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Hint */}
      <div style={{
        position: 'absolute',
        top: 148,
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: 11,
        color: '#bbb',
        letterSpacing: '0.05em',
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}>
        drag to rotate
      </div>

      <div style={{ position: 'relative', width: CANVAS_W, height: canvasH }}>
        {/* Year labels — at the start of each year's range */}
        {yearMarkers.map(({ year, boundaryY, startY }) => (
          <div
            key={year}
            style={{
              position: 'absolute',
              top: boundaryY ?? startY,
              left: 0,
              transform: 'translateY(-50%)',
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            <div style={{
              padding: '2px 8px 2px 6px',
              fontSize: 10,
              fontWeight: 700,
              color: 'rgba(0,0,0,0.28)',
              letterSpacing: '0.04em',
              fontFamily: 'var(--font-display, sans-serif)',
              userSelect: 'none',
            }}>
              {year}
            </div>
          </div>
        ))}
        {allBooks.map((book, i) => {
          const fallbackBg = hashColor(book.title);
          const fallbackFg = spineTextColor(fallbackBg);
          // Initial props (frame loop will overwrite instantly)
          const c = consts[i];
          const init = bookProps(rotRef.current + c.baseAngle, c.rotJitter, radius);
          return (
            <ScatterCard
              key={book.id as string}
              ref={(el) => { bookRefs.current[i] = el; }}
              book={book}
              showBanned={showBanned}
              showOpenAccess={showOpenAccess}
              accessInfo={getAccessInfo(openAccess, book)}
              fallbackBg={fallbackBg}
              fallbackFg={fallbackFg}
              initW={init.w}
              initStyle={{
                position: 'absolute',
                left: init.x + c.jx,
                top: c.y,
                width: init.w,
                height: init.h,
                opacity: init.alpha,
                zIndex: init.z,
                borderRadius: 2,
                transform: `translate(-50%,-50%) rotate(${init.rot}deg)`,
              }}
              onClick={() => onBookSelect?.(book)}
            />
          );
        })}
      </div>
    </div>
  );
}
