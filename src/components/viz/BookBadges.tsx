'use client';

import { useState } from 'react';
import { getBanReason } from '@/data/banned-books';
import type { OpenAccessInfo } from '@/hooks/useOpenAccess';

export function BannedBadge({ title }: { title: string }) {
  const [showTip, setShowTip] = useState(false);
  const reason = getBanReason(title);

  return (
    <div
      style={{ position: 'absolute', top: 4, right: 4, zIndex: 10 }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      <div style={{
        fontSize: 12, lineHeight: 1,
        background: 'rgba(255,255,255,0.9)',
        borderRadius: '50%', padding: 2,
        cursor: 'default',
      }}>
        🚫
      </div>
      {showTip && reason && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 6px)',
          right: 0,
          width: 180,
          background: '#1a1a1a',
          color: '#fff',
          fontSize: 11,
          lineHeight: 1.45,
          padding: '7px 9px',
          borderRadius: 6,
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
          pointerEvents: 'none',
          zIndex: 50,
          whiteSpace: 'normal',
        }}>
          {reason}
          {/* Arrow */}
          <div style={{
            position: 'absolute', bottom: -5, right: 8,
            width: 10, height: 10,
            background: '#1a1a1a',
            transform: 'rotate(45deg)',
          }} />
        </div>
      )}
    </div>
  );
}

export function OpenAccessBadge({ info, isbn }: { info: OpenAccessInfo; isbn?: string }) {
  if (info.access !== 'public') return null;
  const href = info.url ?? (isbn ? `https://openlibrary.org/search?isbn=${isbn}` : 'https://openlibrary.org');

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Freely readable on Open Library"
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
