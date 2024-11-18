import type { RepositoryConfig } from '@/api/github/repository';
import type { ProblemStats, SubmissionStats } from '@/api/leetcode/analytics';
import type { SyncError } from '@/api/leetcode/sync-error-recovery';

export interface AuthSuccess {
	username: string;
	token: string;
}

export interface LeetCodeAuthSuccess {
	username: string;
	csrfToken: string;
	cookies: string;
}

export interface SyncStats {
	pending: number;
	processing: number;
	completed: number;
	failed: number;
}

// Messages sent TO the background script
export type ToBackgroundMessage =
	| { type: 'NEW_SUBMISSION'; payload: { problemId: string; submissionId: string } }
	| { type: 'GET_SYNC_STATUS' }
	| { type: 'GET_ANALYTICS' }
	| { type: 'GET_ERRORS' }
	| { type: 'RETRY_FAILED_SYNC'; payload: { errorId: string } }
	| { type: 'CHECK_EXISTING_REPO'; payload: { username: string } }
	| { type: 'CREATE_REPOSITORY'; payload: { username: string } }
	| { type: 'USE_EXISTING_REPOSITORY'; payload: { username: string } };

// Messages sent FROM the background script
export type FromBackgroundMessage =
	| { type: 'SYNC_STATUS'; payload: SyncStats }
	| { type: 'ANALYTICS_DATA'; payload: { problems: ProblemStats; submissions: SubmissionStats } }
	| { type: 'SYNC_ERRORS'; payload: SyncError[] }
	| { type: 'REPO_EXISTS'; payload: { exists: boolean; repository?: RepositoryConfig } }
	| { type: 'REPO_CREATED'; payload: { repository: RepositoryConfig } };

// Auth-related messages
export type AuthMessage =
	| { type: 'GITHUB_AUTH_SUCCESS'; payload: AuthSuccess }
	| { type: 'LEETCODE_AUTH_SUCCESS'; payload: LeetCodeAuthSuccess }
	| { type: 'AUTH_ERROR'; payload: { service: 'github' | 'leetcode'; error: string } };
