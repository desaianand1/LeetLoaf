import Browser from 'webextension-polyfill';

// Listen for messages from background
Browser.runtime.onMessage.addListener((message) => {
  if (message.type === 'CHECK_LEETCODE_AUTH') {
    return checkLeetCodeAuth();
  }
});

async function checkLeetCodeAuth() {
  try {
    // Get CSRF token from meta tag or cookie
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || 
                     document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1];

    // Get all cookies for leetcode.com
    const cookies = document.cookie;

    // If we have both, consider auth potentially valid
    if (csrfToken && cookies) {
      return { csrfToken, cookies };
    }

    return { error: 'Not authenticated with LeetCode' };
  } catch (error) {
    return { error: 'Failed to check LeetCode authentication' };
  }
}

// Detect if we're on a submission page
const SUBMISSION_PATH_REGEX = /^\/problems\/[\w-]+\/submissions\/\d+/;

if (SUBMISSION_PATH_REGEX.test(window.location.pathname)) {
  Browser.runtime.sendMessage({ 
    type: 'NEW_SUBMISSION',
    payload: {
      path: window.location.pathname
    }
  });
}