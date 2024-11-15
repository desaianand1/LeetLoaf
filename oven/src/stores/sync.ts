interface SyncState {
	isSyncing: boolean;
	lastSync: number | null;
	error: string | null;
}

let syncState = $state<SyncState>({
	isSyncing: false,
	lastSync: null as number | null,
	error: null
});

export function setSyncStatus(status: Pick<SyncState, 'lastSync'>) {
	syncState.lastSync = status.lastSync ?? syncState.lastSync;
	chrome.storage.local.set({ syncStatus: syncState });
}

export function setSyncActive(active: boolean) {
	syncState.isActive = active;
	chrome.storage.local.set({ syncStatus: syncState });
}

// Initialize from storage
chrome.storage.local.get('syncStatus').then((result) => {
	if (result.syncStatus) {
		syncState = result.syncStatus;
	}
});

export { syncState };
