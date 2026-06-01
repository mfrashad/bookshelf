import type { Metadata } from 'next';
import Link from 'next/link';
import { BuildForPublicLogo } from '@/components/ui/BuildForPublicLogo';

export const metadata: Metadata = {
  title: 'Our Mission — Literacy for Everyone',
  description:
    '773 million adults cannot read. Learn how sharing your reading poster helps raise awareness and direct support to literacy NGOs like Room to Read and Book Aid International.',
  openGraph: {
    title: 'Our Mission — Bookshelf',
    description:
      '773 million adults cannot read. Here\'s the scale of the problem — and who\'s working to fix it.',
  },
  alternates: {
    canonical: '/impact',
  },
};

const F = {
  heading: { fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.05, color: '#000' },
  body: { fontFamily: 'var(--font-geist, sans-serif)', fontWeight: 400, color: '#000', lineHeight: 1.65 },
};

const DEEP_STATS = [
  {
    value: '773M',
    label: 'adults worldwide cannot read or write',
    context: "That's roughly 1 in 10 people alive today. Most live in South Asia and sub-Saharan Africa. Most are women.",
    source: 'UNESCO Institute for Statistics, 2022',
    bg: '#94e8ff',
  },
  {
    value: '1 in 4',
    label: 'children leave primary school unable to read',
    context: 'In low-income countries, that number is closer to 9 in 10. They age out of the system before they get the basics.',
    source: 'World Bank, 2022',
    bg: '#ffc0a1',
  },
  {
    value: '171M',
    label: 'people could escape poverty with basic literacy',
    context: "Reading unlocks everything else — employment, health information, civic participation. It's not a soft skill.",
    source: 'UNESCO, 2014',
    bg: '#fff200',
  },
  {
    value: '$1',
    label: 'invested in literacy returns $10–30 to society',
    context: 'Literate adults earn more, need less healthcare, and raise children who stay in school longer.',
    source: 'EFA Global Monitoring Report',
    bg: '#6ff5b6',
  },
];

const NGOS = [
  {
    name: 'Room to Read',
    tag: 'Libraries & teacher training',
    bg: '#94e8ff',
    desc: 'Builds school libraries and trains local teachers in Asia and Africa. Since 2000, they\'ve reached over 43 million children across 20,000+ schools.',
    impact: '43M+ children reached',
    url: 'https://www.roomtoread.org',
  },
  {
    name: 'Book Aid International',
    tag: 'Books to where they\'re needed most',
    bg: '#ffc0a1',
    desc: 'Ships books to libraries, schools, hospitals, and refugee camps across sub-Saharan Africa — places where a single donated book gets read by dozens of people.',
    impact: '1M+ books sent per year',
    url: 'https://bookaid.org',
  },
  {
    name: 'Pratham',
    tag: 'Foundational literacy in India',
    bg: '#fff200',
    desc: 'India\'s largest education NGO runs the ASER survey — the most rigorous annual measure of child literacy in the developing world — and runs village-level reading programs.',
    impact: '3M+ children enrolled',
    url: 'https://www.pratham.org',
  },
];

