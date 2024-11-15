<script lang="ts">
	import { onMount } from 'svelte';
	import Browser from 'webextension-polyfill';
	import * as Card from '@/components/ui/card';
	import * as Alert from '@/components/ui/alert';
	import * as Button from '@/components/ui/button';
	import AlertCircle from '~icons/lucide/circle-alert';
	import GithubIcon from '~icons/simple-icons/github';
	import { setupRepository, getRepositoryConfig } from '@/api/github/repository';
	import type { RepositoryConfig } from '@/api/github/repository';

	interface AuthState {
		isAuthenticated: boolean;
		username: string | null;
		token: string | null;
	}

	let authState = $state<AuthState>({
		isAuthenticated: false,
		username: null,
		token: null
	});
	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let repositoryConfig = $state<RepositoryConfig | null>(null);
	interface AuthState {
		isAuthenticated: boolean;
		username: string | null;
		token: string | null;
	}

	onMount(async () => {
		try {
			// Load auth state
			const stored = await Browser.storage.local.get('githubAuth');
			if (stored.githubAuth) {
				authState = stored.githubAuth;

				// If authenticated, get repository config
				if (authState.isAuthenticated) {
					repositoryConfig = await getRepositoryConfig();

					// If no repository config exists, set it up
					if (!repositoryConfig && authState.username) {
						repositoryConfig = await setupRepository(authState.username);
					}
				}
			}
		} catch (err) {
			console.error('Failed to load state:', err);
		}
	});

	async function handleGitHubAuth() {
		if (isLoading) return;
		isLoading = true;
		error = null;

		try {
			// This client ID would be specific to our extension
			const clientId = 'YOUR_EXTENSION_CLIENT_ID';
			const redirectUrl = Browser.runtime.getURL('popup/oauth.html');

			const authUrl = new URL('https://github.com/login/oauth/authorize');
			authUrl.searchParams.set('client_id', clientId);
			authUrl.searchParams.set('redirect_uri', redirectUrl);
			// Only request the scopes we need
			authUrl.searchParams.set('scope', 'repo');
			// Request the token be returned in the redirect URL
			authUrl.searchParams.set('response_type', 'token');

			const width = 800;
			const height = 600;
			const left = window.screenX + (window.outerWidth - width) / 2;
			const top = window.screenY + (window.outerHeight - height) / 2;

			const authWindow = await Browser.windows.create({
				url: authUrl.toString(),
				type: 'popup',
				width,
				height,
				left: Math.floor(left),
				top: Math.floor(top)
			});

			// Listen for the OAuth callback
			Browser.tabs.onUpdated.addListener(async function handleRedirect(tabId, changeInfo) {
				if (authWindow.tabs?.[0].id === tabId && changeInfo.url?.startsWith(redirectUrl)) {
					// Clean up
					Browser.tabs.onUpdated.removeListener(handleRedirect);
					await Browser.windows.remove(authWindow.id!);

					const url = new URL(changeInfo.url);
					// The access token will be in the URL fragment
					const token = new URLSearchParams(url.hash.substring(1)).get('access_token');

					if (!token) {
						throw new Error('No access token received');
					}

					// Verify the token and get user info
					const userResponse = await fetch('https://api.github.com/user', {
						headers: {
							Authorization: `Bearer ${token}`
						}
					});

					if (!userResponse.ok) {
						throw new Error('Failed to get user info');
					}

					const userData = await userResponse.json();

					// Update and persist auth state
					const newAuthState = {
						isAuthenticated: true,
						username: userData.login,
						token
					};

					await Browser.storage.local.set({ githubAuth: newAuthState });
					authState = newAuthState;
				}
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to authenticate with GitHub';
		} finally {
			isLoading = false;
		}
	}

	// Function to test the stored token
	async function verifyGitHubAuth(token: string): Promise<boolean> {
		try {
			const response = await fetch('https://api.github.com/user', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			return response.ok;
		} catch {
			return false;
		}
	}

	$effect(() => {
		if (authState.isAuthenticated && authState.username && !repositoryConfig) {
			setupRepository(authState.username).then((config) => {
				if (config) {
					repositoryConfig = config;
				}
			});
		}
	});
</script>

<main class="w-96 p-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Leet Loaf 🍞</Card.Title>
			<Card.Description>Sync your LeetCode solutions to GitHub</Card.Description>
		</Card.Header>

		<Card.Content>
			{#if authState.isAuthenticated}
				<div class="space-y-4">
					<div class="flex items-center space-x-2">
						<GithubIcon class="h-4 w-4" />
						<span class="text-sm">Connected as {authState.username}</span>
					</div>

					{#if repositoryConfig}
						<div class="text-sm">
							<p>Repository: {repositoryConfig.owner}/{repositoryConfig.name}</p>
						</div>
					{:else}
						<div class="text-sm">
							<p>Setting up repository...</p>
						</div>
					{/if}
				</div>
			{:else}
				<Button.Root
					class="w-full"
					variant="outline"
					onclick={handleGitHubAuth}
					disabled={isLoading}
				>
					<GithubIcon class="mr-2 h-4 w-4" />
					Connect GitHub Account
				</Button.Root>
			{/if}

			{#if error}
				<Alert.Root variant="destructive" class="mt-4">
					<AlertCircle class="h-4 w-4" />
					<Alert.Description>{error}</Alert.Description>
				</Alert.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</main>
