import { test, expect } from '@playwright/test';

const MOCK_BOOKS = [
  {
    year: 2024,
    title: 'Dune',
    authors: [{ name: 'Frank Herbert' }],
    pageCount: 412,
    cover: '',
    coverProxiedUrl: '',
    slug: 'dune',
    source: 'hardcover',
  },
];

test('hardcover import: page has API key input and submit button', async ({ page }) => {
  await page.goto('/import/hardcover');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#hardcover-api-key')).toBeVisible();
  await expect(page.getByRole('button', { name: /import from hardcover/i })).toBeVisible();
});

test('hardcover import: bad key shows error message', async ({ page }) => {
  await page.route('**/api/import/hardcover**', (route) =>
    route.fulfill({ status: 401, body: JSON.stringify({ error: 'Invalid API key or no books found' }) }),
  );
  await page.goto('/import/hardcover');
  await page.waitForLoadState('networkidle');
  await page.fill('#hardcover-api-key', 'bad-key');
  await page.getByRole('button', { name: /import from hardcover/i }).click();
  await expect(page.getByTestId('hardcover-error')).toBeVisible({ timeout: 10_000 });
});

test('hardcover import: pasting key with "Bearer " prefix still works', async ({ page }) => {
  let receivedKey: string | undefined;
  await page.route('**/api/import/hardcover**', async (route) => {
    const body = JSON.parse(route.request().postData() ?? '{}');
    receivedKey = body.apiKey;
    await route.fulfill({ status: 200, body: JSON.stringify({ books: MOCK_BOOKS }) });
  });

  await page.goto('/import/hardcover');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.removeItem('book-poster:books'));

  await page.fill('#hardcover-api-key', 'Bearer valid-test-key');
  await page.getByRole('button', { name: /import from hardcover/i }).click();

  await page.waitForURL('**/library', { timeout: 15_000 });
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('2024', { exact: true })).toBeVisible({ timeout: 8_000 });
});

test('hardcover import: valid key imports books and redirects to /library', async ({ page }) => {
  await page.route('**/api/import/hardcover**', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify({ books: MOCK_BOOKS }) }),
  );

  await page.goto('/import/hardcover');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => localStorage.removeItem('book-poster:books'));

  await page.fill('#hardcover-api-key', 'valid-test-key');
  await page.getByRole('button', { name: /import from hardcover/i }).click();

  await page.waitForURL('**/library', { timeout: 15_000 });
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('2024', { exact: true })).toBeVisible({ timeout: 8_000 });
});
