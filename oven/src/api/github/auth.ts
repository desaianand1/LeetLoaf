import Browser from 'webextension-polyfill';
import { AuthError } from '@/utils/error';
import type { AuthMessage } from '@/utils/messages';
import { fetchStorage } from '@/utils/storage-helper';

export interface GitHubAuthState {
	isAuthenticated: boolean;
	username: string | null;
	token: string | null;
}

export class GitHubAuthService {
	static readonly STORAGE_KEY = 'githubAuth';
	static readonly AUTH_TIMEOUT = 300000; // 5 minutes

	static async authenticate(): Promise<AuthMessage> {
		const clientId = 'YOUR_GITHUB_CLIENT_ID';
		const redirectUrl = Browser.runtime.getURL('popup/oauth.html');

		const authUrl = new URL('https://github.com/login/oauth/authorize');
		authUrl.searchParams.set('client_id', clientId);
		authUrl.searchParams.set('redirect_uri', redirectUrl);
		authUrl.searchParams.set('scope', 'repo');

		const authWindow = await Browser.windows.create({
			url: authUrl.toString(),
			type: 'popup',
			width: 800,
			height: 600,
			left: Math.floor(window.screenX + (window.outerWidth - 800) / 2),
			top: Math.floor(window.screenY + (window.outerHeight - 600) / 2)
		});

		return new Promise<AuthMessage>((resolve, reject) => {
			const timeout = setTimeout(() => {
				cleanup();
				reject(new AuthError('github', 'Authentication timed out'));
			}, this.AUTH_TIMEOUT);

			function cleanup() {
				clearTimeout(timeout);
				Browser.runtime.onMessage.removeListener(handleAuth);
				Browser.windows.remove(authWindow.id!).catch(() => {});
			}

			function handleAuth(message: AuthMessage) {
				if (message.type === 'GITHUB_AUTH_SUCCESS') {
					cleanup();
					resolve(message);
				} else if (message.type === 'AUTH_ERROR' && message.payload.service === 'github') {
					cleanup();
					reject(new AuthError('github', message.payload.error));
				}
			}


			//




			//--

			Browser.runtime.onMessage.addListener(handleAuth);
		});
	}

	static async getStoredAuth(): Promise<GitHubAuthState | null> {
		return await fetchStorage<GitHubAuthState>(this.STORAGE_KEY);
	}

	static async persist(auth: GitHubAuthState): Promise<void> {
		await Browser.storage.local.set({ [this.STORAGE_KEY]: auth });
	}

	static async clear(): Promise<void> {
		await Browser.storage.local.remove(this.STORAGE_KEY);
	}

	static async verify(token: string): Promise<boolean> {
		try {
			const response = await fetch('https://api.github.com/user', {
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/vnd.github.v3+json'
				}
			});
			return response.ok;
		} catch {
			return false;
		}
	}
	static isAuthMessage(message: unknown): message is AuthMessage {
		return (
			typeof message === 'object' &&
			message !== null &&
			'type' in message &&
			(message.type === 'GITHUB_AUTH_SUCCESS' || message.type === 'AUTH_ERROR')
		);
	}
}





