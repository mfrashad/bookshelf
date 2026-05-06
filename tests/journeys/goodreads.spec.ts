import { test, expect } from '@playwright/test';

test('goodreads import: page has file input and import button', async ({ page }) => {
  await page.goto('/import/goodreads');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#goodreads-csv-input')).toBeVisible();
  await expect(page.getByRole('button', { name: /import books/i })).toBeVisible();
});

test('goodreads import: uploading real CSV imports books and redirects to /library', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/import/goodreads');
  await page.waitForLoadState('networkidle');

  // Clear existing books
  await page.evaluate(() => localStorage.removeItem('book-poster:books'));

  await page.setInputFiles('#goodreads-csv-input', '/Users/rashad/Downloads/goodreads_library_export.csv');
  await page.getByRole('button', { name: /import books/i }).click();

  // Cover fetching can take a while — wait up to 90s
  await expect(page.getByText(/imported \d+ books/i)).toBeVisible({ timeout: 90_000 });

  await page.waitForURL('**/library', { timeout: 10_000 });
  await page.waitForLoadState('networkidle');

  // Library should show at least one year label
  const yearLabel = page.locator('span.font-bold').filter({ hasText: /^20\d\d$/ });
  await expect(yearLabel.first()).toBeVisible({ timeout: 8_000 });
});

test('goodreads import: books get cover images from multiple sources', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/import/goodreads');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.removeItem('book-poster:books'));

  await page.setInputFiles('#goodreads-csv-input', '/Users/rashad/Downloads/goodreads_library_export.csv');
  await page.getByRole('button', { name: /import books/i }).click();

  // Cover fetching progress bar should appear
  await expect(page.getByText(/fetching book covers/i)).toBeVisible({ timeout: 8_000 });

  // Wait for import to complete (cover fetching can take a while for many books)
  await expect(page.getByText(/imported \d+ books/i)).toBeVisible({ timeout: 90_000 });

  // Most imported books should have a cover from any of our sources:
  // Goodreads (gr-assets.com), Open Library (openlibrary.org), or Google Books
  const coverRatio = await page.evaluate(() => {
    const raw = localStorage.getItem('book-poster:books');
    const books: any[] = raw ? JSON.parse(raw) : [];
    const withCover = books.filter(
      (b) => typeof b.coverProxiedUrl === 'string' && b.coverProxiedUrl.startsWith('/api/cover'),
    ).length;
    return books.length > 0 ? withCover / books.length : 0;
  });
  // Expect at least 70% of books to have a cover from some source
  expect(coverRatio).toBeGreaterThan(0.7);
});
