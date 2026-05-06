'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const SESSION_KEY = 'book-poster:literacy-modal-seen';

type ViewId = 'adults' | 'women' | 'children' | 'malaysia';

interface BarSegment {
  pct: number;
  color: string;
  label: string;
}

interface ViewConfig {
  id: ViewId;
  label: string;
  stat: string;
  headline: string;
  sub: string;
  bars: BarSegment[];
}

const VIEWS: ViewConfig[] = [
  {
    id: 'adults',
    label: 'Adults',
    stat: '1 in 5',
    headline: 'adults worldwide cannot read or write.',
    sub: "That's 773 million people.",
    bars: [
      { pct: 80, color: '#1a1a1a', label: 'can read' },
      { pct: 20, color: '#e84040', label: 'cannot read' },
    ],
  },
  {
    id: 'women',
    label: 'Women',
    stat: '2 in 3',
    headline: 'illiterate adults are women or girls.',
    sub: 'Illiteracy hits women hardest — everywhere.',
    bars: [
      { pct: 80, color: '#1a1a1a', label: 'can read' },
      { pct: 13, color: '#d4626a', label: 'illiterate women' },
      { pct: 7, color: '#4e8bbd', label: 'illiterate men' },
    ],
  },
  {
    id: 'children',
    label: 'Children',
    stat: '1 in 3',
    headline: 'children cannot read proficiently.',
    sub: '617 million children are falling behind.',
    bars: [
      { pct: 67, color: '#1a1a1a', label: 'reading well' },
      { pct: 33, color: '#e84040', label: 'below proficiency' },
    ],
  },
  {
    id: 'malaysia',
    label: '🇲🇾 MY',
    stat: '42%',
    headline: "of Malaysian primary-school children can't read proficiently.",
    sub: 'Despite a 97% national literacy rate. World Bank, 2024.',
    bars: [
      { pct: 58, color: '#1a1a1a', label: 'reading proficiently' },
      { pct: 42, color: '#e84040', label: 'below proficiency' },
    ],
  },
];

interface LiteracyBannerProps {
  bookCount: number;
}

export function LiteracyBanner({ bookCount }: LiteracyBannerProps) {
  const [visible, setVisible] = useState(false);
  const [view, setView] = useState<ViewId>('adults');
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (bookCount < 1) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const t = setTimeout(() => setVisible(true), 700);
    return () => clearTimeout(t);
  }, [bookCount]);

  useEffect(() => {
    if (!visible) return;
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 60);
    return () => clearTimeout(t);
  }, [visible, view]);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(SESSION_KEY, '1');
    setVisible(false);
  }

  const config = VIEWS.find((v) => v.id === view)!;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.62)', padding: '16px' }}
      onClick={dismiss}
    >
      <div
        data-testid="literacy-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', border: '3px solid #000', boxShadow: '8px 8px 0px #000', padding: '28px', maxWidth: 440, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Personal hook */}
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(17px, 4vw, 22px)', color: '#000', lineHeight: 1.25, marginBottom: 18 }}>
          You&apos;ve read{' '}
          <span style={{ background: '#fff200', padding: '0 4px' }}>{bookCount} book{bookCount !== 1 ? 's' : ''}</span>.{' '}
          773 million adults have never read a single one.
        </p>

        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {VIEWS.map((v) => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              style={{
                fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12,
                border: '2px solid #000', padding: '4px 14px', cursor: 'pointer',
                background: view === v.id ? '#000' : '#fff',
                color: view === v.id ? '#fff200' : '#000',
                boxShadow: view === v.id ? 'none' : '2px 2px 0px #000',
                transition: 'all 0.1s',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Stat callout + headline */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
          <div style={{
            background: '#fff200', border: '2px solid #000', boxShadow: '3px 3px 0px #000',
            padding: '10px 12px', flexShrink: 0, textAlign: 'center', minWidth: 76,
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(20px, 5vw, 26px)', color: '#000', lineHeight: 1 }}>
              {config.stat}
            </div>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, color: '#000', lineHeight: 1.35, marginBottom: 4 }}>
              {config.headline}
            </p>
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#666', lineHeight: 1.4 }}>
              {config.sub}
            </p>
          </div>
        </div>

        {/* Stacked proportion bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', height: 28, border: '2px solid #000', overflow: 'hidden', marginBottom: 8 }}>
            {config.bars.map((seg, i) => (
              <div
                key={i}
                style={{
                  height: '100%',
                  width: `${seg.pct}%`,
                  background: seg.color,
                  transform: `scaleX(${animated ? 1 : 0})`,
                  transformOrigin: 'left center',
                  transition: `transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.12}s`,
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
            {config.bars.map((seg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 10, background: seg.color, flexShrink: 0, border: '1px solid rgba(0,0,0,0.15)' }} />
                <span style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 11, color: '#555' }}>
                  {seg.pct}% {seg.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Link
            href="/give"
            onClick={dismiss}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, border: '2px solid #000', padding: '10px 14px', background: '#000', color: '#fff200', textDecoration: 'none', flex: 1, textAlign: 'center', boxShadow: '3px 3px 0px #666' }}
          >
            Support literacy →
          </Link>
          <button
            onClick={dismiss}
            style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, border: '2px solid #000', padding: '10px 18px', background: '#fff', color: '#000', cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
