import type { Shelf } from './types';

export const FIXTURE_SHELVES: Shelf[] = [
  {
    title: '2024',
    books: [
      { id: '1', title: 'The Creative Act', cover: 'https://covers.openlibrary.org/b/isbn/9780593652886-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9780593652886-L.jpg'), pageCount: 368, slug: '', authors: [{ name: 'Rick Rubin' }] },
      { id: '2', title: 'Atomic Habits', cover: 'https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg'), pageCount: 320, slug: '', authors: [{ name: 'James Clear' }] },
      { id: '3', title: 'Thinking, Fast and Slow', cover: 'https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9780374533557-L.jpg'), pageCount: 499, slug: '', authors: [{ name: 'Daniel Kahneman' }] },
      { id: '4', title: 'The Power of Now', cover: 'https://covers.openlibrary.org/b/isbn/9781577314806-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9781577314806-L.jpg'), pageCount: 236, slug: '', authors: [{ name: 'Eckhart Tolle' }] },
      { id: '5', title: 'Dune', cover: 'https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg'), pageCount: 896, slug: '', authors: [{ name: 'Frank Herbert' }] },
      { id: '6', title: 'Zero to One', cover: 'https://covers.openlibrary.org/b/isbn/9780804139021-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9780804139021-L.jpg'), pageCount: 224, slug: '', authors: [{ name: 'Peter Thiel' }] },
    ],
  },
  {
    title: '2023',
    books: [
      { id: '7', title: 'The Lean Startup', cover: 'https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9780307887894-L.jpg'), pageCount: 336, slug: '', authors: [{ name: 'Eric Ries' }] },
      { id: '8', title: 'Sapiens', cover: 'https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg'), pageCount: 464, slug: '', authors: [{ name: 'Yuval Noah Harari' }] },
      { id: '9', title: 'Meditations', cover: 'https://covers.openlibrary.org/b/isbn/9780812968255-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9780812968255-L.jpg'), pageCount: 254, slug: '', authors: [{ name: 'Marcus Aurelius' }] },
      { id: '10', title: 'Deep Work', cover: 'https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9781455586691-L.jpg'), pageCount: 296, slug: '', authors: [{ name: 'Cal Newport' }] },
    ],
  },
  {
    title: '2022',
    books: [
      { id: '11', title: 'The Pragmatic Programmer', cover: 'https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9780135957059-L.jpg'), pageCount: 352, slug: '', authors: [{ name: 'David Thomas' }] },
      { id: '12', title: 'Man\'s Search for Meaning', cover: 'https://covers.openlibrary.org/b/isbn/9780807014271-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9780807014271-L.jpg'), pageCount: 165, slug: '', authors: [{ name: 'Viktor Frankl' }] },
      { id: '13', title: 'The Innovator\'s Dilemma', cover: 'https://covers.openlibrary.org/b/isbn/9780062060242-L.jpg', coverProxiedUrl: '/api/cover?src=' + encodeURIComponent('https://covers.openlibrary.org/b/isbn/9780062060242-L.jpg'), pageCount: 288, slug: '', authors: [{ name: 'Clayton Christensen' }] },
    ],
  },
];