export default function ImpactPage() {
  return (
    <main data-testid="impact-page" style={{ background: '#fff', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: '#94e8ff', borderBottom: '3px solid #000', padding: '72px 24px 64px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <Link
            href="/"
            style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#000', textDecoration: 'none', display: 'inline-block', marginBottom: 40, opacity: 0.6 }}
          >
            ← Back
          </Link>
          <div style={{ background: '#fff200', border: '2px solid #000', padding: '6px 14px', display: 'inline-block', marginBottom: 20, boxShadow: '3px 3px 0px #000' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Why this exists</span>
          </div>
          <h1 style={{ ...F.heading, fontSize: 'clamp(32px, 6vw, 56px)', marginBottom: 20 }}>
            Reading is a privilege.<br />
            Most people treat it like a given.
          </h1>
          <p style={{ ...F.body, fontSize: 18, maxWidth: 580 }}>
            If you're reading this, you can read. That already puts you ahead of 773 million adults.
            This page is about what that gap looks like — and who's doing something about it.
          </p>
        </div>
      </div>

      {/* Deep stats */}
      <div style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 32 }}>
            The scale of the problem
          </p>
          <div style={{ display: 'grid', gap: 20 }}>
            {DEEP_STATS.map((s) => (
              <div key={s.value} style={{ background: s.bg, border: '2px solid #000', padding: '28px', boxShadow: '5px 5px 0px #000', display: 'grid', gridTemplateColumns: '140px 1fr', gap: 24, alignItems: 'start' }}>
                <div>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: '#000', lineHeight: 1, marginBottom: 8 }}>
                    {s.value}
                  </p>
                  <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontWeight: 700, fontSize: 13, color: '#000', lineHeight: 1.4 }}>
                    {s.label}
                  </p>
                </div>
                <div>
                  <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 15, color: '#000', lineHeight: 1.65, marginBottom: 8 }}>
                    {s.context}
                  </p>
                  <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 11, color: 'rgba(0,0,0,0.45)' }}>
                    {s.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why a poster tool */}
      <div style={{ borderTop: '3px solid #000', borderBottom: '3px solid #000', background: '#111', padding: '72px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
            So why build a poster tool?
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px, 4vw, 36px)', color: '#fff', lineHeight: 1.15, marginBottom: 24 }}>
            Because people share things they're proud of.<br />
            <span style={{ background: '#fff200', color: '#000', padding: '0 4px' }}>We made something worth sharing.</span>
          </h2>
          <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 16, color: '#ccc', lineHeight: 1.7, marginBottom: 16, maxWidth: 580 }}>
            Most awareness campaigns ask you to care about strangers. That's a hard sell.
            This one starts with something you already care about — your own reading life.
          </p>
          <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 16, color: '#ccc', lineHeight: 1.7, maxWidth: 580 }}>
            You make a poster. You post it. Someone sees it and lands here. They read about
            773 million people who can't do what you and they both just did. Some of them give.
            That's not a grand theory — it's just how attention moves on the internet, pointed at something real.
          </p>
        </div>
      </div>

      {/* NGOs */}
      <div style={{ padding: '72px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Organisations doing the work
          </p>
          <h2 style={{ ...F.heading, fontSize: 'clamp(24px, 4vw, 36px)', marginBottom: 40 }}>
            We direct attention here.
          </h2>
          <div style={{ display: 'grid', gap: 24, marginBottom: 48 }}>
            {NGOS.map((ngo) => (
              <div key={ngo.name} style={{ background: ngo.bg, border: '2px solid #000', padding: '28px', boxShadow: '5px 5px 0px #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div>
                    <div style={{ background: '#000', color: '#fff', display: 'inline-block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, padding: '3px 8px', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                      {ngo.tag}
                    </div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#000' }}>{ngo.name}</p>
                  </div>
                  <div style={{ background: '#000', padding: '8px 16px' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#fff200', whiteSpace: 'nowrap' }}>{ngo.impact}</p>
                  </div>
                </div>
                <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 15, color: '#000', lineHeight: 1.65, marginBottom: 20 }}>{ngo.desc}</p>
                <a
                  href={ngo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, color: '#000', textDecoration: 'underline', textUnderlineOffset: 3 }}
                >
                  Visit {ngo.name} →
                </a>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link
              href="/give"
              style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, border: '2px solid #000', padding: '14px 32px', background: '#000', color: '#fff200', textDecoration: 'none', boxShadow: '4px 4px 0px #555' }}
            >
              Give to a literacy NGO →
            </Link>
            <Link
              href="/library"
              style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 15, color: '#000', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Create your poster
            </Link>
          </div>
        </div>
      </div>

      {/* Attribution */}
      <div style={{ borderTop: '2px solid #eee', padding: '40px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ background: '#94e8ff', border: '2px solid #000', padding: '32px', boxShadow: '5px 5px 0px #000' }}>
            <div style={{ marginBottom: 16 }}>
              <a href="https://buildforpublic.com" target="_blank" rel="noopener noreferrer">
                <BuildForPublicLogo height={30} />
              </a>
            </div>
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 15, color: '#000', lineHeight: 1.7, marginBottom: 12 }}>
              Bookshelf is an open-source project by{' '}
              <a href="https://buildforpublic.com" target="_blank" rel="noopener noreferrer" style={{ color: '#000', fontWeight: 700, textDecoration: 'underline' }}>
                Build for Public
              </a>
              {' '}— a community of builders shipping open-source tools for social good. We connect developers,
              designers, and advocates to build things that matter for real people and communities.
            </p>
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 15, color: '#000', lineHeight: 1.7 }}>
              Every library shared is a reminder that reading is a privilege — and a right.
            </p>
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 20 }}>
              Built by{' '}
              <a href="https://rashadcodes.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(0,0,0,0.5)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Rashad
              </a>
              {' · '}
              <a href="https://buildforpublic.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(0,0,0,0.4)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Join Build for Public →
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Footer links */}
      <div style={{ borderTop: '2px solid #eee', padding: '24px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#bbb' }}>
          <a href="https://github.com/mfrashad/bookshelf" target="_blank" rel="noopener noreferrer" style={{ color: '#bbb', textDecoration: 'underline', textUnderlineOffset: 2, textDecorationStyle: 'dotted' }}>★ Star on GitHub</a>
          <span style={{ margin: '0 8px', color: '#ddd' }}>·</span>
          <a href="https://github.com/mfrashad/bookshelf/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" style={{ color: '#bbb', textDecoration: 'underline', textUnderlineOffset: 2, textDecorationStyle: 'dotted' }}>Contribute</a>
          <span style={{ margin: '0 8px', color: '#ddd' }}>·</span>
          <a href="https://buildforpublic.com" target="_blank" rel="noopener noreferrer" style={{ color: '#bbb', textDecoration: 'underline', textUnderlineOffset: 2, textDecorationStyle: 'dotted' }}>buildforpublic.com</a>
        </p>
      </div>

    </main>
  );
}
