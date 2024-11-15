import Browser from 'webextension-polyfill';
import { GitHubAPI, getGitHubAPI } from '@/api/github/github';

export interface RepositoryConfig {
	owner: string;
	name: string;
	default_branch: string;
}

export async function setupRepository(username: string): Promise<RepositoryConfig | null> {
	const api = await getGitHubAPI();
	if (!api) return null;

	try {
		// Create repository with standardized name
		const repoName = 'leetcode-solutions';
		const repo = await api.createRepository(repoName);

		// Create initial README with repository structure explanation
		const readmeContent = `# LeetCode Solutions 🍞

This repository contains my LeetCode solutions, automatically synced by [Leet Loaf](https://github.com/desaianand1/LeetLoaf).

## Repository Structure

\`\`\`
/
├── pantry/                     # LeetCode problems
│   ├── two-sum/               # Problem directory
│   │   ├── README.md         # Problem description
│   │   ├── metadata.json     # Problem metadata
│   │   └── solutions/        # Language-specific solutions
│   │       ├── python/
│   │       │   └── solution.py
│   │       └── javascript/
│   │           └── solution.js
│   └── ...
└── bakery/                    # Static website files (coming soon)
\`\`\`

## Stats

- Total problems solved: 0
- Languages used: []
- Last synced: ${new Date().toISOString()}
`;

		await api.createOrUpdateFile(
			repo.full_name,
			'README.md',
			readmeContent,
			'Initial commit: Repository setup by Leet Loaf 🍞'
		);

		const config: RepositoryConfig = {
			owner: username,
			name: repoName,
			default_branch: repo.default_branch
		};

		// Store repository config
		await Browser.storage.local.set({ repositoryConfig: config });

		return config;
	} catch (error) {
		console.error('Failed to setup repository:', error);
		return null;
	}
}

export async function getRepositoryConfig(): Promise<RepositoryConfig | null> {
	try {
		const { repositoryConfig } = await Browser.storage.local.get('repositoryConfig');
		return repositoryConfig || null;
	} catch {
		return null;
	}
}
