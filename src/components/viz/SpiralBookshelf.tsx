'use client';

import { useState } from 'react';
import type { Book, Shelf } from '@/lib/types';
import { hashColor, spineTextColor } from '@/lib/spine';
import { isBanned } from '@/data/banned-books';

interface SpiralBookshelfProps {
  shelves: Shelf[];
  showBanned?: boolean;
  onBookSelect?: (book: Book) => void;
}

// Each shelf row is placed on the surface of a vertical cylinder.
// rotateY(–θ) positions the row's normal outward at angle θ.
// translateZ(R) places it on the cylinder surface.
// The cylinder axis runs through the center of the container.
const COVER_W = 74;
const COVER_H = 112;
const SHELF_H = 14;
const BOOKS_PER_ROW = 7;
const R = 360;            // cylinder radius (px)
const ANGLE_PER_ROW = 15; // degrees of arc per shelf level
const ROW_GAP = 138;      // vertical distance between shelf tops
const PERSPECTIVE = 950;

export function SpiralBookshelf({ shelves, showBanned = false, onBookSelect }: SpiralBookshelfProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const allBooks = [...shelves]
    .filter((s) => s.books.length > 0)
    .sort((a, b) => b.title.localeCompare(a.title))
    .flatMap((s) => s.books);

  if (allBooks.length === 0) return null;

  const rows: Book[][] = [];
  for (let i = 0; i < allBooks.length; i += BOOKS_PER_ROW) {
    rows.push(allBooks.slice(i, i + BOOKS_PER_ROW));
  }

  const ROW_W = BOOKS_PER_ROW * (COVER_W + 3);
  // Container must be wide enough for the most-rotated shelf level
  // At 90° the shelf is at x = R to the right; we also need the row half-width
  const canvasW = R + ROW_W + 80;
  const canvasH = rows.length * ROW_GAP + COVER_H + SHELF_H + 60;

  return (
    <div style={{ background: '#0e0905', borderRadius: 8, overflow: 'hidden', userSelect: 'none' }}>
      <div
        style={{
          // Viewer: slightly above and to the left so you see the spiral unwrap to the right
          perspective: PERSPECTIVE,
          perspectiveOrigin: '38% 8%',
          padding: '48px 20px 20px 48px',
          overflowX: 'auto',
        }}
      >
        {/* Tilt slightly downward to make shelves visible */}
        <div
          style={{
            position: 'relative',
            width: canvasW,
            height: canvasH,
            transformStyle: 'preserve-3d',
            transform: 'rotateX(18deg)',
          }}
        >
          {rows.map((rowBooks, rowIdx) => {
            // θ increases per row → rows progressively wrap around the cylinder
            const theta = rowIdx * ANGLE_PER_ROW; // degrees

            return (
              // Center each row on the cylinder axis (left: 50%, marginLeft centres it).
              // rotateY(-θ) then translateZ(R) places the row on the cylinder surface.
              <div
                key={rowIdx}
                style={{
                  position: 'absolute',
                  top: rowIdx * ROW_GAP,
                  left: '50%',
                  marginLeft: -ROW_W / 2,
                  width: ROW_W,
                  height: COVER_H + SHELF_H,
                  transformStyle: 'preserve-3d',
                  // Right-to-left: first translateZ(R), then rotateY(-θ)
                  // ⟹ row moves to cylinder surface, then rotates to face outward
                  transform: `rotateY(${-theta}deg) translateZ(${R}px)`,
                }}
              >
                {/* Books */}
                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', paddingBottom: SHELF_H }}>
                  {rowBooks.map((book) => {
                    const isHovered = hoveredId === (book.id as string);
                    const banned = showBanned && isBanned(book.title);
                    const fallbackBg = hashColor(book.title);
                    const fallbackFg = spineTextColor(fallbackBg);

                    return (
                      <div
                        key={book.id as string}
                        title={`${book.title}${book.authors?.[0]?.name ? ` — ${book.authors[0].name}` : ''}`}
                        onClick={() => onBookSelect?.(book)}
                        onMouseEnter={() => setHoveredId(book.id as string)}
                        onMouseLeave={() => setHoveredId(null)}
                        style={{
                          width: COVER_W,
                          height: COVER_H,
                          flexShrink: 0,
                          cursor: onBookSelect ? 'pointer' : 'default',
                          overflow: 'hidden',
                          borderRadius: '2px 3px 3px 2px',
                          position: 'relative',
                          top: isHovered ? -9 : 0,
                          transition: 'top 0.14s ease, box-shadow 0.14s ease',
                          boxShadow: banned
                            ? `0 0 0 2px #ce500a, ${isHovered ? '4px 8px 20px rgba(0,0,0,0.9)' : '2px 3px 8px rgba(0,0,0,0.55)'}`
                            : isHovered
                            ? '4px 8px 20px rgba(0,0,0,0.9)'
                            : '2px 3px 8px rgba(0,0,0,0.55)',
                        }}
                      >
                        {/* Colour fallback */}
                        <div
                          style={{
                            position: 'absolute', inset: 0,
                            background: fallbackBg, color: fallbackFg,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            padding: '6px 4px', gap: 3,
                          }}
                        >
                          <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>
                            {book.title.trim()[0]?.toUpperCase() ?? '?'}
                          </span>
                          <span
                            style={{
                              fontSize: 7.5, fontWeight: 500, opacity: 0.8,
                              textAlign: 'center', lineHeight: 1.3,
                              overflow: 'hidden', display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical' as const,
                              wordBreak: 'break-word' as const,
                            }}
                          >
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
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                        )}

                        {banned && (
                          <div style={{ position: 'absolute', top: 3, right: 3, fontSize: 11, zIndex: 10, background: 'rgba(255,255,255,0.85)', borderRadius: '50%', padding: 2 }}>
                            🚫
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Wooden shelf board */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: -14,
                    right: -14,
                    height: SHELF_H,
                    background: 'linear-gradient(to bottom, #c07838 0%, #8b4513 35%, #4e2008 100%)',
                    borderRadius: 3,
                    boxShadow: '0 5px 16px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.12)',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
