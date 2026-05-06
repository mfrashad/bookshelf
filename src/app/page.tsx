'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const FEATURES = [
  { icon: '📚', title: 'Import', bg: '#94e8ff',  desc: 'Connect Hardcover or upload a Goodreads CSV — your whole library in seconds.' },
  { icon: '✏️', title: 'Curate', bg: '#fff200',  desc: 'Arrange books by year, fix missing covers, or add titles by hand.' },
  { icon: '🖼️', title: 'Download', bg: '#ffc0a1', desc: 'Export in any format — square, story, wide, or portrait — ready to post.' },
];

const READING_STATS = [
  {
    bg: '#fff200',
    fraction: '7 in 10',
    numerator: 7,
    denominator: 10,
    dotColor: '#7a6800',
    headline: 'Gen Z still choose physical books over e-books.',
    note: 'The "digital generation" reads more print than any other age group.',
    source: 'Publishers Association, 2024',
  },
  {
    bg: '#ffc0a1',
    fraction: '9 in 10',
    numerator: 9,
    denominator: 10,
    dotColor: '#8a2e00',
    headline: 'high earners read 30+ minutes every single day.',
    note: 'Readers with 500+ books at home gain 3.2 extra years of education — same as having graduate-educated parents.',
    source: 'Corley "Rich Habits" · Evans et al., 2010',
  },
  {
    bg: '#94e8ff',
    fraction: '4×',
    numerator: 1,
    denominator: 5,
    dotColor: '#003d6b',
    headline: "less likely to graduate high school if you can't read by age 8.",
    note: '63% of all high school dropouts were struggling readers in 3rd grade.',
    source: 'Annie E. Casey Foundation, 2011',
  },
];

const LITERACY_STATS = [
  { value: '773M', label: 'adults worldwide cannot read or write', bg: '#94e8ff' },
  { value: '1 in 4', label: 'children leave primary school unable to read', bg: '#ffc0a1' },
  { value: '171M', label: 'people could escape poverty if they learned to read', bg: '#fff200' },
];

const NGOS = [
  {
    name: 'Room to Read',
    desc: 'Builds libraries and trains teachers in low-income communities across Asia and Africa.',
    url: 'https://www.roomtoread.org',
    tag: 'Libraries & literacy programs',
  },
  {
    name: 'Book Aid International',
    desc: 'Sends books to libraries, schools, and refugee camps in sub-Saharan Africa.',
    url: 'https://bookaid.org',
    tag: 'Books for underserved communities',
  },
];

const VIZ_PREVIEWS = [
  { src: '/preview-stack.png', label: 'Stack Chart', desc: 'Your reading year as stacked bars — see which shelves dominated.' },
  { src: '/preview-grid.png',  label: 'Cover Grid',  desc: 'Every book you read, tiled into one beautiful mosaic.' },
  { src: '/preview-mosaic.png', label: 'Diamond Mosaic', desc: 'Covers in a bold diamond-grid pattern. Instagram-ready.' },
];

function MiniDots({ numerator, denominator, filled, empty }: { numerator: number; denominator: number; filled: string; empty: string }) {
  return (
    <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
      {Array.from({ length: denominator }, (_, i) => (
        <div
          key={i}
          style={{
            width: 18, height: 18, borderRadius: '50%',
            background: i < numerator ? filled : 'transparent',
            border: `2px solid ${i < numerator ? filled : empty}`,
          }}
        />
      ))}
    </div>
  );
}

