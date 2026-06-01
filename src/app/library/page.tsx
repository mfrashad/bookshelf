'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { UserButton, SignInButton } from '@clerk/nextjs';
import BookStackChart from '@/components/viz/BookStackChart';
import { CoverGrid } from '@/components/viz/CoverGrid';
import { WallShelf } from '@/components/viz/WallShelf';
import { MosaicGrid } from '@/components/viz/MosaicGrid';
import { ScatterDrift } from '@/components/viz/ScatterDrift';
import { ExportSurface } from '@/components/export/ExportSurface';
import { LiteracyBanner } from '@/components/social/LiteracyBanner';
import { PledgeModal } from '@/components/social/PledgeModal';
import { SignInNudgeModal } from '@/components/social/SignInNudgeModal';
import { useLibrary } from '@/hooks/useLibrary';
import { useOpenAccess, getAccessInfo } from '@/hooks/useOpenAccess';
import { isBanned } from '@/data/banned-books';
import type { AspectRatio, Book, VizMode } from '@/lib/types';
import { ASPECT_RATIO_DIMS } from '@/lib/types';
import type { StoredBook } from '@/lib/local-storage';
import { encodeShelves } from '@/lib/embed';

const VIZ_MODES: { id: VizMode; label: string; icon: string }[] = [
  { id: 'stack',   label: 'Stack Chart',  icon: '📊' },
  { id: 'grid',    label: 'Cover Grid',   icon: '🖼️' },
  { id: 'wall',    label: 'Wall Shelf',   icon: '🪟' },
  { id: 'mosaic',  label: 'Mosaic',       icon: '◼️' },
  { id: 'scatter', label: 'Spiral Drift', icon: '🌀' },
];

