import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://localhost:6173',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      timeout: 5000,
      retries: 2,
    },
  ],
  webServer: {
    command: 'yarn vite --port 6173 -c ./vite.config.ts',
    port: 6173,
    reuseExistingServer: !process.env.CI,
  },
})
