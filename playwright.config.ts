import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: {
		command: 'node ./node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4182',
		port: 4182,
		reuseExistingServer: false,
		timeout: 120_000,
		gracefulShutdown: { signal: 'SIGTERM', timeout: 1000 }
	},
	use: {
		baseURL: 'http://127.0.0.1:4182'
	},
	testMatch: '**/*.e2e.{ts,js}'
});
