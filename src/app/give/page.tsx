'use client';

import { useState } from 'react';
import Link from 'next/link';

// ─── Data ────────────────────────────────────────────────────────────────────

type Country = 'Malaysia' | 'Indonesia' | 'Philippines' | 'Singapore' | 'International';

interface Org {
  name: string;
  country: Country;
  tag: string;
  description: string;
  url: string;
  donateUrl?: string;
  cta: string;
  impact?: string;
}

const ORGS: Org[] = [
  // ── Malaysia ──────────────────────────────────────────────────────────────
  {
    name: 'Buku Beyond Bars',
    country: 'Malaysia',
    tag: '📚 Prison literacy',
    description:
      'Donates pre-loved books to incarcerated people in Malaysian prisons. Born from conversations with a former Sungai Buloh death-row inmate who spent 20 years reading to survive. 10,000+ books collected since Nov 2024.',
    url: 'https://mcchr.org',
    cta: 'Drop off books →',
    impact: '10,000+ books · Sungai Buloh Prison',
  },
  {
    name: 'MYReaders',
    country: 'Malaysia',
    tag: '🧒 Children\'s literacy',
    description:
      'Runs a 27-week structured Literacy Toolkit — phonics, fluency, vocabulary — in underserved schools and communities across Malaysia, developed by local teachers for local classrooms.',
    url: 'https://www.myreaders.org.my',
    donateUrl: 'https://www.myreaders.org.my/donate',
    cta: 'Donate →',
    impact: '36,262 students · 136 schools',
  },
  {
    name: 'Yayasan Generasi Gemilang',
    country: 'Malaysia',
    tag: '📖 Early childhood',
    description:
      'Runs KidzREAD, a research-backed early literacy program for B40 children. 100/100 transparency score. Tax-exempt donations. Also operates Super Sarapan (school nutrition) because hungry children can\'t learn.',
    url: 'https://www.gengemilang.org',
    donateUrl: 'https://www.gengemilang.org/donate/',
    cta: 'Donate →',
    impact: 'Multiple programs · Klang Valley & beyond',
  },
  {
    name: 'Teach For Malaysia',
    country: 'Malaysia',
    tag: '🏫 Schools & Orang Asli',
    description:
      'Places trained educators in Malaysia\'s highest-need schools — including Orang Asli community schools. 503,035 students impacted since 2012. 2022 Merdeka Award recipient.',
    url: 'https://teachformalaysia.org',
    donateUrl: 'https://teachformalaysia.org/donate/',
    cta: 'Donate →',
    impact: '503,035 students · 1,198 schools',
  },
  {
    name: 'SOLS Foundation',
    country: 'Malaysia',
    tag: '🌐 English & digital literacy',
    description:
      'Free English language education and digital literacy for B40 communities. Operating in Malaysia and 6 other countries. 800,000+ lives reached over 25 years.',
    url: 'https://sols.foundation',
    donateUrl: 'https://donate.sols.foundation',
    cta: 'Donate →',
    impact: '800,000+ lives · 7 countries',
  },
  {
    name: 'BookXcess Red Readerhood',
    country: 'Malaysia',
    tag: '📦 Book donations',
    description:
      'CSR arm of BookXcess — runs book donation drives with a 1-for-1 model. 200,000 free books given away in April 2025 alone. Partners with orphanages, charities, and low-income communities nationwide.',
    url: 'https://www.bookxcess.com/collections/donations',
    cta: 'Donate books →',
    impact: '200,000+ books in 2025',
  },
  {
    name: 'Buku Jalanan Chow Kit',
    country: 'Malaysia',
    tag: '🏙️ Refugee & undocumented kids',
    description:
      'Free tutoring and safe learning space for 89 children — undocumented, refugee, and urban-poor — in KL\'s Chow Kit area, where many are denied formal schooling.',
    url: 'https://www.facebook.com/bukujalananks/',
    cta: 'Learn more →',
    impact: '89 students · Primary to Form 4',
  },
  {
    name: 'Empowered2Teach (SUKA Society)',
    country: 'Malaysia',
    tag: '🌳 Orang Asli communities',
    description:
      'Establishes village pre-schools and trains local teachers specifically for Orang Asli communities — where adult literacy was only ~51% as recently as 2008 versus the national 93%.',
    url: 'http://empowered2teach.org',
    cta: 'Learn more →',
    impact: 'Orang Asli villages, Peninsula Malaysia',
  },

  // ── Indonesia ─────────────────────────────────────────────────────────────
  {
    name: 'Yayasan Literasi Anak Indonesia',
    country: 'Indonesia',
    tag: '🧒 Children\'s literacy',
    description:
      'Indonesia\'s largest dedicated children\'s literacy NGO. 70% of Indonesian 15-year-olds scored below minimum reading competency on PISA. YLAI works in 14 provinces from Aceh to Papua.',
    url: 'https://literasi.org/en/',
    donateUrl: 'https://literasi.org/en/',
    cta: 'Donate →',
    impact: '1M+ children · 15,000+ schools · 121 districts',
  },
  {
    name: 'Rumah Baca Komunitas',
    country: 'Indonesia',
    tag: '🏡 Community libraries',
    description:
      'Runs 24-hour community reading houses (rumah baca) open to everyone — not just enrolled students. Street libraries and tutoring for children in underserved rural and urban areas.',
    url: 'https://rumahliterasiindonesia.org/',
    cta: 'Learn more →',
  },
  {
    name: 'Room to Read — Indonesia',
    country: 'Indonesia',
    tag: '📚 School libraries',
    description:
      'School library development and teacher training. Active since 2006, operating across multiple Indonesian provinces. Part of Room to Read\'s global network that has reached 60M+ children.',
    url: 'https://www.roomtoread.org/indonesia/',
    donateUrl: 'https://roomtoread.donorsupport.co/-/XCBPKRBX',
    cta: 'Donate →',
  },

  // ── Philippines ───────────────────────────────────────────────────────────
  {
    name: 'Sa Aklat Sisikat Foundation',
    country: 'Philippines',
    tag: '🧒 Reading culture',
    description:
      'Partners with public elementary schools to build a reading culture: read-a-thons, teacher training, and classroom book access. NBER research confirmed 20% more children reading weekly after one year.',
    url: 'https://saaklatsisikat.org',
    cta: 'Learn more →',
    impact: '750+ schools · ~150,000 students',
  },
  {
    name: 'Read Your Way Out (UNODC)',
    country: 'Philippines',
    tag: '📚 Prison literacy',
    description:
      'The world\'s most ambitious prison reading program: 60 hours of reading earns 15 days off a sentence. Scaling to all 467 jails nationwide. Philippines is the first country in Asia to legally link reading to sentence reduction.',
    url: 'https://www.unodc.org/roseap/philippines/2023/04/read-your-way-out/story.html',
    cta: 'Read the story →',
    impact: '13 jail libraries · 467 jails planned',
  },

  // ── Singapore ─────────────────────────────────────────────────────────────
  {
    name: 'ReadAble',
    country: 'Singapore',
    tag: '🧒 Vulnerable children',
    description:
      'Saturday literacy and numeracy classes plus a community library for vulnerable children aged 4–16 in Jalan Kukoh — one of Singapore\'s most under-resourced areas. "Every child literate for life."',
    url: 'https://readablesg.com/',
    donateUrl: 'https://www.giving.sg/organisations/readable',
    cta: 'Donate →',
  },
  {
    name: 'SHINE Reading Odyssey',
    country: 'Singapore',
    tag: '📖 Low reading ability',
    description:
      'Supports children with low reading ability through volunteer-led sessions. 800+ children served; 800+ volunteers as of 2022.',
    url: 'https://www.shine.org.sg/reading-odyssey',
    cta: 'Learn more →',
    impact: '800+ children · 800+ volunteers',
  },

  // ── International ─────────────────────────────────────────────────────────
  {
    name: 'Room to Read',
    country: 'International',
    tag: '🌏 Asia & Africa',
    description:
      'The largest dedicated children\'s literacy NGO in the developing world. Active across all of Southeast Asia (Indonesia, Vietnam, Cambodia, Laos, Philippines, Myanmar) and South Asia and Africa.',
    url: 'https://www.roomtoread.org',
    donateUrl: 'https://roomtoread.donorsupport.co/-/XCBPKRBX',
    cta: 'Donate →',
    impact: '60M+ children · 29 countries · $1B invested',
  },
  {
    name: 'Books Beyond Bars',
    country: 'International',
    tag: '📚 Prison literacy · USA',
    description:
      'New York-based nonprofit sending free books to incarcerated people across 50+ prisons and jails. Every RM 1 invested in prison education saves RM 4–5 in incarceration costs within 3 years.',
    url: 'https://www.booksbeyondbars.org/',
    cta: 'Learn more →',
    impact: '10,000+ books · 50+ NY prisons',
  },
  {
    name: 'Children of the Mekong',
    country: 'International',
    tag: '🌏 Southeast Asia',
    description:
      'Supports vulnerable children in Thailand, Vietnam, Cambodia, Laos, Myanmar, and the Philippines — through school sponsorships, literacy projects, and community programs.',
    url: 'https://www.childrenofthemekong.org',
    cta: 'Learn more →',
    impact: '95,000+ children/year',
  },
];

