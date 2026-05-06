'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const CARDS = [
  { href: '/import/hardcover', icon: '📖', bg: '#94e8ff', title: 'Hardcover', description: 'Paste your API key and we\'ll sync all your read books automatically.', helpHref: '/guides/hardcover', helpText: 'Get your API key →' },
  { href: '/import/goodreads', icon: '📊', bg: '#fff200', title: 'Goodreads CSV', description: 'Export your library from Goodreads and upload the CSV file.', helpHref: '/guides/goodreads', helpText: 'How to export →' },
  { href: '/library',          icon: '✏️', bg: '#f5f5f5', title: 'Add manually',  description: 'Start with an empty library and add books one by one.' },
];

function ImportCard({ href, icon, bg, title, description, helpHref, helpText }: typeof CARDS[number]) {
  const router = useRouter();
  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => e.key === 'Enter' && router.push(href)}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 16, background: bg, border: '2px solid #000', padding: '24px 20px', boxShadow: '4px 4px 0px #000', cursor: 'pointer', outline: 'none', transition: 'box-shadow 0.1s, transform 0.1s' }}
      className="hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_#000]"
    >
      <span style={{ fontSize: 32, lineHeight: 1 }}>{icon}</span>
      <div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#000', marginBottom: 4 }}>{title}</p>
        <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#000', lineHeight: 1.5 }}>{description}</p>
        {helpHref && helpText && (
          <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#505050', marginTop: 6 }}>
            Need help?{' '}
            <Link href={helpHref} style={{ color: '#000', textDecoration: 'underline' }} onClick={(e) => e.stopPropagation()}>{helpText}</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <main style={{ background: '#fff', minHeight: '100vh', padding: '64px 24px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Link href="/library" style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#666', textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← Back to library
        </Link>

        <div style={{ background: '#fff200', border: '2px solid #000', padding: '6px 14px', display: 'inline-block', marginBottom: 16, boxShadow: '3px 3px 0px #000' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Step 1</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(32px, 5vw, 48px)', color: '#000', lineHeight: 1.05, marginBottom: 12 }}>
          Import your books
        </h1>
        <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 18, color: '#000', marginBottom: 36, lineHeight: 1.5 }}>
          Choose how you want to add your reading library.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {CARDS.map((c) => <ImportCard key={c.href} {...c} />)}
        </div>
      </div>
    </main>
  );
}
