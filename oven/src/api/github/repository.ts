// import Browser from 'webextension-polyfill';
// import { createHash } from 'crypto';
// import type { GitHubAPI } from '@/api/github';
// import type { LeetCodeSubmission, LeetCodeProblem } from '@/api/leetcode';

// export interface RepositoryConfig {
//   owner: string;
//   name: string;
//   default_branch: string;
//   created_at: string;
//   last_synced?: string;
//   total_submissions?: number;
//   languages_used?: string[];
// }

// export interface SyncError {
//   problemId: string;
//   submissionId: string;
//   error: string;
// }

// export class RepositoryService {
//   private github: GitHubAPI;
//   private config: RepositoryConfig;

//   constructor(github: GitHubAPI, config: RepositoryConfig) {
//     this.github = github;
//     this.config = config;
//   }

//   private async updateConfig(updates: Partial<RepositoryConfig>) {
//     this.config = { ...this.config, ...updates };
//     await Browser.storage.local.set({ repositoryConfig: this.config });
//     return this.config;
//   }

//   async syncSubmission(problem: LeetCodeProblem, submission: LeetCodeSubmission): Promise<void> {
//     const problemDir = `pantry/${problem.frontendQuestionId}-${problem.titleSlug}`;
//     const languageDir = `${problemDir}/solutions/${submission.lang.toLowerCase()}`;

//     // Update problem README and metadata
//     await this.github.createOrUpdateFile(
//       this.config.name,
//       `${problemDir}/README.md`,
//       this.generateProblemReadme(problem),
//       `docs: update problem description for ${problem.title}`
//     );

//     await this.github.createOrUpdateFile(
//       this.config.name,
//       `${problemDir}/metadata.json`,
//       JSON.stringify(this.generateProblemMetadata(problem), null, 2),
//       `chore: update metadata for ${problem.title}`
//     );

//     // Add solution file with proper extension
//     const extension = this.getFileExtension(submission.lang);
//     await this.github.createOrUpdateFile(
//       this.config.name,
//       `${languageDir}/solution${extension}`,
//       submission.code,
//       `feat(${problem.frontendQuestionId}): add ${submission.lang} solution [${submission.statusDisplay}]`
//     );

//     // Update submission metadata
//     const submissionMetadata = {
//       id: submission.id,
//       timestamp: submission.timestamp,
//       status: submission.statusDisplay,
//       runtime: submission.runtime,
//       memory: submission.memory,
//       language: submission.lang
//     };

//     await this.github.createOrUpdateFile(
//       this.config.name,
//       `${languageDir}/metadata.json`,
//       JSON.stringify(submissionMetadata, null, 2),
//       `chore: update submission metadata for ${problem.title}`
//     );

//     // Update repository stats
//     await this.updateStats();
//   }

//   private async updateStats() {
//     try {
//       // Get all solution directories
//       const solutions = await this.github.listDirectory(this.config.name, 'pantry');

//       // Calculate stats
//       const languages = new Set<string>();
//       let totalSubmissions = 0;

//       for (const dir of solutions) {
//         const solutionsDir = await this.github.listDirectory(
//           this.config.name,
//           `pantry/${dir}/solutions`
//         );

//         for (const lang of solutionsDir) {
//           languages.add(lang);
//           totalSubmissions++;
//         }
//       }

//       // Update config with new stats
//       await this.updateConfig({
//         last_synced: new Date().toISOString(),
//         total_submissions: totalSubmissions,
//         languages_used: Array.from(languages)
//       });

//       // Update main README with stats
//       await this.updateReadme();
//     } catch (error) {
//       console.error('Failed to update repository stats:', error);
//     }
//   }

//   private async updateReadme() {
//     const readmeContent = `# LeetCode Solutions 🍞

// This repository contains my LeetCode solutions, automatically synced by [Leet Loaf](https://github.com/desaianand1/LeetLoaf).

// ## Stats 📊

// - Total problems solved: ${this.config.total_submissions || 0}
// - Languages used: ${(this.config.languages_used || []).join(', ')}
// - Last synced: ${this.config.last_synced || 'Never'}

// ## Repository Structure 📂

// \`\`\`
// /
// ├── pantry/                     # LeetCode problems
// │   ├── {id}-{slug}/           # Problem directory
// │   │   ├── README.md          # Problem description & explanation
// │   │   ├── metadata.json      # Problem metadata
// │   │   └── solutions/         # Language-specific solutions
// │   │       ├── python/
// │   │       │   ├── solution.py
// │   │       │   └── metadata.json
// │   │       └── javascript/
// │   │           ├── solution.js
// │   │           └── metadata.json
// │   └── ...
// └── bakery/                    # Static website files (coming soon)
// \`\`\`

// ## Recent Submissions 🕒

// ${await this.getRecentSubmissions()}
// `;

//     await this.github.createOrUpdateFile(
//       this.config.name,
//       'README.md',
//       readmeContent,
//       'docs: update repository statistics'
//     );
//   }

//   private async getRecentSubmissions(limit = 5): Promise<string> {
//     try {
//       const submissions = await this.github.listRecentCommits(
//         this.config.name,
//         'feat'
//       );

//       if (!submissions.length) return 'No recent submissions';

//       return submissions
//         .slice(0, limit)
//         .map(commit => `- ${commit.message} (${new Date(commit.date).toLocaleDateString()})`)
//         .join('\n');
//     } catch {
//       return 'Failed to load recent submissions';
//     }
//   }

//   private generateProblemReadme(problem: LeetCodeProblem): string {
//     return `# ${problem.frontendQuestionId}. ${problem.title}

// ## Problem Description

// ${problem.content}

// ## Difficulty: ${problem.difficulty}

// ## Related Topics

