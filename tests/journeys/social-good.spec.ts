import { test, expect } from '@playwright/test';

const BOOKS = [
  {
    id: 'b1', year: 2024, order: 0,
    title: 'The Hate U Give', authors: [{ name: 'Angie Thomas' }],
    pageCount: 444, cover: '', coverProxiedUrl: '', slug: '', source: 'manual',
  },
  {
    id: 'b2', year: 2024, order: 1,
    title: 'Animal Farm', authors: [{ name: 'George Orwell' }],
    pageCount: 112, cover: '', coverProxiedUrl: '', slug: '', source: 'manual',
  },
  {
    id: 'b3', year: 2024, order: 2,
    title: 'The Kite Runner', authors: [{ name: 'Khaled Hosseini' }],
    pageCount: 371, cover: '', coverProxiedUrl: '', slug: '', source: 'manual',
  },
];

async function seedBooks(page: import('@playwright/test').Page, { withPledgeTrigger = false } = {}) {
  await page.evaluate(([books, pledgeTrigger]) => {
    localStorage.setItem('book-poster:books', JSON.stringify(books));
    localStorage.removeItem('book-poster:pledge-dismissed');
    sessionStorage.removeItem('book-poster:literacy-banner-dismissed');
    sessionStorage.removeItem('book-poster:show-banned');
    if (pledgeTrigger) {
      sessionStorage.setItem('book-poster:show-pledge', '1');
    } else {
      sessionStorage.removeItem('book-poster:show-pledge');
    }
  }, [BOOKS, withPledgeTrigger] as const);
}

// ─── Feature 1: Literacy Banner ───────────────────────────────────────────────

test('literacy banner: shows when books exist', async ({ page }) => {
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  await seedBooks(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('literacy-banner')).toBeVisible({ timeout: 6_000 });
});

test('literacy banner: dismiss hides it for the session', async ({ page }) => {
  await page.goto('/library');
  await seedBooks(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('literacy-banner')).toBeVisible({ timeout: 6_000 });
  await page.getByTestId('literacy-banner').getByRole('button', { name: /dismiss/i }).click();
  await expect(page.getByTestId('literacy-banner')).not.toBeVisible();
});

test('literacy banner: has Support literacy link', async ({ page }) => {
  await page.goto('/library');
  await seedBooks(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  const banner = page.getByTestId('literacy-banner');
  await expect(banner).toBeVisible({ timeout: 6_000 });
  await expect(banner.getByRole('link', { name: /support literacy/i })).toBeVisible();
});

// ─── Feature 2: Pledge Modal ──────────────────────────────────────────────────

test('pledge modal: shows when books exist and not dismissed', async ({ page }) => {
  await page.goto('/library');
  await seedBooks(page, { withPledgeTrigger: true });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('pledge-modal')).toBeVisible({ timeout: 6_000 });
});

test('pledge modal: dismiss stores in localStorage and hides modal', async ({ page }) => {
  await page.goto('/library');
  await seedBooks(page, { withPledgeTrigger: true });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('pledge-modal')).toBeVisible({ timeout: 6_000 });
  await page.getByRole('button', { name: /maybe later/i }).click();
  await expect(page.getByTestId('pledge-modal')).not.toBeVisible();
  const dismissed = await page.evaluate(() => localStorage.getItem('book-poster:pledge-dismissed'));
  expect(dismissed).toBe('1');
});

test('pledge modal: does not show when already dismissed', async ({ page }) => {
  await page.goto('/library');
  await seedBooks(page);
  await page.evaluate(() => localStorage.setItem('book-poster:pledge-dismissed', '1'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  // Wait a bit in case it shows briefly
  await page.waitForTimeout(1500);
  await expect(page.getByTestId('pledge-modal')).not.toBeVisible();
});

// ─── Feature 3: World Book Day Frame ─────────────────────────────────────────

test('world book day frame: toggle exists in export panel', async ({ page }) => {
  await page.goto('/library');
  await seedBooks(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /export image/i }).click();
  await expect(page.getByTestId('export-panel')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByTestId('book-day-frame-toggle')).toBeVisible();
});

test('world book day frame: toggling shows frame text in preview', async ({ page }) => {
  await page.goto('/library');
  await seedBooks(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /export image/i }).click();
  await expect(page.getByTestId('export-panel')).toBeVisible({ timeout: 5_000 });
  await page.getByTestId('book-day-frame-toggle').check();
  await expect(page.getByText(/World Book Day · April 23/i)).toBeVisible();
  await expect(page.getByText(/aiforgood\.my\/bookshelf/i)).toBeVisible();
});

// ─── Feature 4: /give page ────────────────────────────────────────────────────

test('/give page: renders with hero and org cards', async ({ page }) => {
  await page.goto('/give');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('give-page')).toBeVisible();
  await expect(page.getByText(/Give a book\. Change a life\./i)).toBeVisible();
  await expect(page.getByText('BookXcess Malaysia')).toBeVisible();
  await expect(page.getByText('Room to Read')).toBeVisible();
  await expect(page.getByText('Books For Africa')).toBeVisible();
  await expect(page.getByText('Little Free Library')).toBeVisible();
});

test('/give page: donate links are present', async ({ page }) => {
  await page.goto('/give');
  await page.waitForLoadState('networkidle');
  const donateLinks = page.getByRole('link', { name: /donate →/i });
  await expect(donateLinks.first()).toBeVisible();
  expect(await donateLinks.count()).toBeGreaterThanOrEqual(5);
});

test('library nav: has Give books link to /give', async ({ page }) => {
  await page.goto('/library');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('link', { name: /give books/i }).first()).toBeVisible({ timeout: 5_000 });
});

// ─── Feature 5: /impact page ──────────────────────────────────────────────────

test('/impact page: renders with mission content', async ({ page }) => {
  await page.goto('/impact');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('impact-page')).toBeVisible();
  await expect(page.getByText(/Books are for everyone\./i)).toBeVisible();
  await expect(page.getByText('773M')).toBeVisible();
  await expect(page.getByText(/open source/i)).toBeVisible();
  await expect(page.getByText(/aiforgood\.my/i)).toBeVisible();
});

test('/impact page: how it works section present', async ({ page }) => {
  await page.goto('/impact');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(/How it works/i)).toBeVisible();
  await expect(page.getByText(/Import your books/i)).toBeVisible();
  await expect(page.getByText(/Share & inspire/i)).toBeVisible();
});

// ─── Feature 6: Banned Books Mode ─────────────────────────────────────────────

test('banned books: toggle exists in library toolbar', async ({ page }) => {
  await page.goto('/library');
  await seedBooks(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('banned-books-toggle')).toBeVisible({ timeout: 5_000 });
});

test('banned books: enabling shows banner with challenged count', async ({ page }) => {
  await page.goto('/library');
  await seedBooks(page);
  await page.reload();
  await page.waitForLoadState('networkidle');
  // Dismiss pledge modal first so it doesn't block
  await page.evaluate(() => localStorage.setItem('book-poster:pledge-dismissed', '1'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByTestId('banned-books-toggle').check();
  await expect(page.getByTestId('banned-books-banner')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText(/act of freedom/i)).toBeVisible();
});

test('banned books: banner has Learn more link', async ({ page }) => {
  await page.goto('/library');
  await seedBooks(page);
  await page.evaluate(() => localStorage.setItem('book-poster:pledge-dismissed', '1'));
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByTestId('banned-books-toggle').check();
  await expect(page.getByTestId('banned-books-banner')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('link', { name: /learn more/i })).toBeVisible();
});
