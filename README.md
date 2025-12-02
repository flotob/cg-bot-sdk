# Common Ground Bot SDK

Build bots for Common Ground communities.

## Installation

```bash
npm install @anthropic-internal/cg-bot-sdk
```

## Quick Start

### 1. Set up environment variables

Copy `env.example` to `.env` and fill in your bot credentials:

```bash
cp env.example .env
```

```env
BOT_TOKEN=your-bot-token-here
WEBHOOK_SECRET=your-webhook-secret-here
```

### 2. Send Messages

```typescript
import { BotClient } from '@anthropic-internal/cg-bot-sdk';

// Automatically reads BOT_TOKEN from env
const bot = new BotClient();

// Send a simple text message
await bot.sendMessage({
  communityId: 'your-community-id',
  channelId: 'your-channel-id',
  text: 'Hello from my bot!',
});

// Reply to a message
await bot.sendMessage({
  communityId: 'your-community-id',
  channelId: 'your-channel-id',
  text: 'This is a reply!',
  replyTo: 'message-id-to-reply-to',
});
```

### 3. Handle Webhooks

When users mention your bot with `@YourBot`, you'll receive a webhook:

```typescript
import express from 'express';
import { BotClient, webhookMiddleware, WebhookEvent } from '@anthropic-internal/cg-bot-sdk';

const app = express();
const bot = new BotClient(); // Reads BOT_TOKEN from env

// Required: capture raw body for signature verification
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));

// Webhook endpoint - automatically reads WEBHOOK_SECRET from env
app.post('/webhook',
  webhookMiddleware(),
  async (req, res) => {
    const event: WebhookEvent = req.body;
    
    if (event.event === 'BOT_MENTIONED') {
      console.log(`Mentioned by ${event.sender.displayName} in #${event.channel.name}`);
      
      // Respond to the mention
      await bot.sendMessage({
        communityId: event.community.id,
        channelId: event.channel.id,
        text: `Hi ${event.sender.displayName}!`,
        replyTo: event.message.id,
      });
    }
    
    res.json({ ok: true });
  }
);

app.listen(3000);
```

### Manual Webhook Verification

```typescript
import { verifyWebhook, parseWebhook } from '@anthropic-internal/cg-bot-sdk';

// Verify signature
const isValid = verifyWebhook({
  payload: rawBodyString,
  signature: req.headers['x-cg-signature'],
  timestamp: req.headers['x-cg-timestamp'],
  secret: process.env.WEBHOOK_SECRET!,
});

// Or parse and verify in one step
const event = parseWebhook({
  payload: rawBodyString,
  signature: req.headers['x-cg-signature'],
  timestamp: req.headers['x-cg-timestamp'],
  secret: process.env.WEBHOOK_SECRET!,
});
```

## API Reference

### `BotClient`

```typescript
new BotClient(config: BotClientConfig)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `token` | `string` | (required) | Your bot's authentication token |
| `baseUrl` | `string` | `https://app.commonground.cg` | API base URL |
| `timeout` | `number` | `30000` | Request timeout in ms |

#### `sendMessage(options)`

Send a message to a channel.

```typescript
await bot.sendMessage({
  communityId: string,    // Required
  channelId: string,      // Required  
  text?: string,          // Simple text message
  body?: MessageBody,     // Rich message content
  attachments?: Attachment[],
  replyTo?: string,       // Message ID to reply to
});
```

### Webhook Types

```typescript
interface WebhookEvent {
  event: 'BOT_MENTIONED';
  eventId: string;
  timestamp: string;
  apiVersion: '1';
  
  community: {
    id: string;
    name: string;
    url: string;
  };
  
  channel: {
    id: string;
    name: string;
    type: 'text' | 'voice';
    url: string;
  };
  
  message: {
    id: string;
    body: MessageBody;
    attachments: Attachment[];
    createdAt: string;
    replyToMessageId: string | null;
    mentionIndex: number;
  };
  
  sender: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  };
  
  mentionedBot: {
    id: string;
    name: string;
  };
}
```

## Error Handling

```typescript
import { BotApiError } from '@anthropic-internal/cg-bot-sdk';

try {
  await bot.sendMessage({ ... });
} catch (error) {
  if (error instanceof BotApiError) {
    console.error(`API Error: ${error.code} - ${error.message}`);
    console.error(`Status: ${error.statusCode}`);
  }
}
```

