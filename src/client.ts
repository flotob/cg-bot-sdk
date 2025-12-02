/**
 * BotClient - Main class for interacting with the Common Ground Bot API
 */

import type { 
  BotClientConfig, 
  SendMessageOptions, 
  SendMessageResult,
  MessageBody,
  ApiErrorResponse 
} from './types.js';
import { BotApiError } from './errors.js';

const DEFAULT_BASE_URL = 'https://app.commonground.cg';
const DEFAULT_TIMEOUT = 30000;

export class BotClient {
  private readonly token: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: BotClientConfig = {}) {
    // Auto-read token from env if not provided
    const token = config.token || process.env.BOT_TOKEN;
    
    if (!token) {
      throw new Error('Bot token is required. Pass it via config or set BOT_TOKEN env var.');
    }
    
    this.token = token;
    this.baseUrl = (config.baseUrl || process.env.CG_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(options: SendMessageOptions): Promise<SendMessageResult> {
    const { communityId, channelId, text, body, attachments, replyTo } = options;

    // Build message body from text or use provided body
    const messageBody: MessageBody = body || {
      version: '1',
      content: text ? [{ type: 'text', value: text }] : [],
    };

    const response = await this.request<SendMessageResult>('/api/v2/Bot/sendMessage', {
      communityId,
      channelId,
      body: messageBody,
      attachments: attachments || [],
      replyToMessageId: replyTo || null,
    });

    return response;
  }

  /**
   * Make an authenticated request to the Bot API
   */
  private async request<T>(path: string, data: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    // Debug logging
    if (process.env.DEBUG_SDK) {
      console.log('[SDK] Request:', url);
      console.log('[SDK] Body:', JSON.stringify(data, null, 2));
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bot ${this.token}`,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseText = await response.text();
      
      // Debug logging
      if (process.env.DEBUG_SDK) {
        console.log('[SDK] Response status:', response.status);
        console.log('[SDK] Response body:', responseText);
      }

      let responseData: T | ApiErrorResponse;
      try {
        responseData = JSON.parse(responseText) as T | ApiErrorResponse;
      } catch {
        throw new BotApiError('INVALID_RESPONSE', `Invalid JSON response: ${responseText}`, response.status);
      }

      if (!response.ok) {
        const errorData = responseData as ApiErrorResponse;
        throw new BotApiError(
          errorData.error || 'UNKNOWN_ERROR',
          errorData.message || `Request failed with status ${response.status}`,
          response.status
        );
      }

      // Also check for error in response body (API sometimes returns 200 with error)
      const maybeError = responseData as { status?: string; error?: string; message?: string };
      if (maybeError.status === 'ERROR' || maybeError.error) {
        throw new BotApiError(
          maybeError.error || 'UNKNOWN_ERROR',
          maybeError.message || 'Request failed',
          response.status
        );
      }

      return responseData as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof BotApiError) {
        throw error;
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new BotApiError('TIMEOUT', `Request timed out after ${this.timeout}ms`, 408);
        }
        throw new BotApiError('NETWORK_ERROR', error.message, 0);
      }
      
      throw new BotApiError('UNKNOWN_ERROR', 'An unknown error occurred', 0);
    }
  }
}

