'use client';

import { useState } from 'react';
import BookStackChart from '@/components/viz/BookStackChart';
import { ExportSurface } from '@/components/export/ExportSurface';
import { FIXTURE_SHELVES } from '@/lib/fixture-data';
import type { AspectRatio } from '@/lib/types';
import { ASPECT_RATIO_DIMS } from '@/lib/types';

export default function TestStackPage() {
  const [showExport, setShowExport] = useState(false);
  const [ratio, setRatio] = useState<AspectRatio>('square');

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif', background: '#fafaf9', minHeight: '100vh' }}>
      <h1 data-testid="page-title" style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
        Stack Chart — Test Page
      </h1>
      <p style={{ color: '#78716c', marginBottom: 24 }}>
        {FIXTURE_SHELVES.reduce((n, s) => n + s.books.length, 0)} books across {FIXTURE_SHELVES.length} years
      </p>

      <div data-testid="stack-chart-container">
        <BookStackChart shelves={FIXTURE_SHELVES} />
      </div>

      <div style={{ marginTop: 32 }}>
        <button
          data-testid="export-button"
          onClick={() => setShowExport(true)}
          style={{ background: '#1c1917', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 14 }}
        >
          Export image
        </button>
      </div>

      {showExport && (
        <div data-testid="export-panel" style={{ marginTop: 24, maxWidth: 400 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(Object.keys(ASPECT_RATIO_DIMS) as AspectRatio[]).map((r) => (
              <button
                key={r}
                data-testid={`ratio-${r}`}
                onClick={() => setRatio(r)}
                style={{
                  padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
                  background: ratio === r ? '#1c1917' : '#fff',
                  color: ratio === r ? '#fff' : '#44403c',
                  border: `1px solid ${ratio === r ? '#1c1917' : '#d6d3d1'}`,
                }}
              >
                {ASPECT_RATIO_DIMS[r].label}
              </button>
            ))}
          </div>
          <ExportSurface shelves={FIXTURE_SHELVES} ratio={ratio} vizMode="stack" />
        </div>
      )}
    </div>
  );
}