export default function LibraryPage() {
  const [vizMode, setVizMode] = useState<VizMode>('stack');
  const [showExport, setShowExport] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);
  const [exportRatio, setExportRatio] = useState<AspectRatio>('square');
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [selectedBook, setSelectedBook] = useState<StoredBook | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showBanned, setShowBanned] = useState(false);
  const [showOpenAccess, setShowOpenAccess] = useState(true);
  const [perRow, setPerRow] = useState(7);
  const [helixRadius, setHelixRadius] = useState(220);
  const [helixSpacing, setHelixSpacing] = useState(20);
  const [hiddenBookIds, setHiddenBookIds] = useState<string[]>([]);
  const [bookOrder, setBookOrder] = useState<string[]>([]);
  const [draggingBookId, setDraggingBookId] = useState<string | null>(null);

  const { shelves, books, isGuest, loaded, bookCount, addBook, updateBook, moveBook, clearLibrary } = useLibrary();

  // Restore state from storage
  useEffect(() => {
    setShowBanned(sessionStorage.getItem('book-poster:show-banned') === '1');
    setShowOpenAccess(sessionStorage.getItem('book-poster:show-open-access') !== '0');
    const savedPerRow = sessionStorage.getItem('book-poster:per-row');
    if (savedPerRow) setPerRow(Number(savedPerRow));
    const savedRadius = sessionStorage.getItem('book-poster:helix-radius');
    if (savedRadius) setHelixRadius(Number(savedRadius));
    const savedSpacing = sessionStorage.getItem('book-poster:helix-spacing');
    if (savedSpacing) setHelixSpacing(Number(savedSpacing));
    try {
      const hidden = localStorage.getItem('book-poster:hidden-books');
      if (hidden) setHiddenBookIds(JSON.parse(hidden));
      const order = localStorage.getItem('book-poster:book-order');
      if (order) setBookOrder(JSON.parse(order));
    } catch {}
  }, []);

  function toggleBanned(on: boolean) {
    setShowBanned(on);
    if (on) sessionStorage.setItem('book-poster:show-banned', '1');
    else sessionStorage.removeItem('book-poster:show-banned');
  }

  function toggleOpenAccess(on: boolean) {
    setShowOpenAccess(on);
    if (!on) sessionStorage.setItem('book-poster:show-open-access', '0');
    else sessionStorage.removeItem('book-poster:show-open-access');
  }

  const displayShelves = useMemo(() => {
    const hiddenSet = new Set(hiddenBookIds);
    if (hiddenSet.size === 0 && bookOrder.length === 0) return shelves;
    const orderMap = new Map(bookOrder.map((id, i) => [id, i]));
    return shelves.map(shelf => ({
      ...shelf,
      books: shelf.books
        .filter(b => !hiddenSet.has(b.id as string))
        .sort((a, b) => {
          const ia = orderMap.get(a.id as string) ?? Infinity;
          const ib = orderMap.get(b.id as string) ?? Infinity;
          return ia - ib;
        }),
    })).filter(s => s.books.length > 0);
  }, [shelves, hiddenBookIds, bookOrder]);

  const showGuestBanner = isGuest && !dismissedBanner && bookCount > 0;
  const isEmpty = loaded && bookCount === 0;

  const bannedCount = books.filter((b) => isBanned(b.title)).length;

  const openAccessResults = useOpenAccess(loaded ? books : []);
  const publicDomainBooks = useMemo(
    () => books.filter((b) => getAccessInfo(openAccessResults, b)?.access === 'public'),
    [books, openAccessResults],
  );

  if (isEmpty && confirmClear) setConfirmClear(false);

  function handleBookSelect(book: Book) {
    const stored = books.find((b) => b.id === (book.id as string));
    if (stored) setSelectedBook(stored);
  }

  function handleMoveBook(bookId: string, toYear: number) {
    moveBook(bookId, toYear, 9999);
  }

  function handleHideBook(id: string) {
    const next = [...hiddenBookIds, id];
    setHiddenBookIds(next);
    localStorage.setItem('book-poster:hidden-books', JSON.stringify(next));
    setDraggingBookId(null);
  }

  function handleReorderBooks(draggedId: string, targetId: string) {
    if (draggedId === targetId) return;
    const flat = displayShelves.flatMap(s => s.books.map(b => b.id as string));
    const fromIdx = flat.indexOf(draggedId);
    const toIdx = flat.indexOf(targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const newFlat = [...flat];
    newFlat.splice(fromIdx, 1);
    newFlat.splice(toIdx, 0, draggedId);
    setBookOrder(newFlat);
    localStorage.setItem('book-poster:book-order', JSON.stringify(newFlat));
  }

  function handleResetView() {
    setHiddenBookIds([]);
    setBookOrder([]);
    localStorage.removeItem('book-poster:hidden-books');
    localStorage.removeItem('book-poster:book-order');
  }

  return (
    <div className="min-h-screen flex flex-col">

      {/* Literacy modal — fixed overlay, position in DOM is irrelevant */}
      {loaded && <LiteracyBanner bookCount={bookCount} />}

      {/* Top nav */}
      <header className="flex items-center justify-between px-5 py-2.5 flex-wrap gap-2" style={{ background: '#fff200', borderBottom: '2px solid #000' }}>
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#000', textDecoration: 'none', letterSpacing: '-0.01em' }}>
            Bookshelf
          </Link>
          <nav className="flex gap-1">
            {VIZ_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setVizMode(m.id)}
                style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                  border: '2px solid #000', padding: '3px 12px', cursor: 'pointer',
                  background: vizMode === m.id ? '#000' : 'transparent',
                  color: vizMode === m.id ? '#fff200' : '#000',
                  boxShadow: vizMode === m.id ? 'none' : '2px 2px 0px #000',
                  transition: 'all 0.1s',
                }}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            data-testid="add-book-button"
            onClick={() => setShowAddBook(true)}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, border: '2px solid #000', padding: '4px 12px', background: '#fff', color: '#000', cursor: 'pointer', boxShadow: '2px 2px 0px #000' }}
          >
            + Add book
          </button>
          <Link
            href="/onboarding"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, border: '2px solid #000', padding: '4px 12px', background: '#fff', color: '#000', textDecoration: 'none', boxShadow: '2px 2px 0px #000' }}
          >
            Import
          </Link>
          <Link href="/give" style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#000', textDecoration: 'underline', padding: '4px 4px' }}>
            Give books
          </Link>
          {!isEmpty && !confirmClear && (
            <button
              onClick={() => setConfirmClear(true)}
              style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#666', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 4px' }}
            >
              Clear
            </button>
          )}
          {confirmClear && (
            <div className="flex items-center gap-1.5">
              <span style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#000' }}>Clear all?</span>
              <button
                onClick={() => { clearLibrary(); setConfirmClear(false); }}
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, border: '2px solid #000', padding: '2px 10px', background: '#ffc0a1', color: '#000', cursor: 'pointer' }}
              >
                Yes, clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#666', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          )}
          {!isEmpty && (
            <>
              <button
                onClick={() => setShowEmbed(true)}
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, border: '2px solid #000', padding: '4px 12px', background: '#fff', color: '#000', cursor: 'pointer', boxShadow: '2px 2px 0px #000' }}
              >
                &lt;/&gt; Share
              </button>
              <button
                onClick={() => setShowExport(true)}
                style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, border: '2px solid #000', padding: '4px 14px', background: '#000', color: '#fff200', cursor: 'pointer', boxShadow: '2px 2px 0px #666' }}
              >
                Export image
              </button>
            </>
          )}
          {isGuest ? (
            <SignInButton mode="modal">
              <button style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, border: '2px solid #000', padding: '4px 12px', background: '#fff', color: '#000', cursor: 'pointer', boxShadow: '2px 2px 0px #000' }}>
                Sign in
              </button>
            </SignInButton>
          ) : (
            <UserButton />
          )}
        </div>
      </header>

      {/* Toolbar strip */}
      {!isEmpty && (
        <div style={{ borderBottom: '2px solid #000', background: '#fff', padding: '6px 24px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#333' }}>
            <input
              data-testid="banned-books-toggle"
              type="checkbox"
              checked={showBanned}
              onChange={(e) => toggleBanned(e.target.checked)}
              style={{ accentColor: '#000' }}
            />
            Show challenged books 🔍
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#333' }}>
            <input
              type="checkbox"
              checked={showOpenAccess}
              onChange={(e) => toggleOpenAccess(e.target.checked)}
              style={{ accentColor: '#000' }}
            />
            Show public domain badges 📖
          </label>
          {(['grid', 'wall', 'mosaic'] as const).includes(vizMode as 'grid' | 'wall' | 'mosaic') && (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none', fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#333' }}>
                Per row
                <input
                  type="range"
                  min={3}
                  max={15}
                  step={1}
                  value={perRow}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPerRow(v);
                    sessionStorage.setItem('book-poster:per-row', String(v));
                  }}
                  style={{ width: 90, accentColor: '#000', cursor: 'pointer' }}
                />
                <span style={{ minWidth: 16, textAlign: 'right', fontWeight: 700 }}>{perRow}</span>
              </label>
              {perRow !== 7 && (
                <button
                  onClick={() => { setPerRow(7); sessionStorage.removeItem('book-poster:per-row'); }}
                  style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', textDecoration: 'underline' }}
                >
                  Reset
                </button>
              )}
            </>
          )}
          {vizMode === 'scatter' && (
            <>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none', fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#333' }}>
                Radius
                <input
                  type="range"
                  min={60}
                  max={300}
                  step={5}
                  value={helixRadius}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setHelixRadius(v);
                    sessionStorage.setItem('book-poster:helix-radius', String(v));
                  }}
                  style={{ width: 90, accentColor: '#000', cursor: 'pointer' }}
                />
                <span style={{ minWidth: 28, textAlign: 'right', fontWeight: 700 }}>{helixRadius}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, userSelect: 'none', fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#333' }}>
                Spacing
                <input
                  type="range"
                  min={6}
                  max={60}
                  step={1}
                  value={helixSpacing}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setHelixSpacing(v);
                    sessionStorage.setItem('book-poster:helix-spacing', String(v));
                  }}
                  style={{ width: 90, accentColor: '#000', cursor: 'pointer' }}
                />
                <span style={{ minWidth: 28, textAlign: 'right', fontWeight: 700 }}>{helixSpacing}</span>
              </label>
              {(helixRadius !== 220 || helixSpacing !== 20) && (
                <button
                  onClick={() => {
                    setHelixRadius(220); setHelixSpacing(20);
                    sessionStorage.removeItem('book-poster:helix-radius');
                    sessionStorage.removeItem('book-poster:helix-spacing');
                  }}
                  style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', textDecoration: 'underline' }}
                >
                  Reset
                </button>
              )}
            </>
          )}
          {hiddenBookIds.length > 0 && (
            <span style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#888' }}>
              {hiddenBookIds.length} book{hiddenBookIds.length !== 1 ? 's' : ''} hidden
            </span>
          )}
          {(hiddenBookIds.length > 0 || bookOrder.length > 0) && (
            <button
              onClick={handleResetView}
              style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, border: '2px solid #000', padding: '2px 8px', cursor: 'pointer', background: '#fff', color: '#000', boxShadow: '2px 2px 0px #000' }}
            >
              Reset view
            </button>
          )}
          {/* Sign-in nudge — right-aligned, only for guests */}
          {showGuestBanner && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#888' }}>
              Saved in browser only ·{' '}
              <SignInButton mode="modal">
                <button style={{ fontWeight: 700, color: '#000', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-geist, sans-serif)', padding: 0 }}>
                  Sign in
                </button>
              </SignInButton>
              {' '}to sync
            </div>
          )}
        </div>
      )}

      {/* Banned books banner */}
      {showBanned && bannedCount > 0 && (
        <div
          data-testid="banned-books-banner"
          style={{ background: '#ffc0a1', border: '2px solid #000', borderTop: 'none', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}
        >
          <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#000', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700 }}>{bannedCount} book{bannedCount !== 1 ? 's' : ''}</span> in your library
            {' '}ha{bannedCount !== 1 ? 've' : 's'} been challenged or banned somewhere in the world.
            Reading them is an act of freedom.
          </p>
          <a
            href="https://www.ala.org/advocacy/bbooks"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#000', textDecoration: 'underline', whiteSpace: 'nowrap' }}
          >
            Learn more →
          </a>
        </div>
      )}

      {/* Public domain banner */}
      {showOpenAccess && publicDomainBooks.length > 0 && (
        <div style={{ background: '#d1fae5', border: '2px solid #000', borderTop: 'none', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#000', lineHeight: 1.5 }}>
            <span style={{ fontWeight: 700 }}>{publicDomainBooks.length} book{publicDomainBooks.length !== 1 ? 's' : ''}</span> in your library
            {' '}{publicDomainBooks.length === 1 ? 'is' : 'are'} in the public domain —{' '}
            {publicDomainBooks.length === 1 ? "it's" : "they're"} free to read online for anyone, anywhere.{' '}
            {publicDomainBooks.slice(0, 3).map((b, i) => {
              const info = getAccessInfo(openAccessResults, b);
              return (
                <span key={b.id as string}>
                  {i > 0 && ', '}
                  <a
                    href={info?.url ?? `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(b.title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#000', fontWeight: 600, textDecoration: 'underline' }}
                  >
                    {b.title}
                  </a>
                </span>
              );
            })}
            {publicDomainBooks.length > 3 && ` and ${publicDomainBooks.length - 3} more`}.
          </p>
          <a
            href="https://www.gutenberg.org"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#000', textDecoration: 'underline', whiteSpace: 'nowrap' }}
          >
            Browse Project Gutenberg →
          </a>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col px-6 py-4">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {vizMode === 'stack' && (
              <BookStackChart
                shelves={displayShelves}
                showBanned={showBanned}
                showOpenAccess={showOpenAccess}
                onBookSelect={handleBookSelect}
                onMoveBook={handleMoveBook}
                onHideBook={handleHideBook}
              />
            )}
            {vizMode === 'grid' && (
              <CoverGrid
                shelves={displayShelves}
                columns={perRow}
                showBanned={showBanned}
                showOpenAccess={showOpenAccess}
                draggingId={draggingBookId}
                onDragStart={(id) => setDraggingBookId(id)}
                onDragEnd={() => setDraggingBookId(null)}
                onReorderBooks={handleReorderBooks}
              />
            )}
            {vizMode === 'wall' && (
              <WallShelf
                shelves={displayShelves}
                perRow={perRow}
                showBanned={showBanned}
                showOpenAccess={showOpenAccess}
                onBookSelect={handleBookSelect}
                draggingId={draggingBookId}
                onDragStart={(id) => setDraggingBookId(id)}
                onDragEnd={() => setDraggingBookId(null)}
                onReorderBooks={handleReorderBooks}
              />
            )}
            {vizMode === 'mosaic' && (
              <MosaicGrid
                shelves={displayShelves}
                columns={perRow}
                showBanned={showBanned}
                showOpenAccess={showOpenAccess}
                onBookSelect={handleBookSelect}
                draggingId={draggingBookId}
                onDragStart={(id) => setDraggingBookId(id)}
                onDragEnd={() => setDraggingBookId(null)}
                onReorderBooks={handleReorderBooks}
              />
            )}
            {vizMode === 'scatter' && (
              <ScatterDrift
                shelves={displayShelves}
                radius={helixRadius}
                spacing={helixSpacing}
                showBanned={showBanned}
                showOpenAccess={showOpenAccess}
                onBookSelect={handleBookSelect}
              />
            )}
          </>
        )}
      </main>

      {/* Pledge modal */}
      {loaded && <PledgeModal bookCount={bookCount} />}

      {/* Sign-in nudge — guests only, 8 s delay, once per session */}
      {loaded && <SignInNudgeModal isGuest={isGuest} bookCount={bookCount} />}

      {/* Book detail panel */}
      {selectedBook && (
        <BookDetailPanel
          book={selectedBook}
          onSave={(patch) => { updateBook(selectedBook.id, patch); setSelectedBook(null); }}
          onClose={() => setSelectedBook(null)}
        />
      )}

      {/* Add book modal */}
      {showAddBook && (
        <BookFormModal onClose={() => setShowAddBook(false)} onSave={addBook} />
      )}

      {/* Share / Embed modal */}
      {showEmbed && (
        <ShareEmbedModal
          shelves={displayShelves}
          defaultViz={vizMode}
          onClose={() => setShowEmbed(false)}
        />
      )}

      {/* Export modal */}
      {showExport && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={() => setShowExport(false)}>
          <div
            data-testid="export-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 980,
              maxHeight: '92vh',
              background: '#fff',
              border: '3px solid #000',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #000', padding: '14px 24px', flexShrink: 0 }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#000' }}>Export image</h2>
              <button onClick={() => setShowExport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#666', lineHeight: 1 }}>✕</button>
            </div>

            {/* Body — scrollable */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
              {/* Ratio selector — horizontal row */}
              <div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: '#000', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Aspect ratio</p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(Object.keys(ASPECT_RATIO_DIMS) as AspectRatio[]).map((r) => (
                    <button
                      key={r}
                      data-testid={`ratio-${r}`}
                      onClick={() => setExportRatio(r)}
                      style={{
                        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                        border: '2px solid #000', padding: '7px 16px', cursor: 'pointer',
                        background: exportRatio === r ? '#000' : '#fff',
                        color: exportRatio === r ? '#fff200' : '#000',
                        boxShadow: exportRatio === r ? 'none' : '3px 3px 0px #000',
                        transition: 'all 0.1s',
                      }}
                    >
                      {ASPECT_RATIO_DIMS[r].label}
                    </button>
                  ))}
                </div>
              </div>

              <ExportSurface shelves={displayShelves} ratio={exportRatio} vizMode={vizMode} />
            </div>
          </div>
        </div>
      )}

      {/* Trash zone — appears while dragging a book */}
      {draggingBookId && (
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
            height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, background: '#ef4444', borderTop: '3px solid #b91c1c',
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff',
          }}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={(e) => {
            e.preventDefault();
            const id = e.dataTransfer.getData('text/plain');
            if (id) handleHideBook(id);
          }}
        >
          🗑️ Drop here to hide
        </div>
      )}

      {/* Footer nav */}
      <footer style={{ borderTop: '2px solid #000', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
        <span style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#666' }}>
          Built for World Book Day · <a href="https://buildforpublic.com" target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'underline' }}>buildforpublic.com</a>
        </span>
        <div style={{ display: 'flex', gap: 20 }}>
          <Link href="/give" style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#333', textDecoration: 'underline' }}>Give books</Link>
          <Link href="/impact" style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#333', textDecoration: 'underline' }}>Our mission</Link>
        </div>
      </footer>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '0 24px' }}>
      <div style={{ fontSize: 56, marginBottom: 16 }}>📚</div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#000', marginBottom: 8 }}>Your library is empty</h2>
      <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 16, color: '#555', marginBottom: 32, maxWidth: 360, lineHeight: 1.5 }}>
        Import your books from Hardcover or Goodreads to get started. No account required.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          href="/import/hardcover"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, border: '2px solid #000', padding: '10px 20px', background: '#000', color: '#fff200', textDecoration: 'none', boxShadow: '4px 4px 0px #666' }}
        >
          Connect Hardcover
        </Link>
        <Link
          href="/import/goodreads"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, border: '2px solid #000', padding: '10px 20px', background: '#fff200', color: '#000', textDecoration: 'none', boxShadow: '4px 4px 0px #000' }}
        >
          Upload Goodreads CSV
        </Link>
      </div>
    </div>
  );
}

// ─── Book detail panel ────────────────────────────────────────────────────────

interface BookDetailPanelProps {
  book: StoredBook;
  onSave: (patch: { year: number; rating: number; description?: string }) => void;
  onClose: () => void;
}

function BookDetailPanel({ book, onSave, onClose }: BookDetailPanelProps) {
  const [year, setYear] = useState(String(book.year || new Date().getFullYear()));
  const [rating, setRating] = useState(book.rating ?? 0);
  const [description, setDescription] = useState(book.description ?? '');
  const [descLoading, setDescLoading] = useState(!book.description);
  const fetchedFor = useRef<string>('');

  useEffect(() => {
    setYear(String(book.year || new Date().getFullYear()));
    setRating(book.rating ?? 0);
    setDescription(book.description ?? '');
    setDescLoading(!book.description);
  }, [book.id]);

  useEffect(() => {
    if (book.description || fetchedFor.current === book.id) return;
    fetchedFor.current = book.id;
    const params = new URLSearchParams();
    if (book.isbn) params.set('isbn', book.isbn);
    params.set('title', book.title);
    const author = book.authors[0]?.name;
    if (author) params.set('author', author);
    fetch(`/api/description?${params}`)
      .then((r) => r.json())
      .then((d) => { if (d.description) setDescription(d.description); })
      .catch(() => {})
      .finally(() => setDescLoading(false));
  }, [book.id, book.description, book.isbn, book.title, book.authors]);

  return (
    <div
      data-testid="book-detail-panel"
      className="fixed right-0 top-16 bottom-0 z-30 w-80 flex flex-col"
      style={{ background: '#fff', borderLeft: '3px solid #000' }}
    >
      <div style={{ borderBottom: '2px solid #000', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#000', lineHeight: 1.2 }}>{book.title}</h3>
            {book.authors.length > 0 && (
              <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#666', marginTop: 3 }} className="truncate">
                {book.authors.map((a) => a.name).join(', ')}
              </p>
            )}
          </div>
          <button onClick={onClose} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, marginTop: 2, flexShrink: 0 }}>✕</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Rating</p>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star === rating ? 0 : star)}
                style={{ fontSize: 24, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
              >
                {star <= rating ? '★' : '☆'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="book-year-read" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
            Year read
          </label>
          <input
            id="book-year-read"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="1000"
            max="2100"
            style={{ width: '100%', border: '2px solid #000', padding: '8px 12px', fontSize: 14, fontFamily: 'var(--font-geist, sans-serif)', background: '#f5f5f5', color: '#000', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {book.review?.text && (
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>My review</p>
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#000', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{book.review.text}</p>
          </div>
        )}

        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>About</p>
          {descLoading ? (
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#999' }} className="animate-pulse">Loading…</p>
          ) : description ? (
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#333', lineHeight: 1.6 }}>{description}</p>
          ) : (
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#999' }}>No description available.</p>
          )}
        </div>
      </div>

      <div style={{ borderTop: '2px solid #000', padding: '12px 16px', display: 'flex', gap: 8 }}>
        <button
          onClick={onClose}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, border: '2px solid #000', padding: '8px 0', background: '#fff', color: '#000', cursor: 'pointer', flex: 1 }}
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ year: parseInt(year, 10) || book.year, rating, description: description || undefined })}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, border: '2px solid #000', padding: '8px 0', background: '#fff200', color: '#000', cursor: 'pointer', flex: 1, boxShadow: '3px 3px 0px #000' }}
        >
          Save
        </button>
      </div>
    </div>
  );
}

// ─── Add / Edit book modal ────────────────────────────────────────────────────

interface BookFormModalProps {
  onClose: () => void;
  onSave: (book: {
    year: number;
    title: string;
    authors: { name: string }[];
    pageCount: number;
    cover: string;
    slug: string;
    source: 'manual';
  }) => void;
  initialValues?: { title: string; authors: { name: string }[]; year: number; pageCount: number };
}

function BookFormModal({ onClose, onSave, initialValues }: BookFormModalProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [author, setAuthor] = useState(initialValues?.authors?.[0]?.name ?? '');
  const [year, setYear] = useState(String(initialValues?.year ?? new Date().getFullYear()));
  const [pages, setPages] = useState(String(initialValues?.pageCount ?? ''));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave({
      title: trimmed,
      authors: [{ name: author.trim() || 'Unknown' }],
      year: parseInt(year, 10) || new Date().getFullYear(),
      pageCount: parseInt(pages, 10) || 0,
      cover: '',
      slug: trimmed.toLowerCase().replace(/\s+/g, '-'),
      source: 'manual',
    });
    onClose();
  }

  const fieldStyle: React.CSSProperties = {
    width: '100%', border: '2px solid #000', padding: '10px 12px',
    fontSize: 15, fontFamily: 'var(--font-geist, sans-serif)',
    background: '#f5f5f5', color: '#000', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <form
        data-testid="add-book-form"
        style={{ background: '#fff', border: '3px solid #000', boxShadow: '6px 6px 0px #000', width: '100%', maxWidth: 440, padding: '28px 28px 24px' }}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#000' }}>Add a book</h2>
          <button type="button" onClick={onClose} style={{ color: '#666', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label htmlFor="book-title" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#000', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Title</label>
            <input
              id="book-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Book title"
              style={fieldStyle}
              required
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="book-author" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#000', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Author</label>
            <input
              id="book-author"
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              style={fieldStyle}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label htmlFor="book-year" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#000', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Year</label>
              <input
                id="book-year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                min="1000"
                max="2100"
                style={fieldStyle}
              />
            </div>
            <div>
              <label htmlFor="book-pages" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: '#000', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pages</label>
              <input
                id="book-pages"
                type="number"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="300"
                min="1"
                style={fieldStyle}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, border: '2px solid #000', padding: '10px 0', background: '#fff', color: '#000', cursor: 'pointer', flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, border: '2px solid #000', padding: '10px 0', background: '#fff200', color: '#000', cursor: 'pointer', flex: 1, boxShadow: '3px 3px 0px #000' }}
          >
            Add book
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Share / Embed modal ──────────────────────────────────────────────────────

const VIZ_EMBED_MODES: { id: VizMode; label: string }[] = [
  { id: 'stack',   label: 'Stack Chart' },
  { id: 'grid',    label: 'Cover Grid' },
  { id: 'wall',    label: 'Wall Shelf' },
  { id: 'mosaic',  label: 'Mosaic' },
  { id: 'scatter', label: 'Spiral Drift' },
];

function ShareEmbedModal({ shelves, defaultViz, onClose }: { shelves: import('@/lib/types').Shelf[]; defaultViz: VizMode; onClose: () => void }) {
  const [embedViz, setEmbedViz] = useState<VizMode>(defaultViz);
  const [copied, setCopied] = useState<'iframe' | 'api' | null>(null);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bookshelf.app';
  const data   = useMemo(() => encodeShelves(shelves, embedViz), [shelves, embedViz]);
  const embedUrl  = `${origin}/embed?d=${data}&viz=${embedViz}`;
  const apiUrl    = `${origin}/api/v1/books?d=${data}`;
  const iframeCode = `<iframe src="${embedUrl}" width="660" height="700" frameborder="0" style="border:none;border-radius:8px;" allowfullscreen></iframe>`;

  function copy(text: string, which: 'iframe' | 'api') {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const codeStyle: React.CSSProperties = {
    fontFamily: 'var(--font-geist, monospace)',
    fontSize: 11,
    background: '#f5f5f5',
    border: '1px solid #ddd',
    padding: '10px 12px',
    borderRadius: 4,
    wordBreak: 'break-all',
    whiteSpace: 'pre-wrap',
    color: '#333',
    lineHeight: 1.5,
    flex: 1,
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 620, background: '#fff', border: '3px solid #000', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #000', padding: '14px 24px' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>Share &amp; Embed</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#666' }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Viz picker */}
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Visualization</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {VIZ_EMBED_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setEmbedViz(m.id)}
                  style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                    border: '2px solid #000', padding: '3px 10px', cursor: 'pointer',
                    background: embedViz === m.id ? '#000' : '#fff',
                    color: embedViz === m.id ? '#fff200' : '#000',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Embed code */}
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Embed code</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <code style={codeStyle}>{iframeCode}</code>
              <button
                onClick={() => copy(iframeCode, 'iframe')}
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, border: '2px solid #000', padding: '6px 12px', cursor: 'pointer', background: copied === 'iframe' ? '#000' : '#fff', color: copied === 'iframe' ? '#fff200' : '#000', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {copied === 'iframe' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* API URL */}
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>JSON API</p>
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#666', marginBottom: 8 }}>
              Returns your library as JSON. Open to anyone — no authentication required.
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <code style={codeStyle}>{apiUrl}</code>
              <button
                onClick={() => copy(apiUrl, 'api')}
                style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, border: '2px solid #000', padding: '6px 12px', cursor: 'pointer', background: copied === 'api' ? '#000' : '#fff', color: copied === 'api' ? '#fff200' : '#000', whiteSpace: 'nowrap', flexShrink: 0 }}
              >
                {copied === 'api' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Embed preview link */}
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#000', textDecoration: 'underline' }}
          >
            Preview embed →
          </a>
        </div>
      </div>
    </div>
  );
}
