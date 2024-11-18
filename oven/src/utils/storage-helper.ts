import Browser from 'webextension-polyfill';
export type StorageKey =
	| 'githubAuth'
	| 'leetcodeAuth'
	| 'repositoryConfig'
	| 'syncErrors'
	| 'syncQueue';

export async function fetchStorage<T>(key: StorageKey): Promise<T | null> {
	const result = await Browser.storage.local.get(key);
	return result[key] as T | null;
}
