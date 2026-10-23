import { defineConfig, devices } from '@playwright/test';

// Las pruebas se ejecutan contra el build de producción (`npm run build` primero);
// dev.spec.ts usa además el servidor de desarrollo.
export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  webServer: [
    { command: 'npm run preview', url: 'http://localhost:4173', reuseExistingServer: !process.env.CI },
    { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: !process.env.CI },
  ],
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'movil', use: { ...devices['Pixel 7'] } },
  ],
});
