'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import type { Book, Shelf } from '@/lib/types';
import { hashColor, hashNum, spineTextColor, cleanTitle } from '@/lib/spine';

interface BookStackChartProps {
  shelves: Shelf[];
  exportMode?: boolean;
  exportWidth?: number;
  exportHeight?: number;
  onBookSelect?: (book: Book) => void;
  onMoveBook?: (bookId: string, toYear: number) => void;
  onHideBook?: (bookId: string) => void;
}

const MIN_SPINE_HEIGHT = 6;

const ZOOM_LEVELS = [
  { width: 200, gap: 40, pxPerPage: 0.07 },
  { width: 150, gap: 30, pxPerPage: 0.045 },
  { width: 110, gap: 22, pxPerPage: 0.03 },
  { width: 80,  gap: 16, pxPerPage: 0.02 },
];
const DEFAULT_ZOOM = 1;
const CM_PER_PAGE = 0.008;

// ─── Draggable book spine ─────────────────────────────────────────────────────

interface SpineProps {
  book: Book;
  shelfTitle: string;
  BASE_WIDTH: number;
  pxPerPage: number;
  exportMode: boolean;
  dndEnabled: boolean;
  chartRef: React.RefObject<HTMLDivElement | null>;
  setHoveredBook: (v: { title: string; author: string; pages: number; x: number; y: number } | null) => void;
  onBookSelect?: (book: Book) => void;
  onHideBook?: (bookId: string) => void;
}

