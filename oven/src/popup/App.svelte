<script module lang="ts">
	export interface SyncStatus {
		lastSync: number | null;
	}

	export interface AppProps {
		sync: boolean;
		setSyncStatus: (status: SyncStatus) => void;
	}
</script>

<script lang="ts">
	import * as Card from '@/components/ui/card';
	import * as Alert from '@/components/ui/alert';
	import * as Button from '@/components/ui/button';

	import AlertCircle from '~icons/lucide/alert-circle';
	import GitHub from '~icons/simple-icons/github';

	let { sync , setSyncStatus }: AppProps = $props();

	let isLoading = $state(false);
	let error = $state<string | null>(null);
	let authState = $state({
		isAuthenticated: false,
		username: null as string | null
	});

	let canSync = $derived(!isLoading && authState.isAuthenticated);
	let lastSyncTime = $state<number | null>(null);

	$effect(() => {
		if (sync) {
			lastSyncTime = Date.now();
			setSyncStatus({ lastSync: lastSyncTime });
		}
	});

	async function handleAuth() {
		if (isLoading) return;

		isLoading = true;
		error = null;

		try {
			const response = await fetch('/api/github/auth', {
				credentials: 'include'
			});

			if (!response.ok) throw new Error('Authentication failed');

			const data = await response.json();
			authState = {
				isAuthenticated: true,
				username: data.username
			};
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to authenticate';
		} finally {
			isLoading = false;
		}
	}

	async function handleSync() {
		if (!canSync) return;

		isLoading = true;
		error = null;

		try {
			const response = await fetch('/api/sync', {
				method: 'POST',
				credentials: 'include'
			});

			if (!response.ok) throw new Error('Sync failed');

			lastSyncTime = Date.now();
			setSyncStatus({ lastSync: lastSyncTime });
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to sync solutions';
		} finally {
			isLoading = false;
		}
	}
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
						<GitHub class="h-4 w-4" />
						<span class="text-sm">Connected as {authState.username}</span>
					</div>
					<Button.Root class="w-full" onclick={handleSync} disabled={!canSync}>
						{#if sync}
							Syncing Solutions...
						{:else}
							Sync Solutions
						{/if}
					</Button.Root>
				</div>
			{:else}
				<Button.Root class="w-full" variant="outline" onclick={handleAuth} disabled={isLoading}>
					<GitHub class="mr-2 h-4 w-4" />
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

		<Card.Footer>
			<p class="text-muted-foreground text-xs">
				Last synced: {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Never'}
			</p>
		</Card.Footer>
	</Card.Root>
</main>
