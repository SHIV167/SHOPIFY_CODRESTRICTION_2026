import crypto from 'crypto';

export function randomToken(bytes: number) {
  return crypto.randomBytes(bytes).toString('hex');
}
