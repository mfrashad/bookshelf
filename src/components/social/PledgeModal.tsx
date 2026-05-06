'use client';

import { useState, useEffect } from 'react';

const LS_KEY = 'book-poster:pledge-dismissed';
// Import pages set this flag so the modal only fires once, right after importing
const SS_TRIGGER = 'book-poster:show-pledge';

interface PledgeModalProps {
  bookCount: number;
}

export function PledgeModal({ bookCount }: PledgeModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (bookCount < 1) return;
    if (localStorage.getItem(LS_KEY)) return;
    if (!sessionStorage.getItem(SS_TRIGGER)) return;
    sessionStorage.removeItem(SS_TRIGGER);
    setVisible(true);
  }, [bookCount]);

  if (!visible) return null;

  function dismiss() {
    localStorage.setItem(LS_KEY, '1');
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.35)' }}
      onClick={dismiss}
    >
      <div
        data-testid="pledge-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fdfbf9',
          borderRadius: 12,
          boxShadow: 'rgba(0,0,0,0.06) 0px 2px 20px 0px',
          padding: '32px',
          maxWidth: 440,
          width: '90vw',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display, Caveat, cursive)',
            fontSize: 32,
            fontWeight: 600,
            lineHeight: 1.2,
            color: '#171717',
            marginBottom: 12,
          }}
        >
          You&apos;ve read{' '}
          <span style={{ color: '#ff6f1e' }}>{bookCount} book{bookCount !== 1 ? 's' : ''}</span>.
          <br />
          Could you give one back?
        </h2>
        <p
          style={{
            fontFamily: 'var(--font-geist, sans-serif)',
            fontSize: 16,
            color: '#44403c',
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Pledge RM1 per book you read and help put books in the hands of children who need them most.
        </p>
        <div className="flex gap-3">
          <a
            href="https://give.my"
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            style={{
              fontFamily: 'var(--font-display, Caveat, cursive)',
              fontSize: 18,
              border: '1px solid #171717',
              borderRadius: 20,
              padding: '6px 28px',
              background: '#fdfbf9',
              color: '#171717',
              textDecoration: 'none',
              display: 'inline-block',
            }}
            className="hover:bg-stone-100 transition"
          >
            Pledge now →
          </a>
          <button
            onClick={dismiss}
            style={{
              fontFamily: 'var(--font-geist, sans-serif)',
              fontSize: 14,
              color: '#78716c',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 8px',
            }}
            className="hover:text-stone-800 transition"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