function BookSpine({
  book, shelfTitle, BASE_WIDTH, pxPerPage,
  exportMode, dndEnabled, chartRef, setHoveredBook, onBookSelect, onHideBook,
}: SpineProps) {
  const [spineHovered, setSpineHovered] = useState(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: book.id as string,
    disabled: !dndEnabled,
    data: { year: shelfTitle },
  });

  const spineHeight = Math.max(MIN_SPINE_HEIGHT, (book.pageCount || 200) * pxPerPage);
  const color = hashColor(book.title);
  const h = hashNum(book.title);
  const widthVariation = (h % 25) - 5;
  const spineWidth = BASE_WIDTH + widthVariation;
  const offsetX = ((h >> 4) % 5) - 2;
  const borderRadius = ['3px', '2px', '1px', '0px'][h % 4];
  const edgePattern = h % 5;
  const edgeInset = spineHeight >= 14 ? 10 : 4;
  const displayTitle = cleanTitle(book.title);
  const textColor = spineTextColor(color);
  const lighten = 'rgba(255,255,255,';
  const darken = 'rgba(0,0,0,';

  const MIN_FONT = 7, MAX_FONT = 14, lineHeight = 1.25;
  let fontSize = 0, maxLines = 0;
  if (spineHeight >= 12) {
    const preferred = Math.min(spineHeight * 0.55, MAX_FONT);
    fontSize = MIN_FONT;
    maxLines = Math.max(1, Math.floor(spineHeight / (MIN_FONT * lineHeight)));
    for (let s = Math.floor(preferred); s >= MIN_FONT; s--) {
      const tryLines = Math.max(1, Math.floor(spineHeight / (s * lineHeight)));
      const charsPerLine = Math.floor((spineWidth - edgeInset * 2 - 8) / (s * 0.55));
      if (tryLines * charsPerLine >= displayTitle.length) { fontSize = s; maxLines = tryLines; break; }
    }
  }

  const transformStyle = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 100, opacity: 0.85 }
    : {};

  return (
    <div
      ref={setNodeRef}
      {...(dndEnabled ? listeners : {})}
      {...(dndEnabled ? attributes : {})}
      data-testid="book-spine"
      className="relative overflow-hidden"
      style={{
        height: spineHeight,
        width: spineWidth,
        backgroundColor: color,
        borderRadius,
        transform: `translateX(${offsetX}px)`,
        cursor: exportMode ? 'default' : dndEnabled ? 'grab' : 'pointer',
        boxShadow: `inset 0 1px 0 ${lighten}0.15),inset 0 -1px 0 ${darken}0.2),0 1px 2px ${darken}0.15)`,
        backgroundImage: `linear-gradient(to right,${darken}0.18) 0%,${darken}0.06) 6%,${lighten}0.06) 15%,${lighten}0.1) 45%,${lighten}0.04) 55%,${darken}0.04) 85%,${darken}0.15) 100%)`,
        ...transformStyle,
      }}
      onMouseEnter={(e) => {
        if (exportMode) return;
        setSpineHovered(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const chartRect = chartRef.current?.getBoundingClientRect();
        setHoveredBook({
          title: book.title,
          author: book.authors?.[0]?.name || 'Unknown',
          pages: book.pageCount || 0,
          x: rect.left - (chartRect?.left || 0) + rect.width / 2,
          y: rect.top - (chartRect?.top || 0) - 8,
        });
      }}
      onMouseLeave={() => { if (!exportMode) { setSpineHovered(false); setHoveredBook(null); } }}
      onClick={() => {
        if (exportMode || isDragging) return;
        onBookSelect?.(book);
      }}
    >
      {!exportMode && onHideBook && spineHovered && (
        <div
          onClick={(e) => { e.stopPropagation(); onHideBook(book.id as string); }}
          title="Hide book"
          style={{
            position: 'absolute', top: 1, right: 1, width: 13, height: 13,
            background: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: '0 0 0 3px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, lineHeight: 1, cursor: 'pointer', zIndex: 10,
          }}
        >
          ×
        </div>
      )}
      {spineHeight >= 14 && (
        <>
          <div className="absolute left-0 top-0 bottom-0 pointer-events-none" style={{ width: edgeInset }}>
            {edgePattern === 0 && (<><div className="absolute top-0 bottom-0" style={{ left: 3, width: 1, backgroundColor: `${lighten}0.15)` }} /><div className="absolute top-0 bottom-0" style={{ left: 6, width: 1, backgroundColor: `${lighten}0.1)` }} /></>)}
            {edgePattern === 1 && (<div className="absolute top-1 bottom-1" style={{ left: 4, width: 2, backgroundColor: `${lighten}0.12)`, borderRadius: 1 }} />)}
            {edgePattern === 2 && (<div className="absolute top-0 bottom-0" style={{ left: 4, width: 1, borderLeft: `1px dashed ${lighten}0.18)` }} />)}
            {edgePattern === 3 && (<><div className="absolute top-0 bottom-0" style={{ left: 2, width: 1, backgroundColor: `${lighten}0.1)` }} /><div className="absolute top-0 bottom-0" style={{ left: 4, width: 1, backgroundColor: `${lighten}0.15)` }} /><div className="absolute top-0 bottom-0" style={{ left: 6, width: 1, backgroundColor: `${lighten}0.1)` }} /></>)}
          </div>
          <div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: edgeInset }}>
            {edgePattern === 0 && (<><div className="absolute top-0 bottom-0" style={{ right: 3, width: 1, backgroundColor: `${lighten}0.15)` }} /><div className="absolute top-0 bottom-0" style={{ right: 6, width: 1, backgroundColor: `${lighten}0.1)` }} /></>)}
            {edgePattern === 1 && (<div className="absolute top-1 bottom-1" style={{ right: 4, width: 2, backgroundColor: `${lighten}0.12)`, borderRadius: 1 }} />)}
            {edgePattern === 2 && (<div className="absolute top-0 bottom-0" style={{ right: 4, width: 1, borderRight: `1px dashed ${lighten}0.18)` }} />)}
            {edgePattern === 3 && (<><div className="absolute top-0 bottom-0" style={{ right: 2, width: 1, backgroundColor: `${lighten}0.1)` }} /><div className="absolute top-0 bottom-0" style={{ right: 4, width: 1, backgroundColor: `${lighten}0.15)` }} /><div className="absolute top-0 bottom-0" style={{ right: 6, width: 1, backgroundColor: `${lighten}0.1)` }} /></>)}
          </div>
          <div className="absolute left-0 right-0 top-0 pointer-events-none" style={{ height: 1, backgroundColor: `${lighten}0.12)` }} />
          <div className="absolute left-0 right-0 bottom-0 pointer-events-none" style={{ height: 1, backgroundColor: `${darken}0.12)` }} />
        </>
      )}
      {fontSize > 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center select-none pointer-events-none overflow-hidden"
          style={{ left: edgeInset + 2, right: edgeInset + 2 }}
        >
          <span
            className="text-center"
            style={{
              fontSize,
              lineHeight: `${fontSize * lineHeight}px`,
              color: textColor,
              opacity: 0.9,
              fontWeight: 500,
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: maxLines,
              WebkitBoxOrient: 'vertical' as const,
              wordBreak: 'break-word' as const,
              maxWidth: '100%',
            }}
          >
            {displayTitle}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Droppable year column ────────────────────────────────────────────────────

interface YearColumnProps {
  shelfTitle: string;
  BASE_WIDTH: number;
  dndEnabled: boolean;
  children: React.ReactNode;
}

function YearColumn({ shelfTitle, BASE_WIDTH, dndEnabled, children }: YearColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `year-${shelfTitle}`,
    disabled: !dndEnabled,
  });

  return (
    <div
      ref={setNodeRef}
      data-testid={`year-drop-zone-${shelfTitle}`}
      className="flex flex-col items-center shrink-0"
      style={{
        width: BASE_WIDTH,
        outline: isOver && dndEnabled ? '2px solid #3b82f6' : 'none',
        borderRadius: 8,
        transition: 'outline 100ms',
      }}
    >
      {children}
    </div>
  );
}

