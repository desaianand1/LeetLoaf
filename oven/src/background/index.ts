import type Browser from 'webextension-polyfill';
import browser from 'webextension-polyfill';

type MessageType = 'GITHUB_AUTH' | 'SYNC_SOLUTIONS';

interface Message {
	type: MessageType;
	payload?: any;
}

interface AuthResponse {
	token: string;
	username: string;
}

// Helper function to exchange OAuth code for token
async function exchangeCodeForToken(code: string): Promise<AuthResponse> {
	// TODO: Implement your token exchange logic here
	// This should call your backend service that handles the OAuth token exchange
	throw new Error('Token exchange not implemented');
}

async function handleGithubAuth(authUrl: string): Promise<AuthResponse> {
	const authWindow = await browser.windows.create({
		url: authUrl,
		type: 'popup',
		width: 800,
		height: 600
	});

	return new Promise((resolve, reject) => {
		const listener = async (tabId: number, changeInfo: browser.Tabs.OnUpdatedChangeInfoType) => {
			if (
				authWindow.tabs &&
				tabId === authWindow.tabs[0].id &&
				changeInfo.url &&
				changeInfo.url.startsWith(browser.runtime.getURL(''))
			) {
				browser.tabs.onUpdated.removeListener(listener);
				await browser.windows.remove(authWindow.id!);

				const url = new URL(changeInfo.url);
				const code = url.searchParams.get('code');

				if (!code) {
					reject(new Error('No authorization code received'));
					return;
				}

				try {
					const response = await exchangeCodeForToken(code);
					resolve(response);
				} catch (error) {
					reject(error);
				}
			}
		};

		browser.tabs.onUpdated.addListener(listener);
	});
}

async function handleSyncSolutions(): Promise<{ success: boolean }> {
	const { token } = await browser.storage.local.get('token');
	if (!token) {
		throw new Error('Not authenticated');
	}

	// TODO: Implement your solution sync logic here
	// 1. Fetch solutions from LeetCode
	// 2. Process and format solutions
	// 3. Push to GitHub repository

	return { success: true };
}

browser.runtime.onMessage.addListener(
	(
		message: unknown,
		sender: Browser.Runtime.MessageSender,
		sendResponse: (response?: any) => void
	) => {
		if (typeof message === 'object' && message !== null && 'type' in message) {
			const typedMessage = message as Message;

			switch (typedMessage.type) {
				case 'GITHUB_AUTH':
					if (typeof typedMessage.payload?.authUrl === 'string') {
						handleGithubAuth(typedMessage.payload.authUrl)
							.then(sendResponse)
							.catch((error) => sendResponse({ error: error.message }));
						return true; // Indicates that we will send a response asynchronously
					}
					break;
				case 'SYNC_SOLUTIONS':
					handleSyncSolutions()
						.then(sendResponse)
						.catch((error) => sendResponse({ error: error.message }));
					return true; // Indicates that we will send a response asynchronously
			}
		}

		sendResponse({ error: 'Invalid message format' });
		return true; // Indicates that we sent a response synchronously
	}
);
