import { test, expect } from '@playwright/test';
import path from 'path';
import os from 'os';

// ── Test 1: Landing page ─────────────────────────────────────────────────────

test('landing page renders correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Your reading library');
  await expect(page.getByRole('link', { name: /get started/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
});

// ── Test 2: Stack chart renders with fixture data ────────────────────────────

test('BookStackChart renders spine blocks and year labels', async ({ page }) => {
  await page.goto('/test/stack');
  // Wait for the client component to fully hydrate
  await page.waitForLoadState('networkidle');

  await expect(page.getByTestId('page-title')).toContainText('Stack Chart');

  const chart = page.getByTestId('stack-chart-container');
  await expect(chart).toBeVisible();

  for (const year of ['2024', '2023', '2022']) {
    await expect(chart.getByText(year, { exact: true })).toBeVisible();
  }

  // React serialises camelCase style props as kebab-case in the DOM attribute
  const spineCount = await chart.locator('[style*="background-color"]').count();
  expect(spineCount).toBeGreaterThan(10); // fixture has 13 books
});

// ── Test 3: Cover proxy returns a CORS-safe image ────────────────────────────

test('cover proxy returns image with CORS headers', async ({ request }) => {
  const olSrc = 'https://covers.openlibrary.org/b/isbn/9780593652886-L.jpg';
  const resp = await request.get(`/api/cover?src=${encodeURIComponent(olSrc)}`);

  expect(resp.status()).toBe(200);
  expect(resp.headers()['content-type']).toMatch(/^image\//);
  expect(resp.headers()['access-control-allow-origin']).toBe('*');
  expect(resp.headers()['cache-control']).toContain('immutable');
});

// ── Test 4: Export flow — panel opens and download button appears ─────────────

test('export panel opens and download button is present', async ({ page }) => {
  await page.goto('/test/stack');
  // Wait for hydration so button clicks register
  await page.waitForLoadState('networkidle');

  const exportBtn = page.getByTestId('export-button');
  await expect(exportBtn).toBeVisible();
  await exportBtn.click();

  const panel = page.getByTestId('export-panel');
  await expect(panel).toBeVisible({ timeout: 10_000 });

  await expect(page.getByTestId('ratio-square')).toBeVisible();
  await expect(page.getByTestId('ratio-story')).toBeVisible();
  await expect(panel.getByRole('button', { name: /download/i })).toBeVisible();
});

// ── Test 5: Export actually triggers a PNG download ──────────────────────────

test('clicking download triggers a PNG file download', async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto('/test/stack');
  // Wait for full hydration — html-to-image also needs all stylesheets inlined
  await page.waitForLoadState('networkidle');

  await page.getByTestId('export-button').click();
  await expect(page.getByTestId('export-panel')).toBeVisible({ timeout: 10_000 });

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 80_000 }),
    page.getByTestId('export-panel').getByRole('button', { name: /download/i }).click(),
  ]);

  expect(download.suggestedFilename()).toMatch(/bookshelf-square\.png$/);

  const dlPath = path.join(os.tmpdir(), download.suggestedFilename());
  await download.saveAs(dlPath);

  const { statSync } = await import('fs');
  const stat = statSync(dlPath);
  expect(stat.size).toBeGreaterThan(10_000);
});
