<script lang="ts">
	import * as Card from '@/components/ui/card';
	import * as Alert from '@/components/ui/alert';
	import * as Button from '@/components/ui/button';
	import RepoSetupDialog from '@/components/RepoSetupDialog.svelte';
	import SyncStatus from '@/components/SyncStatus.svelte';
	import AnalyticsView from '@/components/Analytics.svelte';
	import GithubIcon from '~icons/simple-icons/github';
	import LeetCodeIcon from '~icons/simple-icons/leetcode';
	import { appStore } from '@/stores/app';
	import { handleError } from '@/utils/error';

	let showRepoDialog = $state(false);

	async function handleGitHubAuth() {
		try {
			await appStore.authenticateGitHub();
			showRepoDialog = await appStore.checkExistingRepository();
		} catch (err) {
			appStore.error = handleError(err);
		}
	}

	async function handleLeetCodeAuth() {
		try {
			await appStore.authenticateLeetCode();
		} catch (err) {
			appStore.error = handleError(err);
		}
	}

	async function handleRepoDecision(useExisting: boolean) {
		try {
			await appStore.handleRepositorySetup(useExisting);
			showRepoDialog = false;
		} catch (err) {
			appStore.error = handleError(err);
		}
	}
</script>

<main class="w-96 space-y-4 p-4">
	<Card.Root>
		<Card.Header>
			<Card.Title>Leet Loaf 🍞</Card.Title>
			<Card.Description>Sync your LeetCode solutions to GitHub</Card.Description>
		</Card.Header>

		<Card.Content class="space-y-6">
			<!-- GitHub Section -->
			<div class="space-y-2">
				<h3 class="text-sm font-medium">GitHub Connection</h3>
				{#if appStore.github.isAuthenticated}
					<div class="flex items-center justify-between rounded-md border p-2">
						<div class="flex items-center gap-2">
							<GithubIcon class="h-4 w-4" />
							<span class="text-sm">{appStore.github.username}</span>
						</div>
						{#if appStore.repository}
							<span class="text-muted-foreground text-xs">
								{appStore.repository.name}
							</span>
						{/if}
					</div>
				{:else}
					<Button.Root
						class="w-full"
						variant="outline"
						onclick={handleGitHubAuth}
						disabled={appStore.isLoading}
					>
						<GithubIcon class="mr-2 h-4 w-4" />
						Connect GitHub Account
					</Button.Root>
				{/if}
			</div>

			<!-- LeetCode Section -->
			<div class="space-y-2">
				<h3 class="text-sm font-medium">LeetCode Connection</h3>
				{#if appStore.leetcode.isAuthenticated}
					<div class="flex items-center justify-between rounded-md border p-2">
						<div class="flex items-center gap-2">
							<LeetCodeIcon class="h-4 w-4" />
							<span class="text-sm">{appStore.leetcode.username}</span>
						</div>
					</div>
				{:else}
					<Button.Root
						class="w-full"
						variant="outline"
						onclick={handleLeetCodeAuth}
						disabled={!appStore.canConnectLeetCode}
					>
						<LeetCodeIcon class="mr-2 h-4 w-4" />
						Connect LeetCode Account
					</Button.Root>
				{/if}
			</div>

			{#if appStore.error}
				<Alert.Root variant="destructive">
					<Alert.Description>{appStore.error}</Alert.Description>
				</Alert.Root>
			{/if}

			<!-- Sync Status and Analytics -->
			{#if appStore.isFullyAuthenticated}
				<div class="border-t pt-4">
					<SyncStatus />
				</div>
				<div class="border-t pt-4">
					<AnalyticsView />
				</div>
			{/if}
		</Card.Content>
	</Card.Root>
</main>

{#if showRepoDialog}
	<RepoSetupDialog existingRepo={appStore.repository} onDecision={handleRepoDecision} />
{/if}