// ─── Main chart ───────────────────────────────────────────────────────────────

function BookStackChart({
  shelves,
  exportMode = false,
  exportWidth,
  exportHeight,
  onBookSelect,
  onMoveBook,
  onHideBook,
}: BookStackChartProps) {
  const [hoveredBook, setHoveredBook] = useState<{
    title: string; author: string; pages: number; x: number; y: number;
  } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM);
  const [viewMode, setViewMode] = useState<'byYear' | 'showAll'>('byYear');
  const [containerHeight, setContainerHeight] = useState(0);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setContainerHeight(Math.max(300, window.innerHeight - rect.top - 8));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const dndEnabled = !exportMode && !!onMoveBook && viewMode === 'byYear';

  const zoom = ZOOM_LEVELS[zoomLevel];
  const BASE_WIDTH = zoom.width;
  const STACK_GAP = zoom.gap;
  const pxPerPage = zoom.pxPerPage;

  const sortedShelves = useMemo(
    () => [...shelves].filter((s) => s.books.length > 0).sort((a, b) => b.title.localeCompare(a.title)),
    [shelves],
  );

  const allBooks = useMemo(() => sortedShelves.flatMap((s) => s.books), [sortedShelves]);
  const totalAllPages = useMemo(() => allBooks.reduce((sum, b) => sum + (b.pageCount || 0), 0), [allBooks]);

  const maxPages = useMemo(() => {
    if (viewMode === 'showAll') return totalAllPages;
    let max = 0;
    for (const shelf of sortedShelves) {
      const total = shelf.books.reduce((sum, b) => sum + (b.pageCount || 0), 0);
      if (total > max) max = total;
    }
    return max;
  }, [sortedShelves, viewMode, totalAllPages]);

  const guideInterval = maxPages <= 1000 ? 250 : maxPages <= 3000 ? 500 : maxPages <= 6000 ? 1000 : 2000;

  const guideLines = useMemo(() => {
    const lines: number[] = [];
    const maxGuide = Math.ceil(maxPages / guideInterval) * guideInterval;
    for (let i = 0; i <= maxGuide; i += guideInterval) lines.push(i);
    return lines;
  }, [maxPages, guideInterval]);

  const realScaleMarkers = useMemo(() => {
    return [
      { pages: Math.round(18 / CM_PER_PAGE), label: '1 banana', emoji: '🍌' },
      { pages: Math.round(30 / CM_PER_PAGE), label: '1 ruler',  emoji: '📏' },
      { pages: Math.round(50 / CM_PER_PAGE), label: '1 sword',  emoji: '⚔️' },
      { pages: Math.round(100 / CM_PER_PAGE), label: '1 guitar', emoji: '🎸' },
      { pages: Math.round(170 / CM_PER_PAGE), label: '1 person', emoji: '🧍' },
    ].filter((m) => m.pages <= maxPages * 1.1);
  }, [maxPages]);

  // In show-all mode, scale pxPerPage so the total stack fits the visible height exactly
  const LABEL_OVERHEAD = 80;
  const SHOW_ALL_COL_WIDTH = BASE_WIDTH; // zoom buttons control column width
  const availableChartHeight = Math.max(containerHeight - LABEL_OVERHEAD, 200);
  const showAllPxPerPage = totalAllPages > 0 ? availableChartHeight / totalAllPages : pxPerPage;
  // In show-all, zoom scales both dimensions: multiply the auto-fit pxPerPage by the
  // ratio of the current zoom's pxPerPage to the default zoom's pxPerPage.
  const showAllZoomRatio = zoom.pxPerPage / ZOOM_LEVELS[DEFAULT_ZOOM].pxPerPage;
  const activePxPerPage = viewMode === 'showAll' ? showAllPxPerPage * showAllZoomRatio : pxPerPage;

  // In export mode, auto-scale layout to fill the frame
  const exportBASE_WIDTH = useMemo(() => {
    if (!exportMode || !exportWidth || sortedShelves.length === 0) return BASE_WIDTH;
    const N = sortedShelves.length;
    const axisL = 56, axisR = 96, edgePad = 16;
    const available = exportWidth - axisL - axisR - edgePad;
    // gap ≈ 0.25 × column; N*col + (N-1)*0.25*col = available
    const col = Math.floor(available / (N + 0.25 * Math.max(N - 1, 0)));
    return Math.max(40, Math.min(col, 400));
  }, [exportMode, exportWidth, sortedShelves.length, BASE_WIDTH]);

  const exportSTACK_GAP = useMemo(() => {
    if (!exportMode || !exportWidth || sortedShelves.length <= 1) return STACK_GAP;
    const N = sortedShelves.length;
    const axisL = 56, axisR = 96, edgePad = 16;
    const available = exportWidth - axisL - axisR - edgePad;
    const gap = Math.floor((available - exportBASE_WIDTH * N) / (N - 1));
    return Math.max(8, gap);
  }, [exportMode, exportWidth, sortedShelves.length, exportBASE_WIDTH, STACK_GAP]);

  const exportPxPerPage = useMemo(() => {
    if (!exportMode || !exportHeight) return activePxPerPage;
    const maxPages = Math.max(
      1,
      ...sortedShelves.map((s) => s.books.reduce((sum, b) => sum + (b.pageCount || 0), 0)),
    );
    const chartContentH = exportHeight - 60; // space for year labels + book-count row
    return (chartContentH * 0.85) / maxPages;
  }, [exportMode, exportHeight, sortedShelves, activePxPerPage]);

  const renderBASE_WIDTH = exportMode ? exportBASE_WIDTH : BASE_WIDTH;
  const renderSTACK_GAP = exportMode ? exportSTACK_GAP : STACK_GAP;
  const renderPxPerPage = exportMode ? exportPxPerPage : activePxPerPage;

  const chartHeight = exportMode && exportHeight
    ? exportHeight - 40
    : containerHeight > 0 ? availableChartHeight : undefined;

  if (sortedShelves.length === 0) return null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const toYear = parseInt(String(over.id).replace('year-', ''), 10);
    if (!isNaN(toYear)) onMoveBook?.(String(active.id), toYear);
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div
        className="relative w-full max-w-full overflow-hidden"
        ref={chartRef}
        style={exportMode
          ? { background: '#fff', width: exportWidth, height: exportHeight }
          : { height: containerHeight || undefined }}
      >
        {!exportMode && (
          <div className="flex items-center justify-between mb-3 mr-2">
            <div className="flex gap-1">
              {(['byYear', 'showAll'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  style={{
                    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                    border: '2px solid #000', padding: '3px 10px', cursor: 'pointer',
                    background: viewMode === mode ? '#000' : 'transparent',
                    color: viewMode === mode ? '#fff200' : '#000',
                    boxShadow: viewMode === mode ? 'none' : '2px 2px 0px #000',
                    transition: 'all 0.1s',
                  }}
                >
                  {mode === 'byYear' ? 'By year' : 'Show all'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-stone-400 mr-1">Zoom</span>
              <button
                onClick={() => setZoomLevel(Math.min(ZOOM_LEVELS.length - 1, zoomLevel + 1))}
                disabled={zoomLevel === ZOOM_LEVELS.length - 1}
                className="w-6 h-6 flex items-center justify-center rounded border border-stone-200 text-stone-500 text-sm hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >−</button>
              <button
                onClick={() => setZoomLevel(Math.max(0, zoomLevel - 1))}
                disabled={zoomLevel === 0}
                className="w-6 h-6 flex items-center justify-center rounded border border-stone-200 text-stone-500 text-sm hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed"
              >+</button>
            </div>
          </div>
        )}

        <div
          className="relative ml-8 sm:ml-14 mr-2 sm:mr-24"
          style={{ height: chartHeight ?? undefined }}
        >
          {/* Left axis */}
          {guideLines.map((pages) => {
            const bottom = pages * renderPxPerPage;
            return (
              <span
                key={`l-${pages}`}
                className="absolute text-[10px] text-stone-400 font-mono text-right pr-2 leading-none"
                style={{ bottom, right: '100%', width: '3.5rem', transform: 'translateY(50%)' }}
              >
                {pages.toLocaleString()}
              </span>
            );
          })}

          {/* Right axis */}
          {guideLines.map((pages) => {
            const bottom = pages * renderPxPerPage;
            const cm = Math.round(pages * CM_PER_PAGE);
            return cm > 0 ? (
              <span
                key={`r-${pages}`}
                className="absolute text-[10px] text-stone-400 font-mono pl-2 leading-none whitespace-nowrap hidden sm:block"
                style={{ bottom, left: '100%', transform: 'translateY(50%)' }}
              >
                {cm}cm
              </span>
            ) : null;
          })}
          {realScaleMarkers.map((m) => {
            const bottom = m.pages * renderPxPerPage;
            return (
              <span
                key={m.label}
                className="absolute text-[10px] text-stone-400 pl-2 leading-none whitespace-nowrap hidden sm:block"
                style={{ bottom, left: '100%', transform: 'translateY(50%)' }}
              >
                {m.emoji} {m.label}
              </span>
            );
          })}

          <div className={exportMode ? '' : 'overflow-x-auto overflow-y-hidden'}>
            <div
              className="inline-block"
              style={{ minWidth: viewMode === 'showAll' ? '100%' : sortedShelves.length * (renderBASE_WIDTH + renderSTACK_GAP) + 20 }}
            >
              <div
                className="relative overflow-hidden"
                style={{ height: chartHeight ?? 'clamp(250px, 60vh, 600px)' }}
              >
                {/* Guide lines */}
                {guideLines.map((pages) => (
                  <div key={pages} className="absolute left-0 right-0" style={{ bottom: pages * renderPxPerPage }}>
                    <div className="w-full border-t border-stone-200/70" />
                  </div>
                ))}
                {realScaleMarkers.map((m) => (
                  <div key={m.label} className="absolute left-0 right-0 pointer-events-none" style={{ bottom: m.pages * renderPxPerPage }}>
                    <div className="w-full border-t border-dashed border-stone-300/50" />
                  </div>
                ))}

                {viewMode === 'byYear' ? (
                  /* By-year stacks */
                  <div className="absolute inset-0 flex items-end px-2" style={{ gap: renderSTACK_GAP }}>
                    {sortedShelves.map((shelf) => {
                      const totalPages = shelf.books.reduce((s, b) => s + (b.pageCount || 0), 0);
                      const bookCount = shelf.books.length;
                      return (
                        <YearColumn
                          key={shelf.title}
                          shelfTitle={shelf.title}
                          BASE_WIDTH={renderBASE_WIDTH}
                          dndEnabled={dndEnabled}
                        >
                          <div className="text-[10px] sm:text-xs text-stone-500 mb-1 whitespace-nowrap text-center">
                            <span className="font-bold">{bookCount} book{bookCount !== 1 ? 's' : ''}</span>
                            <span className="mx-1 text-stone-300">|</span>
                            <span>{totalPages.toLocaleString()} pages</span>
                          </div>
                          <div className="flex flex-col-reverse items-center w-full">
                            {shelf.books.map((book) => (
                              <BookSpine
                                key={book.id as string}
                                book={book}
                                shelfTitle={shelf.title}
                                BASE_WIDTH={renderBASE_WIDTH}
                                pxPerPage={renderPxPerPage}
                                exportMode={exportMode}
                                dndEnabled={dndEnabled}
                                chartRef={chartRef}
                                setHoveredBook={setHoveredBook}
                                onBookSelect={onBookSelect}
                                onHideBook={onHideBook}
                              />
                            ))}
                          </div>
                        </YearColumn>
                      );
                    })}
                  </div>
                ) : (
                  /* Show-all: single centered stack */
                  <div className="absolute inset-0 flex items-end justify-center">
                    <div className="flex flex-col items-center" style={{ width: SHOW_ALL_COL_WIDTH }}>
                      <div className="text-[10px] sm:text-xs text-stone-500 mb-1 whitespace-nowrap text-center">
                        <span className="font-bold">{allBooks.length} book{allBooks.length !== 1 ? 's' : ''}</span>
                        <span className="mx-1 text-stone-300">|</span>
                        <span>{totalAllPages.toLocaleString()} pages total</span>
                      </div>
                      <div className="flex flex-col-reverse items-center w-full">
                        {allBooks.map((book) => (
                          <BookSpine
                            key={book.id as string}
                            book={book}
                            shelfTitle="all"
                            BASE_WIDTH={SHOW_ALL_COL_WIDTH}
                            pxPerPage={renderPxPerPage}
                            exportMode={exportMode}
                            dndEnabled={false}
                            chartRef={chartRef}
                            setHoveredBook={setHoveredBook}
                            onBookSelect={onBookSelect}
                            onHideBook={onHideBook}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Year labels / all-books label */}
              <div className="flex items-start px-2 mt-1 pb-1" style={{ gap: renderSTACK_GAP, justifyContent: viewMode === 'showAll' ? 'center' : undefined }}>
                {viewMode === 'byYear' ? (
                  sortedShelves.map((shelf) => (
                    <div key={shelf.title} className="shrink-0 text-center" style={{ width: renderBASE_WIDTH }}>
                      <span className="text-xs sm:text-sm font-bold text-stone-700">{shelf.title}</span>
                    </div>
                  ))
                ) : (
                  <div className="shrink-0 text-center" style={{ width: renderBASE_WIDTH }}>
                    <span className="text-xs sm:text-sm font-bold text-stone-700">All books</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tooltip */}
        {hoveredBook && (
          <div
            className="absolute pointer-events-none z-50 bg-stone-900 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap"
            style={{ left: hoveredBook.x, top: hoveredBook.y, transform: 'translate(-50%, -100%)' }}
          >
            {hoveredBook.title} — {hoveredBook.author} — {hoveredBook.pages} pages
          </div>
        )}
      </div>
    </DndContext>
  );
}

export default BookStackChart;
