# User Flow & Story

## Purpose

This browser extension's purpose is to sync a user's LeetCode profile and LeetCode problems and submissions (code, runtime performance, solution metadata, problem description, problem metadata) to a new GitHub repository of theirs. When a user first installs the extension, I'd like them to authenticate with GitHub so we can get their initial repository setup. Next, I'd like them to redirect them to LeetCode so they can authenticate with LeetCode and we can begin syncing their profile data and submissions. Additionally, anytime they make a new submission and are redirected to submissions page (e.g. <https://leetcode.com/problems/{problem-id}/submissions/{submission-id}>), I'd like their submission to be synced to their GitHub.

## Key Considerations

- Use Svelte 5 idiomatic code with runes (in-built in Svelte 5) and minimal to no stores or old conventions
- Ensure the browser extension is cross-browser compliant using the webextension-polyfill
- Use `unplugin-icons` with `@iconify-json/lucide` and `@iconify-json/simple-icons` icon packs.
- Each unique user of this browser extension will want to sync their LeetCode data to a GitHub account of their choosing. We need to let them authenticate with GitHub and then store any necessary data appropriately. This extension will not have a backend so all API calls must be made from this extension itself (using secure and appropriate best-practices)
- Uses GitHub's OAuth web application flow directly:  
  - Requests the token be returned in the URL fragment
  - Stores the token securely in the extension's storage
  - Verifies the token by making an API request to GitHub
  - Requires no backend infrastructure
  - The only thing we need is to:
    - Register our extension as a GitHub OAuth App (one time setup by us)
    - Use that OAuth App's client ID in our extension
    - Set the callback URL to match our extension's popup/oauth.html page
- As for the GitHub repository naming conventions, the repository should be named `leet-loaf-{username}`. Under the `pantry/` directory, there should be a folder named `{frontendId}-{problem-slug}/` with sub-folders for problem submissions based on programming language, a README with the problem definition and explanation and a metadata.json.
- We should handle the case where a user already has a repository from this extension with an explicit user decision to use an existing repository or to create a new one. If a new one cannot be created due to a naming conflict, we should append a short hash at the end of the repository name after a hyphen.
- We should handle the LeetCode authentication ourselves with an explicit action that the user can kick off
- Use the defined path aliases in `tsconfig.json` instead of relative imports.
- Ensure good separation of concerns, keep code simple if possible, keep security concerns in mind and follow standard programming best practices when possible.

## Initial Setup Flow (First Install)

User installs extension
-> Opens popup
-> GitHub OAuth flow
-> Store GitHub token
-> Redirect to LeetCode
-> LeetCode authentication
-> Initial sync of:

    - User profile
    - All problems attempted
    - All submissions

-> Create/setup GitHub repository with initial data

## Auto-Sync Flow

User submits solution on LeetCode
-> Content script detects submission page URL pattern
-> Gather submission data
-> Push to GitHub repository
