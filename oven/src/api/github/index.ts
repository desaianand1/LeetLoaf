import Browser from 'webextension-polyfill';
import { fetchStorage } from '@/utils/storage-helper';
import type { GitHubAuthState } from '@/api/github/auth';

export interface GitHubError extends Error {
	status?: number;
	response?: Response;
}

export interface Repository {
	name: string;
	full_name: string;
	html_url: string;
	default_branch: string;
}

export class GitHubAPI {
	private token: string;
	private baseUrl = 'https://api.github.com';

	constructor(token: string) {
		this.token = token;
	}

	private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			...options,
			headers: {
				Accept: 'application/vnd.github.v3+json',
				Authorization: `Bearer ${this.token}`,
				...options.headers
			}
		});

		if (!response.ok) {
			const error = new Error('GitHub API error') as GitHubError;
			error.status = response.status;
			error.response = response;
			throw error;
		}

		return response;
	}

	async validateToken(): Promise<boolean> {
		try {
			const response = await this.fetch('/user');
			return response.ok;
		} catch {
			return false;
		}
	}

	async createRepository(name: string): Promise<Repository> {
		const response = await this.fetch('/user/repos', {
			method: 'POST',
			body: JSON.stringify({
				name,
				description: 'My LeetCode solutions, automatically synced by Leet Loaf 🍞',
				homepage: 'https://leetcode.com/problemset/all/',
				private: false,
				has_issues: false,
				has_projects: false,
				has_wiki: false,
				auto_init: true
			})
		});

		return response.json();
	}

	async createOrUpdateFile(
		repo: string,
		path: string,
		content: string,
		message: string,
		branch = 'main'
	): Promise<void> {
		// Check if file exists first
		let sha: string | undefined;
		try {
			const existingFile = await this.fetch(`/repos/${repo}/contents/${path}?ref=${branch}`);

			if (!existingFile.ok) {
				throw new Error(`Failed to fetch file: ${existingFile.statusText}`);
			}

			const fileData: { sha: string } | { message: string } = await existingFile.json();

			if ('sha' in fileData) {
				sha = fileData.sha;
			} else {
				throw new Error(`Unexpected response format: ${fileData.message}`);
			}
		} catch (error) {
			console.error('Error checking file existence:', error);
			// File doesn't exist or there was an error, which is handled silently
		}

		const encoder = new TextEncoder();
		const data = encoder.encode(content);
		const base64Content = btoa(Array.from(data, (byte) => String.fromCharCode(byte)).join(''));

		await this.fetch(`/repos/${repo}/contents/${path}`, {
			method: 'PUT',
			body: JSON.stringify({
				message,
				content: base64Content,
				sha,
				branch
			})
		});
	}

	async createBranch(repo: string, branch: string, fromBranch = 'main'): Promise<void> {
		// Get the SHA of the latest commit on the source branch
		const response = await this.fetch(`/repos/${repo}/git/refs/heads/${fromBranch}`);
		const {
			object: { sha }
		} = await response.json();

		// Create the new branch
		await this.fetch(`/repos/${repo}/git/refs`, {
			method: 'POST',
			body: JSON.stringify({
				ref: `refs/heads/${branch}`,
				sha
			})
		});
	}
}

// Helper function to get/create GitHub API instance
export async function getGitHubAPI(): Promise<GitHubAPI | null> {
	try {
		const githubAuth = await fetchStorage<GitHubAuthState>('githubAuth');

		if (!githubAuth || !githubAuth.token) {
			return null;
		}

		const api = new GitHubAPI(githubAuth.token);

		try {
			const isValid = await api.validateToken();
			if (!isValid) {
				await Browser.storage.local.remove('githubAuth');
				return null;
			}
		} catch (error) {
			console.error('Error validating GitHub token:', error);
			await Browser.storage.local.remove('githubAuth');
			return null;
		}

		return api;
	} catch (error) {
		console.error('Error while fetching GitHub API or token from storage:', error);
		return null;
	}
}
