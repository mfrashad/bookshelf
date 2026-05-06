import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  timeout: 60_000,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3456',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev -- -p 3456',
    url: 'http://localhost:3456',
    reuseExistingServer: false,
    timeout: 120_000,
    cwd: '/Users/rashad/Desktop/code/book-poster',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
