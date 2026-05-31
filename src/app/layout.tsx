import type { Metadata } from 'next';
import { Geist, Plus_Jakarta_Sans, Silkscreen } from 'next/font/google';
import { Providers } from './providers';
import { PostHogProvider } from './PostHogProvider';
import './globals.css';

const geist = Geist({ variable: '--font-geist', subsets: ['latin'] });
const jakarta = Plus_Jakarta_Sans({ variable: '--font-display', subsets: ['latin'], weight: ['400', '600', '700', '800'] });
const silkscreen = Silkscreen({ variable: '--font-pixel', subsets: ['latin'], weight: '400' });

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bookshelf.buildforpublic.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Bookshelf — Your Reading Life, Beautifully Visualized',
    template: '%s | Bookshelf',
  },
  description:
    'Turn your Goodreads or Hardcover library into a beautiful poster. Track your reading, visualize your bookshelf, and share your reading year — free. Built by Fathy Rashad for buildforpublic.com.',
  keywords: [
    'digital bookshelf',
    'digital library',
    'book tracker',
    'reading tracker',
    'reading wrapped',
    'book poster',
    'reading poster generator',
    'goodreads export',
    'hardcover books',
    'reading visualization',
    'bookshelf poster',
    'reading stats',
    'books I read',
    'buildforpublic.com',
    'fathy rashad',
    'world book day',
    'literacy',
  ],
  authors: [{ name: 'Fathy Rashad', url: 'https://rashadcodes.com' }],
  creator: 'Fathy Rashad',
  openGraph: {
    type: 'website',
    url: BASE_URL,
    siteName: 'Bookshelf',
    title: 'Bookshelf — Your Reading Life, Beautifully Visualized',
    description:
      'Turn your Goodreads or Hardcover library into a beautiful poster. Free, open-source, built for readers.',
    images: [
      {
        url: '/preview-grid.png',
        width: 1200,
        height: 630,
        alt: 'Bookshelf — book cover grid visualization',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bookshelf — Your Reading Life, Beautifully Visualized',
    description:
      'Turn your Goodreads or Hardcover library into a beautiful poster. Free and open-source.',
    images: ['/preview-grid.png'],
    creator: '@rashadcodes',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${jakarta.variable} ${silkscreen.variable} h-full`}>
      <body className="min-h-full antialiased" style={{ background: '#ffffff', color: '#000000' }}>
        <PostHogProvider>
          <Providers>{children}</Providers>
        </PostHogProvider>
      </body>
    </html>
  );
}
