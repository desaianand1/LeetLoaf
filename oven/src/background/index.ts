import Browser from 'webextension-polyfill';
import { GitHubAPI } from '@/api/github';
import { LeetCodeAPI } from '@/api/leetcode';
import { RepositoryService } from '@/api/github/repository';
import { AnalyticsService } from '@/api/leetcode/analytics';
import { SyncErrorRecoveryService } from '@/api/leetcode/sync-error-recovery';
import { SyncQueue } from '@/api/sync-queue';

class BackgroundService {
  private analytics: AnalyticsService;
  private errorRecovery: SyncErrorRecoveryService;
  private syncQueue: SyncQueue;

  constructor() {
    this.analytics = new AnalyticsService();
    this.errorRecovery = new SyncErrorRecoveryService();
    this.syncQueue = new SyncQueue();
  }

  async initialize() {
    Browser.runtime.onMessage.addListener((message, sender) => {
      const handler = this.messageHandlers[message.type as keyof MessageHandlers];
      if (handler) {
        return handler.call(this, message.payload);
      }
      return false;
    });

    // Process queue periodically
    setInterval(() => this.processQueue(), 5000);
    
    // Clean queue daily
    setInterval(() => this.syncQueue.clean(), 24 * 60 * 60 * 1000);
  }

  private messageHandlers = {
    async NEW_SUBMISSION({ problemId, submissionId }) {
      await this.syncQueue.add(problemId, submissionId);
    },

    async GET_SYNC_STATUS() {
      return this.syncQueue.getStats();
    },

    async GET_ANALYTICS() {
      const apis = await this.getAPIs();
      if (!apis) return null;

      const problems = await apis.leetcode.getAllProblems();
      const submissions = await apis.leetcode.getAllSubmissions();

      return {
        problems: this.analytics.calculateProblemStats(problems),
        submissions: this.analytics.calculateSubmissionStats(submissions)
      };
    },

    async GET_ERRORS() {
      return this.errorRecovery.getUnresolvedErrors();
    },

    async RETRY_FAILED_SYNC({ errorId }) {
      const error = (await this.errorRecovery.getUnresolvedErrors())
        .find(e => e.id === errorId);
      
      if (error && this.errorRecovery.shouldRetry(error)) {
        await this.syncQueue.add(error.problemId, error.submissionId);
      }
    }
  };

  private async processQueue() {
    const item = await this.syncQueue.getNext();
    if (!item) return;

    const apis = await this.getAPIs();
    if (!apis) return;

    try {
      await this.syncQueue.updateStatus(item.id, 'processing');

      const problem = await apis.leetcode.getProblem(item.problemId);
      const submission = await apis.leetcode.getSubmission(item.submissionId);
      
      await apis.repository.syncSubmission(problem, submission);
      await this.syncQueue.updateStatus(item.id, 'completed');

    } catch (error) {
      await this.syncQueue.updateStatus(item.id, 'failed');
      await this.errorRecovery.logError({
        problemId: item.problemId,
        submissionId: item.submissionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async getAPIs() {
    const github = await GitHubAPI.getCurrent();
    const leetcode = await LeetCodeAPI.getCurrent();
    const { repositoryConfig } = await Browser.storage.local.get('repositoryConfig');

    if (!github || !leetcode || !repositoryConfig) {
      return null;
    }

    return {
      github,
      leetcode,
      repository: new RepositoryService(github, repositoryConfig)
    };
  }
}

// Initialize background service
const service = new BackgroundService();
service.initialize();