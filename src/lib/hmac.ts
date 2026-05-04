import crypto from 'crypto';

export function signHmacSha256Hex(secret: string, message: string) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}
