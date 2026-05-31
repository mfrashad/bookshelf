'use client';

import { useMemo, useState } from 'react';
import type { Book, Shelf } from '@/lib/types';
import { hashColor, spineTextColor } from '@/lib/spine';
import { isBanned } from '@/data/banned-books';
import { useOpenAccess, getAccessInfo, type OpenAccessInfo } from '@/hooks/useOpenAccess';
import {
  BannedOverlay, BannedTooltip,
  PublicDomainOverlay, OpenAccessBadge,
  BANNED_RING, PUBLIC_DOMAIN_RING,
} from './BookBadges';

const COVER_W = 84;
const COVER_H = 126;

interface CoverGridProps {
  shelves: Shelf[];
  columns?: number;
  exportMode?: boolean;
  showBanned?: boolean;
  showOpenAccess?: boolean;
  groupByYear?: boolean;
  draggingId?: string | null;
  onReorderBooks?: (draggedId: string, targetId: string) => void;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
}

function CoverCard({
  book, exportMode, showBanned, showOpenAccess, access,
  draggingId, draggingBook, dragOverId,
  onDragStart, onDragEnd, onDragOver, onDrop,
}: {
  book: Book;
  exportMode: boolean;
  showBanned: boolean;
  showOpenAccess: boolean;
  access: OpenAccessInfo | null;
  draggingId: string | null | undefined;
  draggingBook: Book | null;
  dragOverId: string | null;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: (draggedId: string) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color     = hashColor(book.title);
  const textColor = spineTextColor(color);
  const initial   = book.title.trim()[0]?.toUpperCase() ?? '?';
  const banned    = showBanned && isBanned(book.title);
  const isPublic  = showOpenAccess && access?.access === 'public';

  const ring = banned ? BANNED_RING : isPublic ? PUBLIC_DOMAIN_RING : null;
  const baseShadow = '2px 3px 8px rgba(0,0,0,0.18)';

  return (
    <div
      data-testid="cover-grid-cell"
      title={`${book.title}${book.authors?.[0]?.name ? ` — ${book.authors[0].name}` : ''}`}
      draggable={!exportMode}
      onMouseEnter={() => { if (!exportMode) setHovered(true); }}
      onMouseLeave={() => setHovered(false)}
      onDragStart={(e) => {
        if (exportMode) return;
        e.dataTransfer.setData('text/plain', book.id as string);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={() => { if (!exportMode) onDragEnd(); }}
      onDragOver={(e) => {
        if (!exportMode) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; onDragOver(); }
      }}
      onDrop={(e) => {
        if (exportMode) return;
        e.preventDefault();
        onDrop(e.dataTransfer.getData('text/plain'));
      }}
      style={{
        width: COVER_W, height: COVER_H,
        flexShrink: 0, position: 'relative',
        opacity: draggingId === (book.id as string) ? 0.35 : 1,
        cursor: exportMode ? 'default' : 'grab',
        transition: 'opacity 0.15s',
      }}
    >
      {/* Visual card — overflow:hidden for cover image clipping */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: ring ? `${ring}, ${baseShadow}` : baseShadow,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: color, color: textColor,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '8px 6px', gap: 4,
        }}>
          <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1 }}>{initial}</span>
          <span style={{
            fontSize: 9, fontWeight: 500, opacity: 0.8,
            textAlign: 'center', lineHeight: 1.3, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical' as const, wordBreak: 'break-word' as const,
          }}>
            {book.title}
          </span>
        </div>
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
        {banned && <BannedOverlay />}
        {isPublic && !banned && <PublicDomainOverlay />}
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
      {/* Overlays outside overflow:hidden so tooltips show */}
      {banned && <BannedTooltip title={book.title} show={hovered} />}
      {isPublic && access && <OpenAccessBadge info={access} isbn={book.isbn} />}
    </div>
  );
}

export function CoverGrid({ shelves, columns = 7, exportMode = false, showBanned = false, showOpenAccess = true, groupByYear: groupByYearProp = false, draggingId, onReorderBooks, onDragStart, onDragEnd }: CoverGridProps) {
  const [groupByYear, setGroupByYear] = useState(groupByYearProp);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const allBooks = useMemo(() => shelves.flatMap((s) => s.books), [shelves]);
  const openAccess = useOpenAccess(exportMode ? [] : allBooks);

  const sorted = [...shelves].filter((s) => s.books.length > 0).sort((a, b) => b.title.localeCompare(a.title));
  const draggingBook = draggingId ? sorted.flatMap((s) => s.books).find((b) => (b.id as string) === draggingId) ?? null : null;

  if (sorted.length === 0) return null;

  const flatShelves: Shelf[] = groupByYear ? sorted : [{ title: 'All', books: sorted.flatMap((s) => s.books) }];

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
          {groupByYear && (
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#44403c',
              marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid #e7e5e4',
              display: 'flex', alignItems: 'baseline', gap: 8,
            }}>
              {shelf.title}
              <span style={{ fontWeight: 400, fontSize: 11, color: '#a8a29e' }}>
                {shelf.books.length} book{shelf.books.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div
            style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, ${COVER_W}px)`, gap: 8, width: 'fit-content', margin: '0 auto' }}
            onDragLeave={(e) => {
              if (!exportMode && !e.currentTarget.contains(e.relatedTarget as Node)) setDragOverId(null);
            }}
          >
            {shelf.books.map((book) => (
              <CoverCard
                key={book.id as string}
                book={book}
                exportMode={exportMode}
                showBanned={showBanned}
                showOpenAccess={showOpenAccess}
                access={getAccessInfo(openAccess, book)}
                draggingId={draggingId}
                draggingBook={draggingBook}
                dragOverId={dragOverId}
                onDragStart={() => onDragStart?.(book.id as string)}
                onDragEnd={() => { onDragEnd?.(); setDragOverId(null); }}
                onDragOver={() => { if (draggingId && draggingId !== (book.id as string)) setDragOverId(book.id as string); }}
                onDrop={(draggedId) => { setDragOverId(null); if (draggedId && draggedId !== (book.id as string)) onReorderBooks?.(draggedId, book.id as string); }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
