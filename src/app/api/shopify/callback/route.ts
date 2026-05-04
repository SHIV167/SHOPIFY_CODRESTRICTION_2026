import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { exchangeCodeForAccessToken, normalizeShopDomain, verifyShopifyCallback } from '@/lib/shopify-oauth';
import { registerWebhooks } from '@/lib/shopify';
import { setShopSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const rawShop = searchParams.get('shop');
    const code = searchParams.get('code');
    const hmac = searchParams.get('hmac');
    const state = searchParams.get('state');

    const expectedState = cookies().get('cod_oauth_state')?.value;

    if (!rawShop || !code || !hmac || !state || !expectedState || state !== expectedState) {
      const host = process.env.HOST || '';
      return NextResponse.redirect(new URL('/install?error=invalid_state', host));
    }

    const shop = normalizeShopDomain(rawShop);
    if (!shop) {
      const host = process.env.HOST || '';
      return NextResponse.redirect(new URL('/install?error=invalid_shop', host));
    }

    const params: Record<string, string | null> = {
      code,
      shop: rawShop,
      state,
      timestamp: searchParams.get('timestamp'),
      host: searchParams.get('host'),
      hmac,
    };

    if (!verifyShopifyCallback(params)) {
      const host = process.env.HOST || '';
      return NextResponse.redirect(new URL('/install?error=invalid_hmac', host));
    }

    const accessToken = await exchangeCodeForAccessToken(shop, code);

    const installedShop = await prisma.shop.upsert({
      where: { shopifyDomain: shop },
      update: {
        accessToken,
        isActive: true,
      },
      create: {
        shopifyDomain: shop,
        accessToken,
        isActive: true,
        codSettings: {
          create: {
            enabled: false,
            blockedProductSkus: [],
            blockedProductIds: [],
            blockedCustomerEmails: [],
            blockedCustomerIds: [],
            allowedPincodes: [],
            blockedPincodes: [],
          },
        },
      },
    });

    await registerWebhooks(shop, accessToken).catch(() => null);

    setShopSession(installedShop.shopifyDomain);
    cookies().delete('cod_oauth_state');

    const appHost = process.env.HOST || '';
    const embeddedHost = searchParams.get('host');
    const embedUrl = new URL('/embed', appHost);
    embedUrl.searchParams.set('shop', installedShop.shopifyDomain);
    if (embeddedHost) embedUrl.searchParams.set('host', embeddedHost);
    return NextResponse.redirect(embedUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Shopify OAuth callback failed:', message);

    const host = process.env.HOST || '';
    const safeDetails = encodeURIComponent(message.slice(0, 200));
    return NextResponse.redirect(new URL(`/install?error=oauth_failed&details=${safeDetails}`, host));
  }
}
