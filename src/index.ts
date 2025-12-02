/**
 * Common Ground Bot SDK
 * 
 * Build bots for Common Ground communities.
 * 
 * @example
 * ```typescript
 * import { BotClient } from '@anthropic-internal/cg-bot-sdk';
 * 
 * const bot = new BotClient({ token: process.env.BOT_TOKEN });
 * 
 * await bot.sendMessage({
 *   communityId: 'your-community-id',
 *   channelId: 'your-channel-id',
 *   text: 'Hello from my bot!',
 * });
 * ```
 */

// Client
export { BotClient } from './client.js';

// Webhook utilities
export { 
  verifyWebhook, 
  parseWebhook, 
  webhookMiddleware,
  type VerifyWebhookOptions 
} from './webhook.js';

// Errors
export { BotApiError, WebhookVerificationError } from './errors.js';

// Types
export type {
  // Config
  BotClientConfig,
  
  // Messages
  MessageBody,
  MessageContentItem,
  TextContent,
  LinkContent,
  MentionContent,
  BotMentionContent,
  NewlineContent,
  
  // Attachments
  Attachment,
  ImageAttachment,
  LinkPreviewAttachment,
  
  // API
  SendMessageOptions,
  SendMessageResult,
  Message,
  
  // Webhooks
  WebhookEvent,
  WebhookEventType,
  WebhookCommunity,
  WebhookChannel,
  WebhookMessage,
  WebhookSender,
  WebhookMentionedBot,
  
  // Errors
  ApiErrorResponse,
} from './types.js';

