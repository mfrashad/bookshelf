import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

async function clearLibrary(page: Page) {
  await page.evaluate(() => localStorage.removeItem('book-poster:books'));
}

async function seedBooks(page: Page, books: { id: string; title: string; year: number; pageCount: number }[]) {
  await page.evaluate((bks) => {
    const stored = bks.map((b, i) => ({
      id: b.id,
      year: b.year,
      order: i,
      title: b.title,
      authors: [{ name: 'Test Author' }],
      pageCount: b.pageCount,
      cover: '',
      slug: '',
      source: 'manual',
    }));
    localStorage.setItem('book-poster:books', JSON.stringify(stored));
  }, books);
}

test('click spine opens book detail panel', async ({ page }) => {
  await page.goto('/library');
  await clearLibrary(page);
  await seedBooks(page, [
    { id: 'a1', title: 'Click Me Book', year: 2024, pageCount: 300 },
  ]);
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Click on a book spine
  const spine = page.locator('[data-testid="book-spine"]').first();
  await expect(spine).toBeVisible({ timeout: 8_000 });
  await spine.click();

  await expect(page.getByTestId('book-detail-panel')).toBeVisible({ timeout: 5_000 });
});

test('edit year via book detail panel moves book to new year', async ({ page }) => {
  await page.goto('/library');
  await clearLibrary(page);
  await seedBooks(page, [
    { id: 'b1', title: 'Year Change Book', year: 2024, pageCount: 250 },
  ]);
  await page.reload();
  await page.waitForLoadState('networkidle');

  await page.locator('[data-testid="book-spine"]').first().click();
  const panel = page.getByTestId('book-detail-panel');
  await expect(panel).toBeVisible({ timeout: 5_000 });

  // Change year to 2022
  await panel.locator('#book-year-read').fill('2022');
  await panel.getByRole('button', { name: /save/i }).click();

  // Panel closes, chart shows 2022
  await expect(panel).not.toBeVisible({ timeout: 3_000 });
  await expect(page.getByText('2022', { exact: true })).toBeVisible({ timeout: 5_000 });
});

test('set star rating via book detail panel', async ({ page }) => {
  await page.goto('/library');
  await clearLibrary(page);
  await seedBooks(page, [
    { id: 'c1', title: 'Rate This Book', year: 2024, pageCount: 180 },
  ]);
  await page.reload();
  await page.waitForLoadState('networkidle');

  await page.locator('[data-testid="book-spine"]').first().click();
  const panel = page.getByTestId('book-detail-panel');
  await expect(panel).toBeVisible({ timeout: 5_000 });

  // Click 3rd star
  await panel.getByRole('button', { name: /rate 3 star/i }).click();
  await panel.getByRole('button', { name: /save/i }).click();

  await expect(panel).not.toBeVisible({ timeout: 3_000 });
});

test('drag book spine from one year column to another', async ({ page }) => {
  await page.goto('/library');
  await clearLibrary(page);
  await seedBooks(page, [
    { id: 'd1', title: 'Drag Me Alpha', year: 2024, pageCount: 300 },
    { id: 'd2', title: 'Drag Me Beta',  year: 2024, pageCount: 200 },
    { id: 'd3', title: 'Stay Here',     year: 2023, pageCount: 150 },
  ]);
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Wait for both year drop zones
  await expect(page.getByTestId('year-drop-zone-2024')).toBeVisible({ timeout: 8_000 });
  await expect(page.getByTestId('year-drop-zone-2023')).toBeVisible({ timeout: 8_000 });

  // Verify initial state: 2024 has 2 books
  await expect(page.getByText('2 books')).toBeVisible();

  // Get the first spine in the 2024 drop zone
  const spine2024 = page.getByTestId('year-drop-zone-2024').locator('[data-testid="book-spine"]').first();
  const zone2023 = page.getByTestId('year-drop-zone-2023');

  const spineBox = await spine2024.boundingBox();
  const zoneBox = await zone2023.boundingBox();

  if (!spineBox || !zoneBox) throw new Error('Could not get bounding boxes');

  const fromX = spineBox.x + spineBox.width / 2;
  const fromY = spineBox.y + spineBox.height / 2;
  const toX = zoneBox.x + zoneBox.width / 2;
  const toY = zoneBox.y + zoneBox.height / 2;

  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  await page.mouse.move(toX, toY, { steps: 15 });
  await page.mouse.up();

  // 2024 should now have 1 book
  await expect(page.getByText('1 book')).toBeVisible({ timeout: 5_000 });
});
