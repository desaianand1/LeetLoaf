import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import Icons from 'unplugin-icons/vite';
import webExtension from 'vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
	plugins: [
		svelte(),
		Icons({
			compiler: 'svelte'
		}),
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
				],
				icons: {
					'16': 'static/icons/icon16.png',
					'32': 'static/icons/icon32.png',
					'48': 'static/icons/icon48.png',
					'128': 'static/icons/icon128.png'
				}
			})
		})
	],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
			'@/components': path.resolve(__dirname, 'src/components'),
			'@/utils': path.resolve(__dirname, 'src/utils'),
			'@/api': path.resolve(__dirname, 'src/api'),
			'@/popup': path.resolve(__dirname, 'src/popup'),
			'@/background': path.resolve(__dirname, 'src/background'),
			'@/content': path.resolve(__dirname, 'src/content')
		}
	}
});
