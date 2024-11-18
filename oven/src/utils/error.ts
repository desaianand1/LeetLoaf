export class ExtensionError extends Error {
    constructor(
      message: string,
      public code: string,
      public userMessage?: string
    ) {
      super(message);
      this.name = 'ExtensionError';
    }
  }
  
  export class AuthError extends ExtensionError {
    constructor(service: 'github' | 'leetcode', message: string) {
      super(
        message,
        `AUTH_ERROR_${service.toUpperCase()}`,
        `Failed to authenticate with ${service.charAt(0).toUpperCase() + service.slice(1)}`
      );
    }
  }
  
  export class RepositoryError extends ExtensionError {
    constructor(action: 'create' | 'find' | 'update', message: string) {
      super(
        message,
        `REPO_ERROR_${action.toUpperCase()}`,
        `Failed to ${action} repository`
      );
    }
  }
  
  export function handleError(error: unknown): string {
    if (error instanceof ExtensionError) {
      return error.userMessage || error.message;
    }
    
    if (error instanceof Error) {
      return error.message;
    }
    
    return 'An unexpected error occurred';
  }