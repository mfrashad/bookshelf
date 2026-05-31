'use client';

import { getBanReason } from '@/data/banned-books';
import type { OpenAccessInfo } from '@/hooks/useOpenAccess';

// ─── Ring styles ──────────────────────────────────────────────────────────────
// Prepend to existing boxShadow strings.
export const BANNED_RING       = '0 0 0 3px #b91c1c';
export const PUBLIC_DOMAIN_RING = '0 0 0 2px #15803d';

// ─── Overlays (go INSIDE overflow:hidden) ─────────────────────────────────────

export function BannedOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none',
      background: 'rgba(185, 28, 28, 0.32)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontSize: 40, lineHeight: 1, filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.55))' }}>
        🚫
      </span>
    </div>
  );
}

export function PublicDomainOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 9, pointerEvents: 'none',
      background: 'rgba(21, 128, 61, 0.18)',
    }} />
  );
}

// ─── Tooltip (goes OUTSIDE overflow:hidden, triggered by card-level hover) ────

export function BannedTooltip({ title, show }: { title: string; show: boolean }) {
  const reason = getBanReason(title);
  if (!show || !reason) return null;
  return (
    <div style={{
      position: 'absolute',
      bottom: 'calc(100% + 8px)',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 200,
      background: '#1a1a1a',
      color: '#fff',
      fontSize: 11,
      lineHeight: 1.5,
      padding: '8px 10px',
      borderRadius: 6,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      pointerEvents: 'none',
      zIndex: 100,
      whiteSpace: 'normal',
    }}>
      {reason}
      <div style={{
        position: 'absolute', bottom: -5, left: '50%', marginLeft: -5,
        width: 10, height: 10, background: '#1a1a1a', transform: 'rotate(45deg)',
      }} />
    </div>
  );
}

// ─── Open access label (goes OUTSIDE overflow:hidden) ─────────────────────────

export function OpenAccessBadge({ info, isbn }: { info: OpenAccessInfo; isbn?: string }) {
  if (info.access !== 'public') return null;
  const href = info.url
    ?? (isbn
      ? `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(isbn)}`
      : 'https://www.gutenberg.org');
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Freely readable on Project Gutenberg / Open Library"
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', bottom: 4, left: 4, zIndex: 10,
        background: '#15803d', color: '#fff',
        fontSize: 7, fontWeight: 700, letterSpacing: '0.05em',
        padding: '2px 4px', borderRadius: 3, lineHeight: 1,
        textDecoration: 'none', textTransform: 'uppercase',
      }}
    >
      Public Domain
    </a>
  );
}
