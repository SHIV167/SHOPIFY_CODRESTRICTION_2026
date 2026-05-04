import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

type ShopifySessionTokenPayload = {
  aud?: string;
  dest?: string;
  iss?: string;
  sub?: string;
  exp?: number;
  nbf?: number;
  iat?: number;
};

function extractShopDomainFromDest(dest: string | undefined): string | null {
  if (!dest) return null;
  try {
    const url = new URL(dest);
    return url.host;
  } catch {
    return null;
  }
}

export async function getShopDomainFromSessionToken(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) return null;

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecretKey = process.env.SHOPIFY_API_SECRET;
  if (!apiKey || !apiSecretKey) {
    throw new Error('Missing Shopify env vars: SHOPIFY_API_KEY and SHOPIFY_API_SECRET are required');
  }

  const secret = new TextEncoder().encode(apiSecretKey);

  const { payload } = await jwtVerify(token, secret, {
    algorithms: ['HS256'],
    clockTolerance: 10,
  });

  const p = payload as unknown as ShopifySessionTokenPayload;
  if (p.aud !== apiKey) return null;

  return extractShopDomainFromDest(p.dest);
}
