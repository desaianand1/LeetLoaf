import browser from 'webextension-polyfill';
import type { LeetCodeProblem } from '$lib/shared/types';

class LeetCodeContentScript {
  private static instance: LeetCodeContentScript;
  private observer: MutationObserver | null = null;

  private constructor() {
    this.initialize();
  }

  static getInstance(): LeetCodeContentScript {
    if (!LeetCodeContentScript.instance) {
      LeetCodeContentScript.instance = new LeetCodeContentScript();
    }
    return LeetCodeContentScript.instance;
  }

  private async initialize() {
    // Set up page mutation observer
    this.setupObserver();
    
    // Listen for messages from popup/background
    browser.runtime.onMessage.addListener((message) => this.handleMessage(message));
  }

  private setupObserver() {
    this.observer = new MutationObserver(() => {
      this.checkForProblemSubmission();
    });

    // Start observing page changes
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private async checkForProblemSubmission() {
    // Check if we're on a submission success page
    if (window.location.pathname.includes('/submissions/') && document.body.textContent?.includes('Accepted')) {
      const problem = await this.extractProblemData();
      if (problem) {
        await this.notifyBackgroundScript(problem);
      }
    }
  }

  private async extractProblemData(): Promise<LeetCodeProblem | null> {
    try {
      // Extract problem data from page
      // This is a placeholder - actual implementation will need to parse the DOM or use LeetCode's API
      return {
        id: '',
        title: '',
        titleSlug: '',
        difficulty: '',
        tags: [],
        code: '',
        language: ''
      };
    } catch (error) {
      console.error('Failed to extract problem data:', error);
      return null;
    }
  }

  private async notifyBackgroundScript(problem: LeetCodeProblem) {
    await browser.runtime.sendMessage({
      type: 'NEW_SOLUTION',
      problem
    });
  }

  private async handleMessage(message: any) {
    switch (message.type) {
      case 'GET_CURRENT_PROBLEM':
        return this.extractProblemData();
    }
  }
}

// Initialize content script
LeetCodeContentScript.getInstance();