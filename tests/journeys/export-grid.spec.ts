import { test, expect } from '@playwright/test';
import path from 'path';
import os from 'os';

test('export as PNG works in cover grid mode', async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto('/library');

  // Seed books
  await page.evaluate(() => {
    const books = Array.from({ length: 4 }, (_, i) => ({
      id: `exp-${i}`,
      year: 2024,
      order: i,
      title: `Export Book ${i + 1}`,
      authors: [{ name: 'Author' }],
      pageCount: 250,
      cover: '',
      coverProxiedUrl: '',
      slug: '',
      source: 'manual',
    }));
    localStorage.setItem('book-poster:books', JSON.stringify(books));
  });
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Switch to Cover Grid
  await page.getByRole('button', { name: /cover grid/i }).click();
  await expect(page.getByTestId('cover-grid-cell').first()).toBeVisible({ timeout: 8_000 });

  // Open export panel
  await page.getByRole('button', { name: /export image/i }).click();
  const panel = page.getByTestId('export-panel');
  await expect(panel).toBeVisible({ timeout: 5_000 });

  // Select square ratio
  await panel.getByTestId('ratio-square').click();

  // Download
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 30_000 }),
    panel.getByRole('button', { name: /download/i }).click(),
  ]);

  const dlPath = path.join(os.tmpdir(), download.suggestedFilename());
  await download.saveAs(dlPath);
  const { statSync } = await import('fs');
  expect(statSync(dlPath).size).toBeGreaterThan(5_000);
});
