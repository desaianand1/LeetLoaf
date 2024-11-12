import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
	plugins: [
		svelte(),
		webExtension({
			manifest: () => ({
				manifest_version: 3,
				name: 'Leet Loaf 🍞',
				version: '0.1.0',
				description: 'Sync your LeetCode solutions to GitHub',
				permissions: ['storage', 'identity', 'tabs'],
				host_permissions: ['https://leetcode.com/*', 'https://api.github.com/*'],
				action: {
					default_popup: 'src/popup/index.html'
				},
				background: {
					service_worker: 'src/background/index.ts'
				},
				content_scripts: [
					{
						matches: ['https://leetcode.com/*'],
						js: ['src/content/index.ts']
					}
				]
			})
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib')
		}
	}
});
