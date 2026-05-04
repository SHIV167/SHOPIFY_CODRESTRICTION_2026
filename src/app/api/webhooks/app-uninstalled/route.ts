import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyWebhook } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const shopDomain = req.headers.get('x-shopify-shop-domain') || '';
  const hmac = req.headers.get('x-shopify-hmac-sha256') || '';

  const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return new NextResponse('Missing webhook secret', { status: 500 });

  const rawBody = await req.text();
  const ok = await verifyWebhook(rawBody, hmac, secret);
  if (!ok) return new NextResponse('Invalid webhook signature', { status: 401 });

  await prisma.shop.updateMany({
    where: { shopifyDomain: shopDomain },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
