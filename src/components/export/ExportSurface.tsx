'use client';

import { useRef, useState, useCallback } from 'react';
import type { Shelf, AspectRatio, VizMode } from '@/lib/types';
import { ASPECT_RATIO_DIMS } from '@/lib/types';
import { exportNodeToPng } from '@/lib/image-export';
import BookStackChart from '@/components/viz/BookStackChart';
import { CoverGrid } from '@/components/viz/CoverGrid';
import { Bookshelf } from '@/components/viz/Bookshelf';
import { MosaicGrid } from '@/components/viz/MosaicGrid';
import { PixelGrid } from '@/components/viz/PixelGrid';
import { ScatterDrift } from '@/components/viz/ScatterDrift';
import { TurntableCarousel } from '@/components/viz/TurntableCarousel';

interface ExportSurfaceProps {
  shelves: Shelf[];
  ratio: AspectRatio;
  vizMode?: VizMode;
}

const MAX_PREVIEW_W = 520;
const MAX_PREVIEW_H = 420;
const CAPTION_HEIGHT = 80;
const BOOKDAY_HEIGHT = 60;

const VIZ_MODES: VizMode[] = ['stack', 'shelf', 'grid', 'mosaic', 'pixel', 'wall', 'scatter', 'turntable'];
const VIZ_LABELS: Record<VizMode, string> = {
  stack: 'Stack',
  shelf: 'Bookshelf',
  grid: 'Cover Grid',
  mosaic: 'Mosaic',
  pixel: 'Pixel',
  wall: 'Wall',
  scatter: 'Spiral Drift',
  turntable: 'Turntable',
};

