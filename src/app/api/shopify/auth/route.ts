import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { buildAuthUrl, createState, normalizeShopDomain } from '@/lib/shopify-oauth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawShop = searchParams.get('shop');

  if (!rawShop) {
    const host = process.env.HOST || '';
    return NextResponse.redirect(new URL('/install', host));
  }

  const shop = normalizeShopDomain(rawShop);
  if (!shop) {
    const host = process.env.HOST || '';
    return NextResponse.redirect(new URL('/install?error=invalid_shop', host));
  }

  const state = createState();
  cookies().set('cod_oauth_state', state, {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
  });

  const authUrl = buildAuthUrl(shop, state);
  return NextResponse.redirect(authUrl);
}
