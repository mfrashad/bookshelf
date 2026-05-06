'use client';

import { useState } from 'react';
import type { Shelf } from '@/lib/types';
import { hashColor, spineTextColor } from '@/lib/spine';
import { isBanned } from '@/data/banned-books';

const COVER_W = 84;
const COVER_H = 126; // 2:3 ratio

interface CoverGridProps {
  shelves: Shelf[];
  exportMode?: boolean;
  showBanned?: boolean;
  groupByYear?: boolean;
  draggingId?: string | null;
  onReorderBooks?: (draggedId: string, targetId: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

export function CoverGrid({ shelves, exportMode = false, showBanned = false, groupByYear: groupByYearProp = false, draggingId, onReorderBooks, onDragStart, onDragEnd }: CoverGridProps) {
  const [groupByYear, setGroupByYear] = useState(groupByYearProp);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const sorted = [...shelves]
    .filter((s) => s.books.length > 0)
    .sort((a, b) => b.title.localeCompare(a.title));

  const draggingBook = draggingId
    ? sorted.flatMap((s) => s.books).find((b) => (b.id as string) === draggingId) ?? null
    : null;

  if (sorted.length === 0) return null;

  const flatShelves: Shelf[] = groupByYear
    ? sorted
    : [{ title: 'All', books: sorted.flatMap((s) => s.books) }];

  return (
    <div style={{ padding: exportMode ? 32 : 16 }}>
      {!exportMode && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <button
            onClick={() => setGroupByYear((g) => !g)}
            style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
              border: '2px solid #000', padding: '3px 10px', cursor: 'pointer',
              background: groupByYear ? '#fff' : '#000',
              color: groupByYear ? '#000' : '#fff200',
              boxShadow: groupByYear ? '2px 2px 0px #000' : 'none',
              transition: 'all 0.1s',
            }}
          >
            {groupByYear ? 'Show all' : 'By year'}
          </button>
        </div>
      )}
      {flatShelves.map((shelf) => (
        <div key={shelf.title} style={{ marginBottom: 28 }}>
          {/* Year header — hidden in flat mode */}
          {groupByYear && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#44403c',
              marginBottom: 10,
              paddingBottom: 6,
              borderBottom: '1px solid #e7e5e4',
              display: 'flex',
              alignItems: 'baseline',
              gap: 8,
            }}
          >
            {shelf.title}
            <span style={{ fontWeight: 400, fontSize: 11, color: '#a8a29e' }}>
              {shelf.books.length} book{shelf.books.length !== 1 ? 's' : ''}
            </span>
          </div>
          )}

          {/* Book grid */}
          <div
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
            onDragLeave={(e) => {
              if (!exportMode && !e.currentTarget.contains(e.relatedTarget as Node)) setDragOverId(null);
            }}
          >
            {shelf.books.map((book, i) => {
              const color = hashColor(book.title);
              const textColor = spineTextColor(color);
              const initial = book.title.trim()[0]?.toUpperCase() ?? '?';
              const banned = showBanned && isBanned(book.title);

              return (
                <div
                  key={(book.id as string) ?? i}
                  data-testid="cover-grid-cell"
                  title={`${book.title}${book.authors?.[0]?.name ? ` — ${book.authors[0].name}` : ''}`}
                  draggable={!exportMode}
                  onDragStart={(e) => {
                    if (exportMode) return;
                    e.dataTransfer.setData('text/plain', book.id as string);
                    e.dataTransfer.effectAllowed = 'move';
                    onDragStart?.(book.id as string);
                  }}
                  onDragEnd={() => { if (!exportMode) { onDragEnd?.(); setDragOverId(null); } }}
                  onDragOver={(e) => {
                    if (!exportMode) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                      if (draggingId && draggingId !== (book.id as string)) setDragOverId(book.id as string);
                    }
                  }}
                  onDrop={(e) => {
                    if (exportMode) return;
                    e.preventDefault();
                    setDragOverId(null);
                    const draggedId = e.dataTransfer.getData('text/plain');
                    if (draggedId && draggedId !== (book.id as string)) onReorderBooks?.(draggedId, book.id as string);
                  }}
                  style={{
                    width: COVER_W,
                    height: COVER_H,
                    borderRadius: 4,
                    overflow: 'hidden',
                    flexShrink: 0,
                    boxShadow: banned
                      ? '0 0 0 2px #ce500a, 2px 3px 8px rgba(0,0,0,0.18)'
                      : '2px 3px 8px rgba(0,0,0,0.18)',
                    position: 'relative',
                    opacity: draggingId === (book.id as string) ? 0.35 : 1,
                    cursor: exportMode ? 'default' : 'grab',
                    transition: 'opacity 0.15s',
                  }}
                >
                  {/* Placeholder always rendered; img sits on top and hides it when loaded */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: color,
                      color: textColor,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 6px',
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{initial}</span>
                    <span
                      style={{
                        fontSize: 9,
                        fontWeight: 500,
                        opacity: 0.8,
                        textAlign: 'center',
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical' as const,
                        wordBreak: 'break-word' as const,
                      }}
                    >
                      {book.title}
                    </span>
                  </div>
                  {/* Banned badge */}
                  {banned && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 3,
                        right: 3,
                        fontSize: 12,
                        lineHeight: 1,
                        zIndex: 10,
                        background: 'rgba(255,255,255,0.85)',
                        borderRadius: '50%',
                        padding: 2,
                      }}
                    >
                      🚫
                    </div>
                  )}
                  {book.coverProxiedUrl && (
                    <img
                      src={book.coverProxiedUrl}
                      alt={book.title}
                      crossOrigin="anonymous"
                      loading={exportMode ? 'eager' : 'lazy'}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  {dragOverId === (book.id as string) && draggingBook && (draggingBook.id as string) !== (book.id as string) && (
                    <>
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 20, pointerEvents: 'none',
                        background: hashColor(draggingBook.title),
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '8px 6px', gap: 4,
                      }}>
                        <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1, color: spineTextColor(hashColor(draggingBook.title)) }}>
                          {draggingBook.title.trim()[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      {draggingBook.coverProxiedUrl && (
                        <img src={draggingBook.coverProxiedUrl} alt="" style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%',
                          objectFit: 'cover', zIndex: 21, pointerEvents: 'none',
                        }} />
                      )}
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 22, pointerEvents: 'none',
                        border: '2px dashed rgba(255,255,255,0.9)', borderRadius: 4,
                      }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
