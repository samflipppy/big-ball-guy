// ============================================================
// #344 — Error Monitoring Setup
// Singleton ErrorTracker that captures errors, messages,
// breadcrumbs, and user context in memory.
// ============================================================

export interface CapturedError {
  id: string;
  error: Error;
  context?: Record<string, unknown>;
  timestamp: number;
  user?: { userId: string; email?: string };
  breadcrumbs: Breadcrumb[];
}

export interface Breadcrumb {
  message: string;
  category: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

export interface CapturedMessage {
  id: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  timestamp: number;
}

export type MessageLevel = 'info' | 'warning' | 'error';

// ---------------------------------------------------------------------------
// ErrorTracker — singleton
// ---------------------------------------------------------------------------

export class ErrorTracker {
  private static instance: ErrorTracker | null = null;

  private errors: CapturedError[] = [];
  private messages: CapturedMessage[] = [];
  private breadcrumbs: Breadcrumb[] = [];
  private user: { userId: string; email?: string } | null = null;

  private maxErrors = 100;
  private maxBreadcrumbs = 50;
  private idCounter = 0;

  // Private constructor enforces singleton usage
  private constructor() {}

  // -------------------------------------------------------------------------
  // Singleton accessor
  // -------------------------------------------------------------------------

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /** Reset the singleton — useful in tests. */
  static resetInstance(): void {
    ErrorTracker.instance = null;
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Capture an error together with optional context metadata.
   * The current breadcrumb trail and user info are attached automatically.
   */
  captureError(error: Error, context?: Record<string, unknown>): CapturedError {
    const captured: CapturedError = {
      id: this.nextId('err'),
      error,
      context,
      timestamp: Date.now(),
      user: this.user ? { ...this.user } : undefined,
      breadcrumbs: [...this.breadcrumbs],
    };

    this.errors.push(captured);

    // Evict oldest entries when we exceed the limit
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    return captured;
  }

  /**
   * Capture an informational / warning / error message that is not tied to an
   * Error object.
   */
  captureMessage(message: string, level: MessageLevel): CapturedMessage {
    const captured: CapturedMessage = {
      id: this.nextId('msg'),
      message,
      level,
      timestamp: Date.now(),
    };

    this.messages.push(captured);
    return captured;
  }

  /**
   * Attach user context so subsequent errors carry user info.
   */
  setUser(userId: string, email?: string): void {
    this.user = { userId, email };
  }

  /**
   * Clear the current user context.
   */
  clearUser(): void {
    this.user = null;
  }

  /**
   * Add a breadcrumb (navigation step, click, etc.) that will be attached
   * to the next captured error.
   */
  addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, unknown>,
  ): void {
    this.breadcrumbs.push({
      message,
      category,
      data,
      timestamp: Date.now(),
    });

    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
   * Return the most recent captured errors. Defaults to 10.
   */
  getRecentErrors(count: number = 10): CapturedError[] {
    return this.errors.slice(-count);
  }

  /**
   * Return the most recent captured messages.
   */
  getRecentMessages(count: number = 10): CapturedMessage[] {
    return this.messages.slice(-count);
  }

  /**
   * Return all breadcrumbs.
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Return the current user context.
   */
  getUser(): { userId: string; email?: string } | null {
    return this.user ? { ...this.user } : null;
  }

  /**
   * Clear everything — errors, messages, breadcrumbs, user.
   */
  clear(): void {
    this.errors = [];
    this.messages = [];
    this.breadcrumbs = [];
    this.user = null;
    this.idCounter = 0;
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private nextId(prefix: string): string {
    this.idCounter += 1;
    return `${prefix}_${this.idCounter}_${Date.now()}`;
  }
}
