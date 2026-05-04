import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyWebhook, getShopifyClient } from '@/lib/shopify';
import { evaluateCodRules } from '@/lib/cod-rules';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const shopDomain = req.headers.get('x-shopify-shop-domain') || '';
  const hmac = req.headers.get('x-shopify-hmac-sha256') || '';

  const secret = process.env.SHOPIFY_API_SECRET || process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return new NextResponse('Missing webhook secret', { status: 500 });

  const rawBody = await req.text();
  const ok = await verifyWebhook(rawBody, hmac, secret);
  if (!ok) return new NextResponse('Invalid webhook signature', { status: 401 });

  const order = JSON.parse(rawBody);

  const evaluation = await evaluateCodRules(shopDomain, order);

  await prisma.codDecisionLog.create({
    data: {
      shopDomain,
      orderId: String(order.id),
      orderName: order.name ? String(order.name) : null,
      isCod: evaluation.isCod,
      allowed: evaluation.allowed,
      reasons: evaluation.reasons,
    },
  });

  if (!evaluation.isCod || evaluation.allowed) {
    return NextResponse.json({ ok: true, action: 'allow' });
  }

  const shop = await prisma.shop.findUnique({
    where: { shopifyDomain: shopDomain },
    include: { codSettings: true },
  });

  const tag = shop?.codSettings?.tagOnCancel ? String(shop.codSettings.tagOnCancel) : null;
  const cancelReason = shop?.codSettings?.cancelReason ? String(shop.codSettings.cancelReason) : 'customer';

  const { graphql, rest } = await getShopifyClient(shopDomain);

  const gid = `gid://shopify/Order/${order.id}`;

  const mutation = `mutation Cancel($id: ID!, $reason: OrderCancelReason!, $notify: Boolean!, $refund: Boolean!) {
    orderCancel(orderId: $id, reason: $reason, notifyCustomer: $notify, refund: $refund) {
      job { id }
      userErrors { field message }
    }
  }`;

  const resp = await graphql.query({
    data: {
      query: mutation,
      variables: {
        id: gid,
        reason: cancelReason.toUpperCase(),
        notify: false,
        refund: false,
      },
    },
  });

  const respBody = resp.body as unknown as {
    data?: { orderCancel?: { userErrors?: Array<{ field?: string[]; message: string }> } };
  };
  const userErrors = respBody?.data?.orderCancel?.userErrors || [];
  if (Array.isArray(userErrors) && userErrors.length) {
    return NextResponse.json({ ok: false, action: 'cancel_failed', userErrors }, { status: 500 });
  }

  if (tag) {
    try {
      const currentTags = Array.isArray(order.tags) ? order.tags : String(order.tags || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      const merged = Array.from(new Set([...currentTags, tag])).join(', ');
      await rest.put({
        path: `orders/${order.id}`,
        data: { order: { id: order.id, tags: merged, note: `COD blocked: ${evaluation.reasons.join('|')}` } },
        type: 'application/json',
      });
    } catch {
      // ignore tagging errors
    }
  }

  return NextResponse.json({ ok: true, action: 'cancelled', reasons: evaluation.reasons });
}