// ${problem.topicTags.map(tag => `- ${tag.name}`).join('\n')}

// ## Solutions

// ${this.generateSolutionsSection(problem)}
// `;
//   }

//   private generateProblemMetadata(problem: LeetCodeProblem): object {
//     return {
//       id: problem.frontendQuestionId,
//       title: problem.title,
//       titleSlug: problem.titleSlug,
//       difficulty: problem.difficulty,
//       topics: problem.topicTags.map(tag => tag.name),
//       similarQuestions: problem.similarQuestions,
//       acceptance: problem.stats.acRate,
//       frequency: problem.freqBar,
//       updated_at: new Date().toISOString()
//     };
//   }

//   private getFileExtension(language: string): string {
//     const extensions: Record<string, string> = {
//       python: '.py',
//       python3: '.py',
//       javascript: '.js',
//       typescript: '.ts',
//       java: '.java',
//       cpp: '.cpp',
//       'c++': '.cpp',
//       c: '.c',
//       csharp: '.cs',
//       ruby: '.rb',
//       swift: '.swift',
//       golang: '.go',
//       scala: '.scala',
//       kotlin: '.kt',
//       rust: '.rs',
//       php: '.php'
//     };

//     return extensions[language.toLowerCase()] || '.txt';
//   }

//   // Error recovery
//   async recoverFailedSync(error: SyncError): Promise<void> {
//     try {
//       // Create error log
//       const errorLog = {
//         timestamp: new Date().toISOString(),
//         ...error
//       };

//       // Store in special directory for failed syncs
//       await this.github.createOrUpdateFile(
//         this.config.name,
//         `pantry/.sync-errors/${error.problemId}-${error.submissionId}.json`,
//         JSON.stringify(errorLog, null, 2),
//         `chore: log sync error for problem ${error.problemId}`
//       );

//       // Could implement retry logic here
//     } catch (retryError) {
//       console.error('Failed to recover from sync error:', retryError);
//       throw retryError;
//     }
//   }
// }

import type { GitHubAuthState } from '@/api/github/auth';
import { InMemoryCache } from '@/utils/cache';

export interface RepositoryConfig {
	owner: string;
	name: string;
	default_branch: string;
	created_at: string;
	html_url: string;
}

export class GitHubRepository {
	private baseUrl = 'https://api.github.com';
	private cache = new InMemoryCache(5); // 5 minute cache

	constructor(private auth: GitHubAuthState) {
		if (!auth.isAuthenticated || !auth.token) {
			throw new Error('GitHub authentication required');
		}
	}

	private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
		const response = await fetch(`${this.baseUrl}${path}`, {
			...options,
			headers: {
				Accept: 'application/vnd.github.v3+json',
				Authorization: `Bearer ${this.auth.token}`,
				...options.headers
			}
		});

		if (!response.ok) {
			throw new Error(`GitHub API error: ${response.status}`);
		}

		return response.json();
	}

	private generateRepoName(withHash = false): string {
		const baseName = `leet-loaf-${this.auth.username}`;
		if (!withHash) return baseName;

		// Simple hash for uniqueness
		const hash = Math.random().toString(36).substring(2, 9);
		return `${baseName}-${hash}`;
	}

	async findExisting(): Promise<RepositoryConfig | null> {
		const cacheKey = `repo:${this.auth.username}`;
		const cached = this.cache.get<RepositoryConfig>(cacheKey);
		if (cached) return cached;

		try {
			const repo = await this.request(`/repos/${this.auth.username}/${this.generateRepoName()}`);
			const config: RepositoryConfig = {
				owner: repo.owner.login,
				name: repo.name,
				default_branch: repo.default_branch,
				created_at: repo.created_at,
				html_url: repo.html_url
			};

			this.cache.set(cacheKey, config);
			return config;
		} catch (error) {
			if ((error as any)?.message.includes('404')) {
				return null;
			}
			throw error;
		}
	}

	async create(): Promise<RepositoryConfig> {
		const data = {
			name: this.generateRepoName(),
			description: 'My LeetCode solutions, automatically synced by Leet Loaf 🍞',
			homepage: 'https://leetcode.com/problemset/all/',
			private: false,
			has_issues: false,
			has_projects: false,
			has_wiki: false,
			auto_init: true
		};

		try {
			const repo = await this.request('/user/repos', {
				method: 'POST',
				body: JSON.stringify(data)
			});

			return {
				owner: repo.owner.login,
				name: repo.name,
				default_branch: repo.default_branch,
				created_at: repo.created_at,
				html_url: repo.html_url
			};
		} catch (error) {
			if ((error as any)?.message.includes('422')) {
				// Name conflict, try with hash
				const repo = await this.request('/user/repos', {
					method: 'POST',
					body: JSON.stringify({ ...data, name: this.generateRepoName(true) })
				});

				return {
					owner: repo.owner.login,
					name: repo.name,
					default_branch: repo.default_branch,
					created_at: repo.created_at,
					html_url: repo.html_url
				};
			}
			throw error;
		}
	}

	async createOrUpdateFile(path: string, content: string, message: string): Promise<void> {
		// Don't cache file operations
		let sha: string | undefined;

		try {
			const existing = await this.request(
				`/repos/${this.auth.username}/${this.generateRepoName()}/contents/${path}`
			);
			if (!Array.isArray(existing)) {
				sha = existing.sha;
			}
		} catch (error) {
			// File doesn't exist yet, which is fine
			if (!(error as any)?.message.includes('404')) {
				throw error;
			}
		}

		await this.request(`/repos/${this.auth.username}/${this.generateRepoName()}/contents/${path}`, {
			method: 'PUT',
			body: JSON.stringify({
				message,
				content: btoa(content),
				sha
			})
		});
	}
}
