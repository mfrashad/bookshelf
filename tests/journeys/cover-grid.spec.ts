import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function seedBooks(page: Page, count: number) {
  await page.evaluate((n) => {
    const books = Array.from({ length: n }, (_, i) => ({
      id: `grid-${i}`,
      year: 2024,
      order: i,
      title: `Grid Book ${i + 1}`,
      authors: [{ name: 'Author' }],
      pageCount: 200 + i * 50,
      cover: '',
      coverProxiedUrl: '',
      slug: '',
      source: 'manual',
    }));
    localStorage.setItem('book-poster:books', JSON.stringify(books));
  }, count);
}

test('cover grid mode shows a cell for each book', async ({ page }) => {
  await page.goto('/library');
  await page.evaluate(() => localStorage.removeItem('book-poster:books'));
  await seedBooks(page, 5);
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Switch to Cover Grid mode
  await page.getByRole('button', { name: /cover grid/i }).click();

  const cells = page.getByTestId('cover-grid-cell');
  await expect(cells).toHaveCount(5, { timeout: 8_000 });
});
