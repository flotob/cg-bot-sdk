/**
 * Custom error classes for the Bot SDK
 */

export class BotApiError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = 'BotApiError';
    this.code = code;
    this.statusCode = statusCode;
    
    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BotApiError);
    }
  }
}

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookVerificationError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, WebhookVerificationError);
    }
  }
}

