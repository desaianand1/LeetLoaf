import { mount } from 'svelte';
import App from '@/popup/App.svelte';
import type { SyncStatus, AppProps } from '@/popup/App.svelte';

const target = document.getElementById('app');
if (!target) {
	throw new Error('Could not find app element');
}

const syncState: AppProps = {
	sync: false,
	setSyncStatus: async (status: SyncStatus) => {
		try {
			await chrome.storage.local.set({ syncStatus: status });
		} catch (err) {
			console.error('Failed to update sync status:', err);
		}
	}
};

mount(App, {
	target,
	props: syncState
});
