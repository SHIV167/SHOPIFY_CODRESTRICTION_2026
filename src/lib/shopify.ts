import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION, Session } from '@shopify/shopify-api';
import prisma from './prisma';

let shopifySingleton: ReturnType<typeof shopifyApi> | null = null;

export function getShopify() {
  if (shopifySingleton) return shopifySingleton;

  const apiKey = process.env.SHOPIFY_API_KEY;
  const apiSecretKey = process.env.SHOPIFY_API_SECRET;
  const host = process.env.HOST;

  if (!apiKey || !apiSecretKey) {
    throw new Error('Missing Shopify env vars: SHOPIFY_API_KEY and SHOPIFY_API_SECRET are required');
  }

  shopifySingleton = shopifyApi({
    apiKey,
    apiSecretKey,
    apiVersion: LATEST_API_VERSION,
    scopes: (process.env.SHOPIFY_SCOPES || '').split(',').filter(Boolean),
    hostName: host?.replace(/https?:\/\//, '') || 'localhost',
    isEmbeddedApp: true,
    hostScheme: host?.startsWith('https') ? 'https' : 'http',
  });

  return shopifySingleton;
}

export async function getShopifyClient(shopDomain: string) {
  const shop = await prisma.shop.findUnique({
    where: { shopifyDomain: shopDomain },
  });

  if (!shop || !shop.accessToken) {
    throw new Error(`Shop not found or not authenticated: ${shopDomain}`);
  }

  const session = new Session({
    shop: shopDomain,
    accessToken: shop.accessToken,
    isOnline: false,
    id: '',
    state: '',
    scope: process.env.SHOPIFY_SCOPES || '',
  });

  return {
    rest: new (getShopify().clients.Rest)({ session }),
    graphql: new (getShopify().clients.Graphql)({ session }),
    session,
  };
}

export async function verifyWebhook(rawBody: string, hmac: string, secret: string): Promise<boolean> {
  const crypto = await import('crypto');
  const generatedHash = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64');

  return generatedHash === hmac;
}

export async function registerWebhooks(shopDomain: string, accessToken: string) {
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-10';

  const webhooks = [
    {
      topic: 'ORDERS_CREATE',
      address: `${process.env.HOST}/api/webhooks/orders-create`,
      format: 'json',
    },
    {
      topic: 'APP_UNINSTALLED',
      address: `${process.env.HOST}/api/webhooks/app-uninstalled`,
      format: 'json',
    },
  ];

  const results = [] as Array<{ topic: string; success: boolean; data?: unknown; error?: unknown }>;

  for (const webhook of webhooks) {
    try {
      const response = await fetch(`https://${shopDomain}/admin/api/${apiVersion}/webhooks.json`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({ webhook }),
      });

      const data = await response.json().catch(() => null);
      results.push({ topic: webhook.topic, success: response.ok, data });
    } catch (error) {
      results.push({ topic: webhook.topic, success: false, error });
    }
  }

  return results;
}
