/**
 * Common Ground Bot SDK Types
 */

// ============================================================================
// Message Content Types (matches CG message body format)
// ============================================================================

export interface TextContent {
  type: 'text';
  value: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
}

export interface LinkContent {
  type: 'link';
  value: string;
  url: string;
}

export interface MentionContent {
  type: 'mention';
  userId: string;
  alias?: string;
}

export interface BotMentionContent {
  type: 'botMention';
  botId: string;
  alias?: string;
}

export interface NewlineContent {
  type: 'newline';
}

export type MessageContentItem = 
  | TextContent 
  | LinkContent 
  | MentionContent 
  | BotMentionContent
  | NewlineContent;

export interface MessageBody {
  version: '1';
  content: MessageContentItem[];
}

// ============================================================================
// Attachment Types
// ============================================================================

export interface ImageAttachment {
  type: 'image';
  fileId: string;
  width?: number;
  height?: number;
}

export interface LinkPreviewAttachment {
  type: 'linkPreview';
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

export type Attachment = ImageAttachment | LinkPreviewAttachment;

// ============================================================================
// API Types
// ============================================================================

export interface SendMessageOptions {
  communityId: string;
  channelId: string;
  /** Simple text message (converted to body internally) */
  text?: string;
  /** Rich message content */
  body?: MessageBody;
  /** File attachments */
  attachments?: Attachment[];
  /** Reply to a specific message */
  replyTo?: string;
}

export interface Message {
  id: string;
  channelId: string;
  body: MessageBody;
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  botId: string;
  parentMessageId: string | null;
}

export interface SendMessageResult {
  message: Message;
}

// ============================================================================
// Webhook Types
// ============================================================================

export type WebhookEventType = 'BOT_MENTIONED';

export interface WebhookCommunity {
  id: string;
  name: string;
  url: string;
}

export interface WebhookChannel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  url: string;
}

export interface WebhookMessage {
  id: string;
  body: MessageBody;
  attachments: Attachment[];
  createdAt: string;
  replyToMessageId: string | null;
  mentionIndex: number;
}

export interface WebhookSender {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export interface WebhookMentionedBot {
  id: string;
  name: string;
}

export interface WebhookEvent {
  event: WebhookEventType;
  eventId: string;
  timestamp: string;
  apiVersion: '1';
  community: WebhookCommunity;
  channel: WebhookChannel;
  message: WebhookMessage;
  sender: WebhookSender;
  mentionedBot: WebhookMentionedBot;
}

// ============================================================================
// Client Configuration
// ============================================================================

export interface BotClientConfig {
  /** Bot authentication token (defaults to BOT_TOKEN env var) */
  token?: string;
  /** API base URL (defaults to CG_BASE_URL env var or production) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiErrorResponse {
  error: string;
  message?: string;
}

