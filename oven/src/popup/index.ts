import { mount } from 'svelte';
import App from '@/popup/App.svelte';

const target = document.getElementById('app');
if (!target) {
	throw new Error('Could not find app element');
}

mount(App, { target });
