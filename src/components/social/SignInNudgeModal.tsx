'use client';

import { useState, useEffect } from 'react';
import { SignInButton } from '@clerk/nextjs';

const SS_KEY = 'book-poster:signin-nudge-dismissed';
const DELAY_MS = 8000;

interface SignInNudgeModalProps {
  isGuest: boolean;
  bookCount: number;
}

export function SignInNudgeModal({ isGuest, bookCount }: SignInNudgeModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isGuest || bookCount < 1) return;
    if (sessionStorage.getItem(SS_KEY)) return;
    const t = setTimeout(() => setVisible(true), DELAY_MS);
    return () => clearTimeout(t);
  }, [isGuest, bookCount]);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(SS_KEY, '1');
    setVisible(false);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.4)', padding: '16px' }}
      onClick={dismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          border: '3px solid #000',
          boxShadow: '6px 6px 0px #000',
          padding: '28px 28px 24px',
          maxWidth: 400,
          width: '100%',
          position: 'relative',
        }}
      >
        <button
          onClick={dismiss}
          style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#666', lineHeight: 1 }}
          aria-label="Dismiss"
        >
          ✕
        </button>

        <div style={{ fontSize: 32, marginBottom: 12 }}>☁️</div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#000', lineHeight: 1.2, marginBottom: 10 }}>
          Your library is only on this device
        </h2>
        <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#555', lineHeight: 1.6, marginBottom: 22 }}>
          Sign in to sync your {bookCount} book{bookCount !== 1 ? 's' : ''} to the cloud — access them from anywhere, never lose your list.
        </p>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <SignInButton mode="modal">
            <button
              onClick={dismiss}
              style={{
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
                border: '2px solid #000', padding: '8px 20px',
                background: '#fff200', color: '#000', cursor: 'pointer',
                boxShadow: '3px 3px 0px #000',
              }}
            >
              Sign in free →
            </button>
          </SignInButton>
          <button
            onClick={dismiss}
            style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
