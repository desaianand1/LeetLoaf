import Browser from 'webextension-polyfill';
import { fetchStorage } from '@/utils/storage-helper';

export interface SyncError {
	id: string;
	timestamp: string;
	problemId: string;
	submissionId: string;
	error: string;
	retryCount: number;
	resolved: boolean;
}

export class SyncErrorRecoveryService {
	private static MAX_RETRIES = 3;
	private static RETRY_DELAYS = [5000, 15000, 30000]; // Increasing delays between retries

	async logError(
		error: Omit<SyncError, 'id' | 'timestamp' | 'retryCount' | 'resolved'>
	): Promise<SyncError> {
		const newError: SyncError = {
			...error,
			id: `${error.problemId}-${error.submissionId}-${Date.now()}`,
			timestamp: new Date().toISOString(),
			retryCount: 0,
			resolved: false
		};

		await this.saveError(newError);
		return newError;
	}

	async getUnresolvedErrors(): Promise<SyncError[]> {
		const syncErrors = (await fetchStorage<SyncError[]>('syncErrors')) || [];
		return syncErrors.filter((error: SyncError) => !error.resolved);
	}

	async markResolved(errorId: string): Promise<void> {
		const syncErrors = (await fetchStorage<SyncError[]>('syncErrors')) || [];
		const updatedErrors = syncErrors.map((error: SyncError) =>
			error.id === errorId ? { ...error, resolved: true } : error
		);
		await Browser.storage.local.set({ syncErrors: updatedErrors });
	}

	async updateRetryCount(errorId: string): Promise<void> {
		const syncErrors = (await fetchStorage<SyncError[]>('syncErrors')) || [];
		const updatedErrors = syncErrors.map((error: SyncError) =>
			error.id === errorId ? { ...error, retryCount: error.retryCount + 1 } : error
		);
		await Browser.storage.local.set({ syncErrors: updatedErrors });
	}

	shouldRetry(error: SyncError): boolean {
		return !error.resolved && error.retryCount < SyncErrorRecoveryService.MAX_RETRIES;
	}

	getRetryDelay(retryCount: number): number {
		return (
			SyncErrorRecoveryService.RETRY_DELAYS[retryCount] ||
			SyncErrorRecoveryService.RETRY_DELAYS[SyncErrorRecoveryService.RETRY_DELAYS.length - 1]
		);
	}

	private async saveError(error: SyncError): Promise<void> {
		const syncErrors = (await fetchStorage<SyncError[]>('syncErrors')) || [];
		await Browser.storage.local.set({
			syncErrors: [...syncErrors, error].slice(-100) // Keep last 100 errors
		});
	}
}
