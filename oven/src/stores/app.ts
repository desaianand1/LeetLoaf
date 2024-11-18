import { GitHubAuthService, type GitHubAuthState } from '@/api/github/auth';
import { LeetCodeAuthService, type LeetCodeAuthState } from '@/api/leetcode/auth';
import type { RepositoryConfig } from '@/api/github/repository';
import type { ToBackgroundMessage, FromBackgroundMessage } from '@/utils/messages';
import Browser from 'webextension-polyfill';

async function sendMessage<T>(message: ToBackgroundMessage): Promise<T> {
  try {
    return await Browser.runtime.sendMessage(message);
  } catch (error) {
    console.error('Message failed:', message.type, error);
    throw error;
  }
}

export function createAppStore() {
  // Define state using runes
  const github = $state<GitHubAuthState>({
    isAuthenticated: false,
    username: null,
    token: null
  });

  const leetcode = $state<LeetCodeAuthState>({
    isAuthenticated: false,
    username: null,
    csrfToken: null,
    cookies: null
  });

  let repository = $state<RepositoryConfig | null>(null);
  let isLoading = $state(false);
  let error = $state<string | null>(null);

  // Derived states using $derived
  const isFullyAuthenticated = $derived(
    github.isAuthenticated && 
    leetcode.isAuthenticated && 
    repository !== null
  );

  const canConnectLeetCode = $derived(github.isAuthenticated && !isLoading);

  // Effects using $effect
  $effect(() => {
    if (github.isAuthenticated || leetcode.isAuthenticated) {
      initializeState();
    }
  });

  async function initializeState() {
    const [githubAuth, leetcodeAuth] = await Promise.all([
      GitHubAuthService.getStoredAuth(),
      LeetCodeAuthService.getStoredAuth()
    ]);

    if (githubAuth) Object.assign(github, githubAuth);
    if (leetcodeAuth) Object.assign(leetcode, leetcodeAuth);

    // Verify stored auth is still valid
    if (github.token) {
      const isValid = await GitHubAuthService.verify(github.token);
      if (!isValid) {
        await GitHubAuthService.clear();
        resetGitHubAuth();
      }
    }

    if (leetcode.csrfToken && leetcode.cookies) {
      const isValid = await LeetCodeAuthService.verify(
        leetcode.csrfToken,
        leetcode.cookies
      );
      if (!isValid) {
        await LeetCodeAuthService.clear();
        resetLeetCodeAuth();
      }
    }
  }

  function resetGitHubAuth() {
    github.isAuthenticated = false;
    github.username = null;
    github.token = null;
  }

  function resetLeetCodeAuth() {
    leetcode.isAuthenticated = false;
    leetcode.username = null;
    leetcode.csrfToken = null;
    leetcode.cookies = null;
  }

  async function authenticateGitHub() {
    if (isLoading) return;
    
    isLoading = true;
    error = null;

    try {
      const result = await GitHubAuthService.authenticate();
      if (result.type === 'GITHUB_AUTH_SUCCESS') {
        github.isAuthenticated = true;
        github.username = result.payload.username;
        github.token = result.payload.token;
        
        await GitHubAuthService.persist(github);
        await checkExistingRepository();
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to authenticate';
      throw err;
    } finally {
      isLoading = false;
    }
  }

  async function authenticateLeetCode() {
    if (isLoading) return;
    
    isLoading = true;
    error = null;

    try {
      const result = await LeetCodeAuthService.authenticate();
      if (result.type === 'LEETCODE_AUTH_SUCCESS') {
        leetcode.isAuthenticated = true;
        leetcode.username = result.payload.username;
        leetcode.csrfToken = result.payload.csrfToken;
        leetcode.cookies = result.payload.cookies;
        
        await LeetCodeAuthService.persist(leetcode);
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to authenticate';
      throw err;
    } finally {
      isLoading = false;
    }
  }

  async function checkExistingRepository() {
    if (!github.username) return false;

    const response = await sendMessage<FromBackgroundMessage>({
      type: 'CHECK_EXISTING_REPO',
      payload: { username: github.username }
    });

    if (response.type === 'REPO_EXISTS' && response.payload.exists) {
      repository = response.payload.repository || null;
      return true;
    }
    return false;
  }

  async function handleRepositorySetup(useExisting: boolean) {
    if (!github.username) return;

    try {
      const message: ToBackgroundMessage = useExisting 
        ? {
            type: 'USE_EXISTING_REPOSITORY',
            payload: { username: github.username }
          }
        : {
            type: 'CREATE_REPOSITORY',
            payload: { username: github.username }
          };

      const response = await sendMessage<FromBackgroundMessage>(message);
      if (response.type === 'REPO_CREATED') {
        repository = response.payload.repository;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to setup repository';
      throw err;
    }
  }

  return {
    // State
    github,
    leetcode,
    repository,
    isLoading,
    error,
    
    // Derived state
    isFullyAuthenticated,
    canConnectLeetCode,
    
    // Methods
    authenticateGitHub,
    authenticateLeetCode,
    handleRepositorySetup,
    checkExistingRepository
  };
}

// Create a singleton instance for global state
export const appStore = createAppStore();