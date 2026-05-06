import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getShopFromSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopParam = searchParams.get('shop');

  const sessionShop = getShopFromSession();
  if (!sessionShop) {
    return NextResponse.json({ authenticated: false });
  }

  if (shopParam && sessionShop !== shopParam) {
    return NextResponse.json({ authenticated: false });
  }

  const shop = await prisma.shop.findUnique({
    where: { shopifyDomain: sessionShop },
    select: { shopifyDomain: true, isActive: true },
  });

  if (!shop || !shop.isActive) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({ authenticated: true, shop: sessionShop });
}
