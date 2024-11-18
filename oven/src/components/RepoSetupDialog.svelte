<script lang="ts">
    import * as Dialog from '@/components/ui/dialog';
    import * as Button from '@/components/ui/button';
    import type { RepositoryConfig } from '@/api/github/repository';
    
    interface Props {
      existingRepo: RepositoryConfig | null;
      onDecision: (useExisting: boolean) => void;
    }
    
    let { existingRepo, onDecision } = $props<Props>();
    let open = $state(true);
  
    function handleClose() {
      open = false;
    }
  </script>
  
  <Dialog.Root {open} onOpenChange={handleClose}>
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>Repository Setup</Dialog.Title>
        <Dialog.Description>
          {#if existingRepo}
            A Leet Loaf 🍞 repository already exists ({existingRepo.name}). 
            Would you like to use it or create a new one?
          {:else}
            Create a new repository for your LeetCode solutions?
          {/if}
        </Dialog.Description>
      </Dialog.Header>
      
      <Dialog.Footer>
        <div class="flex justify-end space-x-2">
          {#if existingRepo}
            <Button.Root 
              variant="secondary" 
              onclick={() => {
                onDecision(true);
                handleClose();
              }}
            >
              Use Existing
            </Button.Root>
          {/if}
          <Button.Root
            onclick={() => {
              onDecision(false);
              handleClose();
            }}
          >
            Create New
          </Button.Root>
        </div>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>