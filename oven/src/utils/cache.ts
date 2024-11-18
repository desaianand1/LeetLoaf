interface CacheEntry<T> {
	value: T;
	timestamp: number;
}

export class InMemoryCache {
	private cache = new Map<string, CacheEntry<unknown>>();
	private ttl: number;

	constructor(ttlMinutes: number = 5) {
		this.ttl = ttlMinutes * 60 * 1000;
	}

	get<T>(key: string): T | null {
		const entry = this.cache.get(key);
		if (!entry) return null;

		const isExpired = Date.now() - entry.timestamp > this.ttl;
		if (isExpired) {
			this.cache.delete(key);
			return null;
		}

		return entry.value as T;
	}

	set<T>(key: string, value: T): void {
		this.cache.set(key, {
			value,
			timestamp: Date.now()
		});
	}

	clear(): void {
		this.cache.clear();
	}
}