export function ExportSurface({ shelves, ratio, vizMode: initialVizMode = 'stack' }: ExportSurfaceProps) {
  const { width, height } = ASPECT_RATIO_DIMS[ratio];
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [showBookDayFrame, setShowBookDayFrame] = useState(false);
  const [vizMode, setVizMode] = useState<VizMode>(initialVizMode);

  // Caption
  const [captionEnabled, setCaptionEnabled] = useState(false);
  const [captionText, setCaptionText] = useState('');

  // Zoom / pan
  const [viewZoom, setViewZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const previewScale = Math.min(MAX_PREVIEW_W / width, MAX_PREVIEW_H / height);

  const headerH = showBookDayFrame ? BOOKDAY_HEIGHT : 0;
  const footerH = captionEnabled ? CAPTION_HEIGHT : 0;
  const vizAreaH = height - headerH - footerH;
  const vizAreaW = width;

  const handleDownload = async () => {
    if (!surfaceRef.current) return;
    setLoading(true);
    try {
      await exportNodeToPng(surfaceRef.current, `bookshelf-${ratio}.png`);
    } finally {
      setLoading(false);
    }
  };

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    setPanX((p) => p + dx / previewScale);
    setPanY((p) => p + dy / previewScale);
    lastPos.current = { x: e.clientX, y: e.clientY };
  }, [previewScale]);

  const onMouseUp = useCallback(() => { isDragging.current = false; }, []);

  const resetView = () => { setViewZoom(1); setPanX(0); setPanY(0); };

  const btnStyle = (active?: boolean): React.CSSProperties => ({
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
    border: '2px solid #000', padding: '5px 12px', cursor: 'pointer',
    background: active ? '#000' : '#fff',
    color: active ? '#fff200' : '#000',
    boxShadow: active ? 'none' : '2px 2px 0px #000',
    transition: 'all 0.1s',
    whiteSpace: 'nowrap' as const,
  });

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11,
    color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.07em',
    marginBottom: 6, display: 'block',
  };

  const renderViz = () => {
    switch (vizMode) {
      case 'stack':
        return <BookStackChart shelves={shelves} exportMode exportWidth={vizAreaW} exportHeight={vizAreaH} />;
      case 'shelf':
        return <Bookshelf shelves={shelves} exportMode exportWidth={vizAreaW} exportHeight={vizAreaH} />;
      case 'grid':
        return <CoverGrid shelves={shelves} exportMode />;
      case 'mosaic':
        return <MosaicGrid shelves={shelves} exportMode />;
      case 'pixel':
        return <PixelGrid shelves={shelves} exportMode />;
      case 'wall':
        return <CoverGrid shelves={shelves} exportMode />;
      case 'scatter':
        return <ScatterDrift shelves={shelves} exportMode />;
      case 'turntable':
        return <TurntableCarousel shelves={shelves} exportMode />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
          <input
            data-testid="book-day-frame-toggle"
            type="checkbox"
            checked={showBookDayFrame}
            onChange={(e) => setShowBookDayFrame(e.target.checked)}
          />
          <span style={{ fontSize: 13, color: '#57534e' }}>World Book Day frame 📚</span>
        </label>
        <button
          onClick={handleDownload}
          disabled={loading}
          style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13,
            border: '2px solid #000', padding: '8px 20px', cursor: loading ? 'wait' : 'pointer',
            background: '#000', color: '#fff200', transition: 'opacity 0.1s',
            opacity: loading ? 0.6 : 1, flexShrink: 0,
          }}
        >
          {loading ? 'Rendering…' : `↓ Download ${ASPECT_RATIO_DIMS[ratio].label}`}
        </button>
      </div>

      {/* ── Style ── */}
      <div>
        <span style={sectionLabel}>Style</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {VIZ_MODES.map((mode) => (
            <button key={mode} onClick={() => setVizMode(mode)} style={btnStyle(vizMode === mode)}>
              {VIZ_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      {/* ── View controls ── */}
      <div>
        <span style={sectionLabel}>View</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#57534e', minWidth: 36 }}>Zoom</span>
          <input
            type="range" min={25} max={300} step={5}
            value={Math.round(viewZoom * 100)}
            onChange={(e) => setViewZoom(Number(e.target.value) / 100)}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, minWidth: 40 }}>
            {Math.round(viewZoom * 100)}%
          </span>
          <button onClick={resetView} style={{ ...btnStyle(), padding: '4px 10px', fontSize: 11 }}>
            Reset
          </button>
        </div>
        <p style={{ fontSize: 11, color: '#a8a29e', marginTop: 4 }}>
          Drag preview to pan · zoom slider to crop
        </p>
      </div>

      {/* ── Caption ── */}
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={captionEnabled}
            onChange={(e) => setCaptionEnabled(e.target.checked)}
          />
          <span style={sectionLabel}>Caption</span>
        </label>
        {captionEnabled && (
          <input
            type="text"
            value={captionText}
            onChange={(e) => setCaptionText(e.target.value)}
            placeholder="My books in 2025 · 37 books read"
            style={{
              marginTop: 6, width: '100%', padding: '8px 12px',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600,
              border: '2px solid #000', outline: 'none', background: '#fafaf9',
              boxSizing: 'border-box' as const,
            }}
          />
        )}
      </div>

      {/* ── Preview ── */}
      <div style={{ background: '#f5f5f4', borderRadius: 10, border: '1px solid #e7e5e4', padding: 12, overflow: 'hidden' }}>
        <div
          style={{
            width: width * previewScale,
            height: height * previewScale,
            overflow: 'hidden',
            borderRadius: 6,
            border: '1px solid #d6d3d1',
            cursor: 'grab',
            userSelect: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
        >
          <div style={{ width, height, transformOrigin: 'top left', transform: `scale(${previewScale})` }}>
            <div
              ref={surfaceRef}
              style={{ width, height, background: '#ffffff', position: 'relative', overflow: 'hidden' }}
            >
              {/* ── Visualization area ── */}
              <div style={{
                position: 'absolute',
                top: headerH,
                left: 0, right: 0,
                bottom: footerH,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: '100%',
                  height: '100%',
                  transform: `translate(${panX}px, ${panY}px) scale(${viewZoom})`,
                  transformOrigin: 'center center',
                }}>
                  {renderViz()}
                </div>
              </div>

              {/* ── World Book Day frame ── */}
              {showBookDayFrame && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  height: BOOKDAY_HEIGHT,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0 28px',
                  background: '#fdfbf9',
                  borderBottom: '2px solid #171717',
                  zIndex: 10,
                }}>
                  <span style={{ fontFamily: 'var(--font-display, Caveat, cursive)', fontSize: 20, fontWeight: 600, color: '#171717' }}>
                    📚 World Book Day · April 23
                  </span>
                  <span style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#bebcbb' }}>
                    aiforgood.my/bookshelf
                  </span>
                </div>
              )}

              {/* ── Caption ── */}
              {captionEnabled && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  height: CAPTION_HEIGHT,
                  background: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '0 40px',
                  zIndex: 10,
                }}>
                  <span style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 32, fontWeight: 800, color: '#fff200',
                    textAlign: 'center',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: '100%',
                  }}>
                    {captionText || 'My reading in 2025'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom download ── */}
      <button
        onClick={handleDownload}
        disabled={loading}
        style={{
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
          border: '2px solid #000', padding: '11px 0', cursor: loading ? 'wait' : 'pointer',
          background: loading ? '#d6d3d1' : '#000', color: '#fff200',
          transition: 'background 0.1s', width: '100%',
        }}
      >
        {loading ? 'Rendering…' : `↓ Download ${ASPECT_RATIO_DIMS[ratio].label}`}
      </button>
    </div>
  );
}
