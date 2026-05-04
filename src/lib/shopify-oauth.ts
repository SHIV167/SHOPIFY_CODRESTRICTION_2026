import { randomToken } from './crypto';
import { signHmacSha256Hex } from './hmac';

export function normalizeShopDomain(shop: string) {
  const cleaned = shop.trim().toLowerCase();
  if (!cleaned.endsWith('.myshopify.com')) return null;
  if (cleaned.includes('/')) return null;
  return cleaned;
}

export function buildAuthUrl(shop: string, state: string) {
  const host = process.env.HOST;
  const apiKey = process.env.SHOPIFY_API_KEY;
  const scopes = process.env.SHOPIFY_SCOPES;

  if (!host) throw new Error('HOST is required');
  if (!apiKey) throw new Error('SHOPIFY_API_KEY is required');
  if (!scopes) throw new Error('SHOPIFY_SCOPES is required');

  const redirectUri = `${host.replace(/\/$/, '')}/api/shopify/callback`;

  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.set('client_id', apiKey);
  url.searchParams.set('scope', scopes);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);

  return url.toString();
}

export function createState() {
  return randomToken(16);
}

export function verifyShopifyCallback(params: Record<string, string | null | undefined>) {
  const secret = process.env.SHOPIFY_API_SECRET;
  if (!secret) throw new Error('SHOPIFY_API_SECRET is required');

  const { hmac, ...rest } = params;
  if (!hmac) return false;

  const message = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== null && rest[k] !== '')
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join('&');

  const digest = signHmacSha256Hex(secret, message);
  return digest === hmac;
}

export async function exchangeCodeForAccessToken(shop: string, code: string) {
  const apiKey = process.env.SHOPIFY_API_KEY;
  const secret = process.env.SHOPIFY_API_SECRET;

  if (!apiKey) throw new Error('SHOPIFY_API_KEY is required');
  if (!secret) throw new Error('SHOPIFY_API_SECRET is required');

  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: apiKey,
      client_secret: secret,
      code,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to exchange code: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}
