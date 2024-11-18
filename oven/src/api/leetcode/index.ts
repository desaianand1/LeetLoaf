import type { LeetCodeAuthState } from '@/api/leetcode/auth';
import { InMemoryCache } from '@/utils/cache';

export interface LeetCodeProblem {
  frontendQuestionId: string;
  title: string;
  titleSlug: string;
  content: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topicTags: Array<{ name: string; slug: string }>;
  stats: {
    acRate: number;
  };
  similarQuestions: string;
  freqBar: number;
}

export interface LeetCodeSubmission {
  id: string;
  lang: string;
  timestamp: number;
  statusDisplay: string;
  runtime: string;
  memory: string;
  code: string;
  url: string;
}

export class LeetCodeAPI {
  private baseUrl = 'https://leetcode.com';
  private graphqlUrl = 'https://leetcode.com/graphql';
  private cache = new InMemoryCache(30);

  constructor(private auth: LeetCodeAuthState) {
    if (!auth.isAuthenticated) {
      throw new Error('LeetCode authentication required');
    }
  }

  private async graphql<T>(query: string, variables: Record<string, any> = {}): Promise<T> {
    const cacheKey = `${query}:${JSON.stringify(variables)}`;
    const cached = this.cache.get<T>(cacheKey);
    if (cached) return cached;

    const response = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': this.auth.csrfToken || '',
        'Cookie': this.auth.cookies || '',
        'Referer': this.baseUrl
      },
      body: JSON.stringify({ query, variables }),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`LeetCode API error: ${response.status}`);
    }

    const result = await response.json();
    if (result.errors) {
      throw new Error(result.errors[0].message);
    }

    this.cache.set(cacheKey, result.data);
    return result.data;
  }

  async getProblem(titleSlug: string): Promise<LeetCodeProblem> {
    const query = `
      query questionData($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionId
          questionFrontendId
          title
          titleSlug
          content
          difficulty
          topicTags {
            name
            slug
          }
          stats
          similarQuestions
          freqBar
        }
      }
    `;

    const data = await this.graphql<{ question: LeetCodeProblem }>(query, { titleSlug });
    return data.question;
  }

  async getSubmission(id: string): Promise<LeetCodeSubmission> {
    // Don't cache submissions as they're frequently updated
    const query = `
      query submissionDetails($submissionId: Int!) {
        submissionDetails(submissionId: $submissionId) {
          id
          lang
          timestamp
          statusDisplay
          runtime
          memory
          code
          url
        }
      }
    `;

    const data = await this.graphql<{ submissionDetails: LeetCodeSubmission }>(
      query, 
      { submissionId: parseInt(id) }
    );
    return data.submissionDetails;
  }
}