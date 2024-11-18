import Browser from 'webextension-polyfill';
import { AuthError } from '@/utils/error';
import type { AuthMessage } from '@/utils/messages';

export interface LeetCodeAuthState {
  isAuthenticated: boolean;
  username: string | null;
  csrfToken: string | null;
  cookies: string | null;
}

export class LeetCodeAuthService {
  static readonly STORAGE_KEY = 'leetcodeAuth';
  static readonly AUTH_TIMEOUT = 300000; // 5 minutes
  static readonly LOGIN_URL = 'https://leetcode.com/accounts/login/';

  static async authenticate(): Promise<AuthMessage> {
    const loginTab = await Browser.tabs.create({
      url: this.LOGIN_URL,
      active: true
    });

    return new Promise<AuthMessage>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new AuthError('leetcode', 'Authentication timed out'));
      }, this.AUTH_TIMEOUT);

      function cleanup() {
        clearTimeout(timeout);
        Browser.runtime.onMessage.removeListener(handleAuth);
        Browser.tabs.remove(loginTab.id!).catch(() => {});
      }

      function handleAuth(message: AuthMessage, sender: Browser.Runtime.MessageSender) {
        if (message.type === 'LEETCODE_AUTH_SUCCESS' && sender.tab?.id === loginTab.id) {
          cleanup();
          resolve(message);
        } else if (message.type === 'AUTH_ERROR' && message.payload.service === 'leetcode') {
          cleanup();
          reject(new AuthError('leetcode', message.payload.error));
        }
      }

      Browser.runtime.onMessage.addListener(handleAuth);
    });
  }

  static async getStoredAuth(): Promise<LeetCodeAuthState | null> {
    const stored = await Browser.storage.local.get(this.STORAGE_KEY);
    return stored[this.STORAGE_KEY] || null;
  }

  static async persist(auth: LeetCodeAuthState): Promise<void> {
    await Browser.storage.local.set({ [this.STORAGE_KEY]: auth });
  }

  static async clear(): Promise<void> {
    await Browser.storage.local.remove(this.STORAGE_KEY);
  }

  static async verify(csrfToken: string, cookies: string): Promise<boolean> {
    try {
      const response = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
          'Cookie': cookies
        },
        body: JSON.stringify({
          query: `
            query verifyAuth {
              userStatus {
                isSignedIn
                username
              }
            }
          `
        }),
        credentials: 'include'
      });

      const data = await response.json();
      return data?.data?.userStatus?.isSignedIn || false;
    } catch {
      return false;
    }
  }
}