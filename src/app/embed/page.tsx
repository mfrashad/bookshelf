'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { decodePayload, payloadToShelves } from '@/lib/embed';
import BookStackChart from '@/components/viz/BookStackChart';
import { CoverGrid } from '@/components/viz/CoverGrid';
import { WallShelf } from '@/components/viz/WallShelf';
import { MosaicGrid } from '@/components/viz/MosaicGrid';
import { ScatterDrift } from '@/components/viz/ScatterDrift';
import type { VizMode } from '@/lib/types';

function EmbedContent() {
  const params   = useSearchParams();
  const d        = params.get('d') ?? '';
  const vizParam = (params.get('viz') ?? '') as VizMode;

  const payload = useMemo(() => (d ? decodePayload(d) : null), [d]);
  const shelves = useMemo(() => (payload ? payloadToShelves(payload) : []), [payload]);
  const viz: VizMode = (['stack', 'grid', 'wall', 'mosaic', 'scatter'] as VizMode[]).includes(vizParam)
    ? vizParam
    : (payload?.viz ?? 'grid');

  if (!payload || shelves.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', color: '#888', fontSize: 14 }}>
        No library data.
      </div>
    );
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {viz === 'stack'   && <BookStackChart shelves={shelves} />}
      {viz === 'grid'    && <CoverGrid      shelves={shelves} />}
      {viz === 'wall'    && <WallShelf      shelves={shelves} />}
      {viz === 'mosaic'  && <MosaicGrid     shelves={shelves} />}
      {viz === 'scatter' && <ScatterDrift   shelves={shelves} />}
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
      <EmbedContent />
    </Suspense>
  );
}
