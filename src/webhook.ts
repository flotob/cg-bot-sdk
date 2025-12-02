/**
 * Webhook signature verification utilities
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { WebhookVerificationError } from './errors.js';
import type { WebhookEvent } from './types.js';

/** Maximum age of a webhook timestamp before it's considered expired (5 minutes) */
const MAX_TIMESTAMP_AGE_MS = 5 * 60 * 1000;

export interface VerifyWebhookOptions {
  /** Raw request body as string */
  payload: string;
  /** Value of X-CG-Signature header */
  signature: string;
  /** Value of X-CG-Timestamp header */
  timestamp: string;
  /** Your webhook secret */
  secret: string;
}

/**
 * Verify a webhook signature
 * 
 * @returns true if signature is valid
 * @throws WebhookVerificationError if verification fails
 */
export function verifyWebhook(options: VerifyWebhookOptions): boolean {
  const { payload, signature, timestamp, secret } = options;

  // Check timestamp is within acceptable range (prevent replay attacks)
  const messageTime = parseInt(timestamp, 10);
  if (isNaN(messageTime)) {
    throw new WebhookVerificationError('Invalid timestamp format');
  }

  const now = Date.now();
  const age = Math.abs(now - messageTime);
  
  if (age > MAX_TIMESTAMP_AGE_MS) {
    throw new WebhookVerificationError(
      `Timestamp is too old (${Math.round(age / 1000)}s). Max allowed: ${MAX_TIMESTAMP_AGE_MS / 1000}s`
    );
  }

  // Extract signature value (remove "sha256=" prefix if present)
  const signatureValue = signature.startsWith('sha256=') 
    ? signature.slice(7) 
    : signature;

  // Compute expected signature
  const signatureData = `${timestamp}.${payload}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(signatureData)
    .digest('hex');

  // Compare using timing-safe comparison
  try {
    const isValid = timingSafeEqual(
      Buffer.from(signatureValue, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
    
    if (!isValid) {
      throw new WebhookVerificationError('Signature mismatch');
    }
    
    return true;
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      throw error;
    }
    throw new WebhookVerificationError('Invalid signature format');
  }
}

/**
 * Parse and verify a webhook request
 * 
 * @returns The parsed webhook event
 * @throws WebhookVerificationError if verification fails
 */
export function parseWebhook(options: VerifyWebhookOptions): WebhookEvent {
  verifyWebhook(options);
  return JSON.parse(options.payload) as WebhookEvent;
}

/**
 * Express middleware for webhook verification
 * 
 * Requires body-parser with `verify` option to capture raw body:
 * ```
 * app.use(express.json({
 *   verify: (req, res, buf) => { req.rawBody = buf.toString(); }
 * }));
 * ```
 * 
 * @param secret - Webhook secret (defaults to WEBHOOK_SECRET env var)
 */
export function webhookMiddleware(secret?: string) {
  // Auto-read secret from env if not provided
  const webhookSecret = secret || process.env.WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('Webhook secret is required. Pass it to webhookMiddleware() or set WEBHOOK_SECRET env var.');
  }

  return (req: any, res: any, next: any) => {
    const signature = req.headers['x-cg-signature'];
    const timestamp = req.headers['x-cg-timestamp'];
    const rawBody = req.rawBody;

    if (!signature || !timestamp) {
      return res.status(401).json({ 
        error: 'MISSING_HEADERS',
        message: 'Missing X-CG-Signature or X-CG-Timestamp headers' 
      });
    }

    if (!rawBody) {
      return res.status(500).json({ 
        error: 'MISSING_RAW_BODY',
        message: 'Raw body not available. Configure body-parser with verify option.' 
      });
    }

    try {
      verifyWebhook({
        payload: rawBody,
        signature,
        timestamp,
        secret: webhookSecret,
      });
      next();
    } catch (error) {
      if (error instanceof WebhookVerificationError) {
        return res.status(401).json({ 
          error: 'INVALID_SIGNATURE',
          message: error.message 
        });
      }
      return res.status(500).json({ 
        error: 'VERIFICATION_ERROR',
        message: 'Webhook verification failed' 
      });
    }
  };
}

