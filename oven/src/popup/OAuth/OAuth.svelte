<script lang="ts">
	import { onMount } from 'svelte';
	import * as Card from '@/components/ui/card';
	import * as Progress from '@/components/ui/progress';
	import * as Alert from '@/components/ui/alert';
	import * as Button from '@/components/ui/button';
	import CheckIcon from '~icons/lucide/check-circle';
	import XIcon from '~icons/lucide/x-circle';
	import LoaderIcon from '~icons/lucide/loader-2';
	import GithubIcon from '~icons/simple-icons/github';
	import Browser from 'webextension-polyfill';

	interface OAuth {
		status: 'processing' | 'success' | 'error';
		message: string;
		error?: string;
	}

	let state = $state<OAuth>({
		status: 'processing',
		message: 'Validating authentication...'
	});

	// Specific error handling based on GitHub's error responses
	const ERROR_MESSAGES = {
		access_denied: 'Access was denied. Please try authenticating again.',
		incorrect_client_credentials: 'There was an issue with the application credentials.',
		redirect_uri_mismatch: 'There was a configuration error with the redirect URI.',
		default: 'An unexpected error occurred during authentication.'
	} as const;

	async function handleRetry() {
		window.close();
		// Reopen the popup
		const views = Browser.extension.getViews({ type: 'popup' });
		if (views.length > 0) {
			views[0].location.reload();
		}
	}

	onMount(() => {
		const url = new URL(window.location.href);
		const urlError = url.searchParams.get('error');
		const errorDescription = url.searchParams.get('error_description');
		const token = new URLSearchParams(url.hash.substring(1)).get('access_token');

		if (urlError) {
			state = {
				status: 'error',
				message: ERROR_MESSAGES[urlError as keyof typeof ERROR_MESSAGES] || ERROR_MESSAGES.default,
				error: errorDescription || undefined
			};
			return;
		}

		if (!token) {
			state = {
				status: 'error',
				message: 'No access token received.',
				error: 'The authentication response was missing the required token.'
			};
			return;
		}

		state = {
			status: 'success',
			message: 'Authentication successful!'
		};
	});

	$effect(() => {
		if (state.status === 'success') {
			// Allow time for success animation
			setTimeout(() => {
				window.close();
			}, 2000);
		}
	});

	const statusConfig = {
		processing: {
			icon: LoaderIcon,
			iconClass: 'text-blue-500',
			progressColor: 'bg-blue-500',
			animation: 'animate-spin'
		},
		success: {
			icon: CheckIcon,
			iconClass: 'text-green-500',
			progressColor: 'bg-green-500',
			animation: 'animate-in zoom-in-50 duration-300'
		},
		error: {
			icon: XIcon,
			iconClass: 'text-destructive',
			progressColor: 'bg-destructive',
			animation: 'animate-in zoom-in-50 duration-300'
		}
	};
</script>

<main class="bg-background flex min-h-screen items-center justify-center p-4">
	<Card.Root class="animate-in fade-in-0 slide-in-from-bottom-4 w-[350px] duration-500">
		<Card.Header>
			<Card.Title class="flex items-center justify-center gap-2">
				<GithubIcon class="h-5 w-5" />
				<span>GitHub Authentication</span>
			</Card.Title>
			<Card.Description class="text-center">Leet Loaf 🍞</Card.Description>
		</Card.Header>

		<Card.Content class="space-y-6">
			<div class="flex flex-col items-center space-y-4">
				<div class="bg-muted rounded-full p-3 {statusConfig[state.status].animation}">
					<svelte:component
						this={statusConfig[state.status].icon}
						class="h-8 w-8 {statusConfig[state.status].iconClass}"
					/>
				</div>

				{#if state.status === 'processing'}
					<Progress.Root class="w-full">
						<Progress.Indicator
							class="animate-progress-infinite {statusConfig[state.status].progressColor}"
						/>
					</Progress.Root>
				{:else}
					<Progress.Root class="w-full" value={100}>
						<Progress.Indicator
							class="transition-all duration-500 {statusConfig[state.status].progressColor}"
						/>
					</Progress.Root>
				{/if}

				<p class="text-center text-sm">{state.message}</p>

				{#if state.error}
					<Alert.Root
						variant="destructive"
						class="animate-in fade-in-0 slide-in-from-top-4 duration-500"
					>
						<Alert.Description>
							{state.error}
						</Alert.Description>
					</Alert.Root>
				{/if}

				{#if state.status === 'error'}
					<Button.Root
						variant="outline"
						onclick={handleRetry}
						class="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
					>
						Try Again
					</Button.Root>
				{/if}
			</div>
		</Card.Content>
	</Card.Root>
</main>

<style lang="postcss">
	:global(body) {
		@apply bg-background text-foreground m-0 antialiased;
	}

	@keyframes progress-infinite {
		0% {
			width: 0%;
			opacity: 1;
		}
		50% {
			width: 100%;
			opacity: 0.5;
		}
		100% {
			width: 0%;
			opacity: 1;
		}
	}

	:global(.animate-progress-infinite) {
		animation: progress-infinite 2s ease-in-out infinite;
	}
</style>