const F = {
  heading: { fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.05, color: '#000' },
  body: { fontFamily: 'var(--font-geist, sans-serif)', fontWeight: 400, color: '#000', lineHeight: 1.5 },
  btn: {
    display: 'inline-block',
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: 18,
    background: '#fff',
    color: '#000',
    border: '2px solid #000',
    borderRadius: 0,
    padding: '14px 32px',
    textDecoration: 'none',
    cursor: 'pointer',
    boxShadow: '4px 4px 0px #000',
    transition: 'box-shadow 0.1s, transform 0.1s',
  } as React.CSSProperties,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Bookshelf',
  url: 'https://bookshelf.aiforgood.my',
  description:
    'Turn your Goodreads or Hardcover reading library into a beautiful shareable poster. Free digital bookshelf tracker and reading visualization tool.',
  applicationCategory: 'LifestyleApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  author: {
    '@type': 'Person',
    name: 'Fathy Rashad',
    url: 'https://rashadcodes.com',
  },
  creator: {
    '@type': 'Organization',
    name: 'AI for Good Malaysia',
    url: 'https://aiforgood.my',
  },
  keywords:
    'digital bookshelf, book tracker, reading tracker, reading wrapped, book poster, goodreads export, reading visualization, literacy, world book day',
};

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [statsOpen, setStatsOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const slideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/library');
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    slideTimer.current = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        setSlideIndex(i => (i + 1) % VIZ_PREVIEWS.length);
        setFading(false);
      }, 400);
    }, 3200);
    return () => { if (slideTimer.current) clearTimeout(slideTimer.current); };
  }, [slideIndex]);

  return (
    <main style={{ background: '#fff', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── Hero ── */}
      <div style={{ background: '#94e8ff', borderBottom: '3px solid #000', padding: '80px 24px 0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <h1 style={{ ...F.heading, fontSize: 'clamp(40px, 7vw, 72px)', marginBottom: 20 }}>
            Your reading life,<br />
            <span style={{ background: '#fff200', padding: '0 6px' }}>beautifully</span> visualized
          </h1>
          <p style={{ ...F.body, fontSize: 20, maxWidth: 520, marginBottom: 36 }}>
            Connect Goodreads or Hardcover, pick a style, and download a beautiful
            image of every book you read — in seconds.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 52 }}>
            <Link href="/library" style={F.btn} className="hover:-translate-y-0.5 hover:shadow-[4px_6px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none">
              Get started — free
            </Link>
            <Link
              href="/sign-in"
              style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 15, color: '#000', textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              Sign in
            </Link>
          </div>

          {/* Hero slideshow — widescreen, natural aspect ratio */}
          <div style={{ border: '3px solid #000', borderBottom: 'none', boxShadow: '6px 0px 0px #000, -6px 0px 0px #000', overflow: 'hidden', position: 'relative' }}>
            <Image
              src={VIZ_PREVIEWS[slideIndex].src}
              alt={VIZ_PREVIEWS[slideIndex].label}
              width={1920}
              height={1080}
              style={{ width: '100%', height: 'auto', display: 'block', opacity: fading ? 0 : 1, transition: 'opacity 0.4s ease' }}
              priority
            />
            {/* Slide label + dots */}
            <div style={{ position: 'absolute', bottom: 16, right: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12, color: '#fff', background: 'rgba(0,0,0,0.55)', padding: '4px 10px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {VIZ_PREVIEWS[slideIndex].label}
              </span>
              <div style={{ display: 'flex', gap: 5 }}>
                {VIZ_PREVIEWS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setFading(true); setTimeout(() => { setSlideIndex(i); setFading(false); }, 400); }}
                    style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, background: i === slideIndex ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'background 0.2s' }}
                    aria-label={VIZ_PREVIEWS[i].label}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '72px 24px' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          How it works
        </p>
        <h2 style={{ ...F.heading, fontSize: 'clamp(26px, 4vw, 38px)', marginBottom: 36 }}>
          Three steps. No design skills required.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              style={{ background: f.bg, border: '2px solid #000', padding: '28px 24px', boxShadow: '5px 5px 0px #000' }}
            >
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>
                0{i + 1}
              </div>
              <h3 style={{ ...F.heading, fontSize: 22, marginBottom: 8 }}>{f.title}</h3>
              <p style={{ ...F.body, fontSize: 15 }}>{f.desc}</p>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#666', marginTop: 40, textAlign: 'center' }}>
          No account needed to try it. Sign in to save your library across devices.
        </p>
      </div>

      {/* ── Visualization styles ── */}
      <div style={{ borderTop: '3px solid #000', borderBottom: '3px solid #000', background: '#111', padding: '64px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Three styles
          </p>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(24px, 4vw, 38px)', color: '#fff', marginBottom: 48, lineHeight: 1.1 }}>
            Pick the look that tells <span style={{ background: '#fff200', color: '#000', padding: '0 4px' }}>your</span> story.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
            {VIZ_PREVIEWS.map((v) => (
              <div key={v.label}>
                <div style={{ border: '2px solid #333', overflow: 'hidden', marginBottom: 14, background: '#1a1a1a' }}>
                  <Image
                    src={v.src}
                    alt={v.label}
                    width={800}
                    height={600}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                    sizes="(max-width: 960px) 100vw, 320px"
                  />
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 4 }}>{v.label}</p>
                <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#999', lineHeight: 1.5 }}>{v.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <Link href="/library" style={{ ...F.btn, background: '#fff200', border: '2px solid #fff200', boxShadow: '4px 4px 0px #555' }}>
              Make yours now →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Mission ── */}
      <div style={{ background: '#fdfbf9', padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Hook */}
          <div style={{ background: '#fff200', border: '2px solid #000', padding: '6px 14px', display: 'inline-block', marginBottom: 20, boxShadow: '3px 3px 0px #000' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Why this exists</span>
          </div>
          <h2 style={{ ...F.heading, fontSize: 'clamp(28px, 5vw, 48px)', marginBottom: 16 }}>
            Reading is a privilege.<br />773 million people don't have it.
          </h2>
          <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 18, color: '#000', lineHeight: 1.65, marginBottom: 48, maxWidth: 600 }}>
            We made a tool people actually want to share — and wired it to a cause.
            When you post your reading year, people click through here. Some will read about the
            773 million people who can't. Some will give. That's the whole idea.
          </p>

          {/* Literacy stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 64 }}>
            {LITERACY_STATS.map((s) => (
              <div key={s.value} style={{ background: s.bg, border: '2px solid #000', padding: '24px', boxShadow: '4px 4px 0px #000' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, color: '#000', lineHeight: 1, marginBottom: 10 }}>
                  {s.value}
                </p>
                <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#000', lineHeight: 1.5 }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          {/* How sharing = advocacy */}
          <div style={{ borderLeft: '4px solid #000', paddingLeft: 24, marginBottom: 64 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
              How it works — the bigger picture
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 0 }}>
              {[
                { step: 'You share', detail: 'Post your reading year to Instagram or WhatsApp. It looks good. People click.' },
                { step: 'Friends discover', detail: 'They land here, see what you read, maybe recognize a title or two.' },
                { step: 'Awareness grows', detail: 'They read that 773 million adults cannot read or write. That number sticks.' },
                { step: 'NGOs get funded', detail: 'Some click through to Room to Read or Book Aid. Some give. It compounds.' },
              ].map((item, i, arr) => (
                <div key={item.step} style={{ display: 'flex', gap: 0 }}>
                  <div style={{ flex: 1, paddingRight: 16 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'rgba(0,0,0,0.35)', marginBottom: 4 }}>0{i + 1}</div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#000', marginBottom: 6 }}>{item.step}</p>
                    <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#444', lineHeight: 1.5 }}>{item.detail}</p>
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ paddingTop: 22, paddingRight: 12, color: '#bbb', fontWeight: 800, fontSize: 18 }}>→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* NGO spotlight */}
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
            Organisations we support
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 48 }}>
            {NGOS.map((ngo) => (
              <a
                key={ngo.name}
                href={ngo.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', background: '#fff', border: '2px solid #000', padding: '24px', boxShadow: '5px 5px 0px #000', textDecoration: 'none', color: '#000' }}
              >
                <div style={{ background: '#000', color: '#fff', display: 'inline-block', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11, padding: '3px 8px', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {ngo.tag}
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#000', marginBottom: 8 }}>{ngo.name}</p>
                <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#444', lineHeight: 1.55, marginBottom: 12 }}>{ngo.desc}</p>
                <span style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 13, color: '#000', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                  Learn more →
                </span>
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <Link href="/give" style={{ ...F.btn, background: '#000', color: '#fff200', border: '2px solid #000', boxShadow: '4px 4px 0px #555' }}>
              Give to a literacy NGO →
            </Link>
            <Link href="/impact" style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 15, color: '#000', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Read more about our mission
            </Link>
          </div>

          {/* Attribution card */}
          <div style={{ background: '#94e8ff', border: '2px solid #000', padding: '36px', boxShadow: '5px 5px 0px #000', marginTop: 56 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#000', marginBottom: 16 }}>
              Built with AI for Good
            </h3>
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 16, color: '#000', lineHeight: 1.7, marginBottom: 16 }}>
              This project is part of{' '}
              <a href="https://aiforgood.my" target="_blank" rel="noopener noreferrer" style={{ color: '#000', fontWeight: 700, textDecoration: 'underline' }}>
                aiforgood.my
              </a>
              {' '}— a Malaysian initiative using AI to create tools that matter. We believe technology
              should serve people, not just profit. Bookshelf was built on World Book Day as a free,
              open-source gift to readers everywhere.
            </p>
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 16, color: '#000', lineHeight: 1.7 }}>
              Every library shared is a reminder that reading is a privilege — and a right.
            </p>
            <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: 'rgba(0,0,0,0.4)', marginTop: 20 }}>
              Built by{' '}
              <a href="https://rashadcodes.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(0,0,0,0.5)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Rashad
              </a>
              {' · '}
              <a href="https://aiforgood.my" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(0,0,0,0.4)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                Volunteer with aiforgood.my →
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* ── Easter egg: Reading stats ── */}
      <div style={{ borderTop: '2px dashed #ddd', padding: '32px 24px', textAlign: 'center' }}>
        <button
          onClick={() => setStatsOpen(v => !v)}
          style={{
            fontFamily: 'var(--font-geist, sans-serif)',
            fontSize: 13,
            color: '#999',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
            textDecorationStyle: 'dotted',
          }}
        >
          {statsOpen ? '▲ hide fun facts' : '📖 did you know? (reading by the numbers)'}
        </button>

        {statsOpen && (
          <div style={{ maxWidth: 960, margin: '32px auto 0', textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
              {READING_STATS.map((s) => (
                <div
                  key={s.fraction}
                  style={{ background: s.bg, border: '2px solid #000', padding: '24px', boxShadow: '5px 5px 0px #000', display: 'flex', flexDirection: 'column' }}
                >
                  <MiniDots
                    numerator={s.numerator}
                    denominator={s.denominator}
                    filled={s.dotColor}
                    empty={s.dotColor}
                  />
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, color: '#000', lineHeight: 1, marginBottom: 6, marginTop: 4 }}>
                    {s.fraction}
                  </p>
                  <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#000', lineHeight: 1.5, marginBottom: 8, fontWeight: 600 }}>
                    {s.headline}
                  </p>
                  <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: 'rgba(0,0,0,0.55)', lineHeight: 1.5, marginBottom: 10, flex: 1 }}>
                    {s.note}
                  </p>
                  <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 11, color: 'rgba(0,0,0,0.38)' }}>
                    {s.source}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#bbb', marginTop: 28 }}>
          <a href="https://github.com/mfrashad/bookshelf" target="_blank" rel="noopener noreferrer" style={{ color: '#bbb', textDecoration: 'underline', textUnderlineOffset: 2, textDecorationStyle: 'dotted' }}>★ Star on GitHub</a>
          <span style={{ margin: '0 8px', color: '#ddd' }}>·</span>
          <a href="https://github.com/mfrashad/bookshelf/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer" style={{ color: '#bbb', textDecoration: 'underline', textUnderlineOffset: 2, textDecorationStyle: 'dotted' }}>Contribute</a>
          <span style={{ margin: '0 8px', color: '#ddd' }}>·</span>
          <a href="https://aiforgood.my" target="_blank" rel="noopener noreferrer" style={{ color: '#bbb', textDecoration: 'underline', textUnderlineOffset: 2, textDecorationStyle: 'dotted' }}>Volunteer with aiforgood</a>
        </p>
      </div>

    </main>
  );
}