// ─── Country config ───────────────────────────────────────────────────────────

const COUNTRY_CONFIG: Record<Country | 'All', { bg: string; emoji: string }> = {
  All:           { bg: '#000',    emoji: '🌍' },
  Malaysia:      { bg: '#fff200', emoji: '🇲🇾' },
  Indonesia:     { bg: '#94e8ff', emoji: '🇮🇩' },
  Philippines:   { bg: '#ffc0a1', emoji: '🇵🇭' },
  Singapore:     { bg: '#6ff5b6', emoji: '🇸🇬' },
  International: { bg: '#f0f0f0', emoji: '🌏' },
};

const FILTER_KEYS: (Country | 'All')[] = ['All', 'Malaysia', 'Indonesia', 'Philippines', 'Singapore', 'International'];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GivePage() {
  const [active, setActive] = useState<Country | 'All'>('All');

  const visible = active === 'All' ? ORGS : ORGS.filter((o) => o.country === active);

  return (
    <main data-testid="give-page" style={{ background: '#fff', minHeight: '100vh', padding: '56px 24px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/library" style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#666', textDecoration: 'none', display: 'inline-block', marginBottom: 40 }}>
          ← Back to library
        </Link>

        <div style={{ background: '#6ff5b6', border: '2px solid #000', padding: '6px 14px', display: 'inline-block', marginBottom: 14, boxShadow: '3px 3px 0px #000' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Give</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(28px, 6vw, 48px)', color: '#000', lineHeight: 1.05, marginBottom: 10 }}>
          Give a book.<br />Change a life.
        </h1>
        <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 17, color: '#333', lineHeight: 1.6, marginBottom: 36 }}>
          Your finished books can be someone else's first. Find an organisation near you.
        </p>

        {/* Country filter */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32 }}>
          {FILTER_KEYS.map((key) => {
            const cfg = COUNTRY_CONFIG[key];
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                style={{
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
                  border: '2px solid #000', padding: '6px 14px', cursor: 'pointer',
                  background: isActive ? (key === 'All' ? '#000' : cfg.bg) : '#fff',
                  color: isActive && key === 'All' ? '#fff200' : '#000',
                  boxShadow: isActive ? 'none' : '2px 2px 0px #000',
                  transition: 'all 0.1s',
                }}
              >
                {cfg.emoji} {key}
              </button>
            );
          })}
        </div>

        {/* Org count */}
        <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#888', marginBottom: 20 }}>
          {visible.length} organisation{visible.length !== 1 ? 's' : ''}
          {active !== 'All' ? ` in ${active}` : ' across Southeast Asia'}
        </p>

        {/* Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {visible.map((org) => {
            const cfg = COUNTRY_CONFIG[org.country];
            return (
              <div
                key={org.name}
                style={{ background: cfg.bg, border: '2px solid #000', padding: '20px 22px', boxShadow: '4px 4px 0px #000', display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#000', margin: 0 }}>{org.name}</h2>
                      {active === 'All' && (
                        <span style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 11, color: '#555', background: 'rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.15)', padding: '2px 8px' }}>
                          {cfg.emoji} {org.country}
                        </span>
                      )}
                    </div>
                    <span style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 12, color: '#444' }}>{org.tag}</span>
                  </div>
                  <a
                    href={org.donateUrl || org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, border: '2px solid #000', padding: '7px 16px', background: '#000', color: '#fff200', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '2px 2px 0px #666' }}
                  >
                    {org.cta}
                  </a>
                </div>

                {/* Description */}
                <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#111', lineHeight: 1.55, margin: 0 }}>{org.description}</p>

                {/* Impact chip */}
                {org.impact && (
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: '#333', margin: 0 }}>
                    ✦ {org.impact}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 56, paddingTop: 28, borderTop: '2px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <p style={{ fontFamily: 'var(--font-geist, sans-serif)', fontSize: 14, color: '#333', lineHeight: 1.5, maxWidth: 440 }}>
            Know an organisation we're missing?{' '}
            <a href="mailto:hello@aiforgood.my" style={{ color: '#000', fontWeight: 700, textDecoration: 'underline' }}>Let us know</a> and we'll add it.
          </p>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14, border: '2px solid #000', padding: '9px 20px', background: '#fff200', color: '#000', textDecoration: 'none', boxShadow: '3px 3px 0px #000' }}
          >
            ★ Star on GitHub
          </a>
        </div>
      </div>
    </main>
  );
}
