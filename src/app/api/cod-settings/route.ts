import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getShopFromSession } from '@/lib/session';
import { getShopDomainFromSessionToken } from '@/lib/shopify-session-token';

export const dynamic = 'force-dynamic';

async function getShopFromAuth(req: NextRequest) {
  const tokenShop = await getShopDomainFromSessionToken(req).catch(() => null);
  return tokenShop || getShopFromSession();
}

export async function GET(req: NextRequest) {
  const shop = await getShopFromAuth(req);
  if (!shop) return new NextResponse('Unauthorized', { status: 401 });

  const record = await prisma.shop.findUnique({
    where: { shopifyDomain: shop },
    include: { codSettings: true },
  });

  if (!record?.codSettings) return new NextResponse('Not found', { status: 404 });

  return NextResponse.json(record.codSettings);
}

export async function PUT(req: NextRequest) {
  const shop = await getShopFromAuth(req);
  if (!shop) return new NextResponse('Unauthorized', { status: 401 });

  const body = await req.json();

  const record = await prisma.shop.findUnique({
    where: { shopifyDomain: shop },
    include: { codSettings: true },
  });

  if (!record?.codSettings?.id) return new NextResponse('Not found', { status: 404 });

  const updated = await prisma.codSettings.update({
    where: { id: record.codSettings.id },
    data: {
      enabled: Boolean(body.enabled),
      blockedProductSkus: Array.isArray(body.blockedProductSkus) ? body.blockedProductSkus : [],
      blockedProductIds: Array.isArray(body.blockedProductIds) ? body.blockedProductIds : [],
      blockedCustomerEmails: Array.isArray(body.blockedCustomerEmails) ? body.blockedCustomerEmails : [],
      blockedCustomerIds: Array.isArray(body.blockedCustomerIds) ? body.blockedCustomerIds : [],
      maxCodOrderAmount: body.maxCodOrderAmount == null ? null : Number(body.maxCodOrderAmount),
      minSuccessfulPrepaidOrders: body.minSuccessfulPrepaidOrders == null ? null : Number(body.minSuccessfulPrepaidOrders),
      maxCodOrdersPerCustomer: body.maxCodOrdersPerCustomer == null ? null : Number(body.maxCodOrdersPerCustomer),
      allowedPincodes: Array.isArray(body.allowedPincodes) ? body.allowedPincodes : [],
      blockedPincodes: Array.isArray(body.blockedPincodes) ? body.blockedPincodes : [],
      messageProductBlock: String(body.messageProductBlock || 'COD Not Available'),
      messageCustomerBlock: String(body.messageCustomerBlock || 'COD Not Available'),
      messageOrderAmountLimit: String(body.messageOrderAmountLimit || 'COD Available Only'),
      messagePincodeBlock: String(body.messagePincodeBlock || 'COD Not Available'),
      messageGeneric: String(body.messageGeneric || 'Please Make Prepaid Payment'),
      cancelReason: String(body.cancelReason || 'customer'),
      tagOnCancel: body.tagOnCancel ? String(body.tagOnCancel) : null,
    },
  });

  return NextResponse.json(updated);
}
