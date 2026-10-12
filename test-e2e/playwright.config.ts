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
      timeout: 15000,
      retries: 2,
    },
  ],
  webServer: [
    {
      command: 'cd ../mocks && vite --port 6173 -c ./vite.config.ts',
      port: 6173,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../mocks && vite --port 6174 -c ./vite.react.config.ts',
      port: 6174,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../mocks && vite --port 6175 -c ./vite.preact.config.ts',
      port: 6175,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../mocks && vite --port 6176 -c ./vite.solid.config.ts',
      port: 6176,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../mocks && vite --port 6177 -c ./vite.vue.config.ts',
      port: 6177,
      reuseExistingServer: !process.env.CI,
    },
  ],
})
