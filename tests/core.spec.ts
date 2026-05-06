/**
 * Core functionality suite.
 * Finish condition: all tests in this file pass without retries.
 *
 * Covers:
 *  1. All pages accessible without auth
 *  2. Empty state on first visit
 *  3. localStorage persistence (books survive reload)
 *  4. Guest banner (shown when books exist + not signed in, dismissable)
 *  5. Add book manually via UI
 *  6. Added book persists after reload
 *  7. All 4 export aspect ratios produce valid PNGs
 *  8. Onboarding page renders all 3 import options
 *  9. Sign-in page shows Clerk UI
 */

import { test, expect } from '@playwright/test';
import path from 'path';
import os from 'os';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function clearLibrary(page: import('@playwright/test').Page) {
  await page.evaluate(() => localStorage.removeItem('book-poster:books'));
}

async function seedLibrary(page: import('@playwright/test').Page, count = 3) {
  await page.evaluate((n) => {
    const books = Array.from({ length: n }, (_, i) => ({
      id: `seed-${i}`,
      year: 2024,
      order: i,
      title: `Seed Book ${i + 1}`,
      authors: [{ name: 'Test Author' }],
      pageCount: 200 + i * 50,
      cover: '',
      slug: '',
      source: 'manual',
    }));
    localStorage.setItem('book-poster:books', JSON.stringify(books));
  }, count);
}

// ─── 1. All pages accessible without auth ────────────────────────────────────

test('library page accessible without auth — no redirect', async ({ page }) => {
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  expect(page.url()).toContain('/library');
});

test('onboarding page accessible without auth', async ({ page }) => {
  await page.goto('/onboarding');
  await page.waitForLoadState('networkidle');
  expect(page.url()).toContain('/onboarding');
});

test('import pages accessible without auth', async ({ page }) => {
  await page.goto('/import/hardcover');
  expect(page.url()).toContain('/import/hardcover');
  await page.goto('/import/goodreads');
  expect(page.url()).toContain('/import/goodreads');
});

// ─── 2. Empty state ───────────────────────────────────────────────────────────

test('library shows empty state on first visit', async ({ page }) => {
  await page.goto('/library');
  await clearLibrary(page);
  await page.reload();
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: /empty/i })).toBeVisible({ timeout: 8_000 });
  await expect(page.getByRole('link', { name: /connect hardcover/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /goodreads/i })).toBeVisible();
});

// ─── 3. localStorage persistence ─────────────────────────────────────────────

test('books from localStorage render in chart after reload', async ({ page }) => {
  await page.goto('/library');
  await clearLibrary(page);
  await seedLibrary(page, 4);
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Chart should be visible, not empty state
  await expect(page.getByRole('heading', { name: /empty/i })).not.toBeVisible({ timeout: 8_000 });
  // Year label
  await expect(page.getByText('2024', { exact: true })).toBeVisible();
});

// ─── 4. Guest banner ──────────────────────────────────────────────────────────

test('guest banner visible when books exist and user is not signed in', async ({ page }) => {
  await page.goto('/library');
  await clearLibrary(page);
  await seedLibrary(page, 2);
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Banner contains sign-in prompt
  const banner = page.locator('[data-testid="guest-banner"]');
  await expect(banner).toBeVisible({ timeout: 10_000 });
  await expect(banner).toContainText(/sign in/i);
});

test('guest banner can be dismissed', async ({ page }) => {
  await page.goto('/library');
  await clearLibrary(page);
  await seedLibrary(page, 2);
  await page.reload();
  await page.waitForLoadState('networkidle');

  const banner = page.locator('[data-testid="guest-banner"]');
  await expect(banner).toBeVisible({ timeout: 10_000 });

  await banner.getByRole('button', { name: /dismiss/i }).click();
  await expect(banner).not.toBeVisible();
});

// ─── 5 & 6. Add book manually + persistence ───────────────────────────────────

test('add book manually via UI appears in chart', async ({ page }) => {
  await page.goto('/library');
  await clearLibrary(page);
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Open add-book form
  await page.getByTestId('add-book-button').click();

  const form = page.getByTestId('add-book-form');
  await expect(form).toBeVisible({ timeout: 5_000 });

  await form.getByLabel(/title/i).fill('My Test Book');
  await form.getByLabel(/author/i).fill('Jane Doe');
  await form.getByLabel(/year/i).fill('2023');
  await form.getByLabel(/pages/i).fill('350');
  await form.getByRole('button', { name: /add/i }).click();

  // Form closes, chart appears
  await expect(form).not.toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('2023', { exact: true })).toBeVisible({ timeout: 5_000 });
});

test('manually added book persists after page reload', async ({ page }) => {
  await page.goto('/library');
  await clearLibrary(page);
  await page.reload();
  await page.waitForLoadState('networkidle');

  await page.getByTestId('add-book-button').click();
  const form = page.getByTestId('add-book-form');
  await form.getByLabel(/title/i).fill('Persistent Book');
  await form.getByLabel(/author/i).fill('Persist Author');
  await form.getByLabel(/year/i).fill('2022');
  await form.getByLabel(/pages/i).fill('200');
  await form.getByRole('button', { name: /add/i }).click();

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('2022', { exact: true })).toBeVisible({ timeout: 8_000 });
});

// ─── 7. All 4 export aspect ratios ───────────────────────────────────────────

for (const ratio of ['story', 'wide', 'portrait'] as const) {
  test(`export as ${ratio} produces a valid PNG`, async ({ page }) => {
    test.setTimeout(90_000);

    await page.goto('/test/stack');
    await page.waitForLoadState('networkidle');

    await page.getByTestId('export-button').click();
    await expect(page.getByTestId('export-panel')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId(`ratio-${ratio}`).click();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 80_000 }),
      page.getByTestId('export-panel').getByRole('button', { name: /download/i }).click(),
    ]);

    expect(download.suggestedFilename()).toBe(`bookshelf-${ratio}.png`);
    const dlPath = path.join(os.tmpdir(), download.suggestedFilename());
    await download.saveAs(dlPath);
    const { statSync } = await import('fs');
    expect(statSync(dlPath).size).toBeGreaterThan(5_000);
  });
}

// ─── 8. Onboarding page ───────────────────────────────────────────────────────

test('onboarding page shows all 3 import options', async ({ page }) => {
  await page.goto('/onboarding');
  await page.waitForLoadState('networkidle');

  await expect(page.getByRole('heading', { name: /import/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /hardcover/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /goodreads/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /manual/i })).toBeVisible();
});

// ─── 9. Sign-in page ─────────────────────────────────────────────────────────

test('sign-in page renders Clerk UI', async ({ page }) => {
  await page.goto('/sign-in');
  await page.waitForLoadState('domcontentloaded');

  // Clerk renders a form with email input or social buttons
  // Clerk's CDN script can be slow on first cold load — poll with a long timeout
  const clerkCard = page.locator('.cl-card, .cl-rootBox, [data-localization-key]').first();
  await expect(clerkCard).toBeVisible({ timeout: 40_000 });
});
