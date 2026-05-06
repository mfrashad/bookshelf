'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { bulkAddBooks } from '@/lib/local-storage';

const btnStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  fontSize: 17,
  background: '#fff200',
  color: '#000',
  border: '2px solid #000',
  borderRadius: 0,
  padding: '14px 28px',
  width: '100%',
  cursor: 'pointer',
  boxShadow: '4px 4px 0px #000',
  transition: 'box-shadow 0.1s, transform 0.1s',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '2px solid #000',
  borderRadius: 0,
  padding: '12px 14px',
  fontSize: 16,
  fontFamily: 'var(--font-geist, sans-serif)',
  background: '#f5f5f5',
  color: '#000',
  outline: 'none',
};

export default function ImportHardcoverPage() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/import/hardcover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to import books');
      bulkAddBooks(json.books);
      router.push('/library');
    } catch (err: any) {
      setError(err.message ?? 'Failed to import books');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ background: '#fff', minHeight: '100vh', padding: '64px 24px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Link href="/onboarding" style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#666', textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← Back
        </Link>

        <div style={{ background: '#94e8ff', border: '2px solid #000', padding: '6px 14px', display: 'inline-block', marginBottom: 16, boxShadow: '3px 3px 0px #000' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Hardcover</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(30px, 5vw, 44px)', color: '#000', lineHeight: 1.05, marginBottom: 12 }}>
          Connect Hardcover
        </h1>
        <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 17, color: '#000', marginBottom: 36, lineHeight: 1.5 }}>
          Paste your personal API key to sync all your read books.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="hardcover-api-key" style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: '#000', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Hardcover API key
            </label>
            <input
              id="hardcover-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here"
              style={inputStyle}
              required
              autoFocus
            />
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#666', marginTop: 6 }}>
              Get your key at{' '}
              <a href="https://hardcover.app/account/api" target="_blank" rel="noopener noreferrer" style={{ color: '#000', textDecoration: 'underline' }}>
                hardcover.app/account/api
              </a>
            </p>
          </div>

          {error && (
            <p data-testid="hardcover-error" style={{ border: '2px solid #000', background: '#ffc0a1', padding: '12px 14px', fontSize: 14, fontFamily: 'var(--font-geist, sans-serif)', color: '#000' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !apiKey.trim()}
            style={{ ...btnStyle, opacity: (loading || !apiKey.trim()) ? 0.5 : 1 }}
            className="hover:-translate-y-0.5 disabled:translate-y-0 disabled:shadow-[4px_4px_0px_#000]"
          >
            {loading ? 'Importing…' : 'Import from Hardcover'}
          </button>
        </form>
      </div>
    </main>
  );
}
