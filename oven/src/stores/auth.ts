import { type Signal, signal } from 'svelte';
import Browser from 'webextension-polyfill';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  username: string | null;
}

function createAuthStore() {
  const state = signal<AuthState>({
    isAuthenticated: false,
    token: null,
    username: null
  });

  async function checkAuth() {
    const { token, username } = await Browser.storage.local.get(['token', 'username']);
    if (token && username) {
      state.set({ isAuthenticated: true, token, username });
      return true;
    }
    return false;
  }

  async function authenticate() {
    const clientId = 'YOUR_GITHUB_CLIENT_ID';
    const redirectUri = Browser.runtime.getURL('popup/index.html');
    const scope = 'repo';
    
    const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
    
    const response = await Browser.runtime.sendMessage({
      type: 'GITHUB_AUTH',
      payload: { authUrl }
    });

    if (response.error) {
      throw new Error(response.error);
    }

    const { token, username } = response;
    await Browser.storage.local.set({ token, username });
    state.set({ isAuthenticated: true, token, username });
  }

  async function logout() {
    await Browser.storage.local.remove(['token', 'username']);
    state.set({ isAuthenticated: false, token: null, username: null });
  }

  return {
    subscribe: state.subscribe,
    authenticate,
    checkAuth,
    logout
  };
}

export const authStore = createAuthStore();