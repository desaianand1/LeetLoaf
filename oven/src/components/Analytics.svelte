<script lang="ts">
	import { onMount } from 'svelte';
	import Browser from 'webextension-polyfill';
	import * as Card from '@/components/ui/card';
	import type { ProblemStats, SubmissionStats } from '@/api/leetcode/analytics';

	let stats = $state<{ problems: ProblemStats; submissions: SubmissionStats } | null>(null);

	async function loadStats() {
		const result = (await Browser.runtime.sendMessage({ type: 'GET_ANALYTICS' })) as {
			problems: ProblemStats;
			submissions: SubmissionStats;
		} | null;
		stats = result;
	}

	onMount(() => {
		loadStats();
	});
</script>

<div class="grid gap-4 sm:grid-cols-2">
	{#if stats}
		<Card.Root>
			<Card.Header>
				<Card.Title>Problem Solving Progress</Card.Title>
			</Card.Header>
			<Card.Content>
				<dl class="space-y-2">
					<div>
						<dt class="text-sm font-medium">Total Solved</dt>
						<dd class="text-2xl font-bold">{stats.problems.solved}</dd>
					</div>
					<div>
						<dt class="text-sm font-medium">By Difficulty</dt>
						<dd class="grid grid-cols-3 gap-2">
							<div class="text-green-500">Easy: {stats.problems.byDifficulty.Easy}</div>
							<div class="text-yellow-500">Medium: {stats.problems.byDifficulty.Medium}</div>
							<div class="text-red-500">Hard: {stats.problems.byDifficulty.Hard}</div>
						</dd>
					</div>
				</dl>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Submission Stats</Card.Title>
			</Card.Header>
			<Card.Content>
				<dl class="space-y-2">
					<div>
						<dt class="text-sm font-medium">Success Rate</dt>
						<dd class="text-2xl font-bold">
							{Math.round(
								(stats.submissions.acceptedSubmissions / stats.submissions.totalSubmissions) * 100
							)}%
						</dd>
					</div>
					<div>
						<dt class="text-sm font-medium">Languages Used</dt>
						<dd class="flex flex-wrap gap-2">
							{#each Object.keys(stats.submissions.averageRuntime) as lang}
								<span class="bg-primary/10 rounded-full px-2 py-1 text-xs">
									{lang}
								</span>
							{/each}
						</dd>
					</div>
				</dl>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
