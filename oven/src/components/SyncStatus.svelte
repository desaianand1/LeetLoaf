<script lang="ts">
    import {onMount} from "svelte";
    import * as Progress from '@/components/ui/progress';
    import * as Alert from '@/components/ui/alert';
    import * as Button from '@/components/ui/button';
    import Browser from 'webextension-polyfill';
    import type { SyncError } from '@/api/leetcode/sync-error-recovery';
  
    let syncStats = $state({
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    });
  
    let errors = $state<SyncError[]>([]);
  
    async function loadStatus() {
      const [statusResult, errorsResult] = await Promise.all([
        Browser.runtime.sendMessage({ type: 'GET_SYNC_STATUS' }),
        Browser.runtime.sendMessage({ type: 'GET_ERRORS' })
      ]);
  
      syncStats = statusResult;
      errors = errorsResult;
    }
  
    async function retryError(errorId: string) {
      await Browser.runtime.sendMessage({
        type: 'RETRY_FAILED_SYNC',
        payload: { errorId }
      });
      await loadStatus();
    }
  
    // Refresh status periodically
    onMount(() => {
      loadStatus();
      const interval = setInterval(loadStatus, 5000);
      return () => clearInterval(interval);
    });
  </script>
  
  <div class="space-y-4">
    {#if syncStats.processing > 0 || syncStats.pending > 0}
      <div class="space-y-2">
        <h3 class="text-sm font-medium">Sync Progress</h3>
        <Progress.Root value={(syncStats.completed / (syncStats.completed + syncStats.pending)) * 100}>
          <Progress.Indicator />
        </Progress.Root>
        <p class="text-xs text-muted-foreground">
          {syncStats.completed} completed, {syncStats.pending} pending
        </p>
      </div>
    {/if}
  
    {#if errors.length > 0}
      <div class="space-y-2">
        <h3 class="text-sm font-medium">Sync Errors</h3>
        {#each errors as error}
          <Alert.Root variant="destructive">
            <div class="flex items-center justify-between">
              <Alert.Description>
                Failed to sync problem {error.problemId}: {error.error}
              </Alert.Description>
              {#if error.retryCount < 3}
                <Button.Root 
                  size="sm" 
                  variant="outline" 
                  onclick={() => retryError(error.id)}
                >
                  Retry
                </Button.Root>
              {/if}
            </div>
          </Alert.Root>
        {/each}
      </div>
    {/if}
  </div>