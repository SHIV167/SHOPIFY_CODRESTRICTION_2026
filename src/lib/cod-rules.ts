import prisma from './prisma';
import { getShopifyClient } from './shopify';

export type CodEvaluation = {
  isCod: boolean;
  allowed: boolean;
  reasons: string[];
};

type ShopifyOrder = {
  id: number;
  name?: string;
  total_price: string;
  payment_gateway_names?: string[];
  financial_status?: string;
  cancelled_at?: string | null;
  email?: string | null;
  customer?: { id?: number | null; email?: string | null } | null;
  line_items?: Array<{ sku?: string | null; product_id?: number | null }>;
  shipping_address?: { zip?: string | null } | null;
};

function normalizeStr(v: string | null | undefined) {
  return (v || '').trim();
}

function includesAny(haystack: string[], needles: string[]) {
  const set = new Set(haystack.map((s) => s.toLowerCase()));
  return needles.some((n) => set.has(n.toLowerCase()));
}

export function isCodOrder(order: ShopifyOrder) {
  const gateways = order.payment_gateway_names || [];
  return gateways.some((g) => g.toLowerCase().includes('cash') || g.toLowerCase().includes('cod'));
}

export async function evaluateCodRules(shopDomain: string, order: ShopifyOrder): Promise<CodEvaluation> {
  const isCod = isCodOrder(order);
  if (!isCod) return { isCod, allowed: true, reasons: [] };

  const shop = await prisma.shop.findUnique({
    where: { shopifyDomain: shopDomain },
    include: { codSettings: true },
  });

  const settings = shop?.codSettings;
  if (!shop || !settings || !settings.enabled) {
    return { isCod, allowed: false, reasons: ['cod_disabled'] };
  }

  const reasons: string[] = [];

  const total = Math.round(parseFloat(order.total_price || '0'));
  if (settings.maxCodOrderAmount != null && total > settings.maxCodOrderAmount) {
    reasons.push('max_order_amount');
  }

  const email = normalizeStr(order.email ?? order.customer?.email ?? undefined).toLowerCase();
  if (email && settings.blockedCustomerEmails.map((e) => e.toLowerCase()).includes(email)) {
    reasons.push('blocked_customer_email');
  }

  const customerId = order.customer?.id != null ? String(order.customer.id) : '';
  if (customerId && settings.blockedCustomerIds.includes(customerId)) {
    reasons.push('blocked_customer_id');
  }

  const productIds = (order.line_items || [])
    .map((li) => (li.product_id != null ? String(li.product_id) : ''))
    .filter(Boolean);
  if (productIds.length && includesAny(productIds, settings.blockedProductIds)) {
    reasons.push('blocked_product_id');
  }

  const skus = (order.line_items || [])
    .map((li) => normalizeStr(li.sku ?? undefined))
    .filter(Boolean);
  if (skus.length && includesAny(skus, settings.blockedProductSkus)) {
    reasons.push('blocked_sku');
  }

  const pincode = normalizeStr(order.shipping_address?.zip ?? undefined);
  if (pincode) {
    if (settings.allowedPincodes.length > 0 && !settings.allowedPincodes.includes(pincode)) {
      reasons.push('pincode_not_allowed');
    }
    if (settings.blockedPincodes.includes(pincode)) {
      reasons.push('pincode_blocked');
    }
  }

  if ((settings.minSuccessfulPrepaidOrders != null && settings.minSuccessfulPrepaidOrders > 0) ||
      (settings.maxCodOrdersPerCustomer != null && settings.maxCodOrdersPerCustomer > 0)) {
    if (email) {
      const { rest } = await getShopifyClient(shopDomain);
      const resp = await rest.get({
        path: 'orders',
        query: {
          email,
          status: 'any',
          limit: 250,
          fields: 'id,financial_status,cancelled_at,payment_gateway_names',
        },
      });

      const body = resp.body as unknown as {
        orders?: Array<{
          id: number;
          financial_status?: string;
          cancelled_at?: string | null;
          payment_gateway_names?: string[];
        }>;
      };

      const orders = (body.orders || []) as Array<{
        id: number;
        financial_status?: string;
        cancelled_at?: string | null;
        payment_gateway_names?: string[];
      }>;

      const successfulPrepaid = orders.filter((o) => {
        if (o.cancelled_at) return false;
        const fs = (o.financial_status || '').toLowerCase();
        const paid = fs === 'paid' || fs === 'partially_paid';
        if (!paid) return false;
        const gateways = o.payment_gateway_names || [];
        const isCod = gateways.some((g) => g.toLowerCase().includes('cash') || g.toLowerCase().includes('cod'));
        return !isCod;
      }).length;

      if (settings.minSuccessfulPrepaidOrders != null && successfulPrepaid < settings.minSuccessfulPrepaidOrders) {
        reasons.push('min_prepaid_orders');
      }

      const codOrdersCount = orders.filter((o) => {
        if (o.cancelled_at) return false;
        const gateways = o.payment_gateway_names || [];
        return gateways.some((g) => g.toLowerCase().includes('cash') || g.toLowerCase().includes('cod'));
      }).length;

      if (settings.maxCodOrdersPerCustomer != null && codOrdersCount > settings.maxCodOrdersPerCustomer) {
        reasons.push('max_cod_orders');
      }
    } else {
      if (settings.minSuccessfulPrepaidOrders != null && settings.minSuccessfulPrepaidOrders > 0) {
        reasons.push('min_prepaid_orders');
      }
      if (settings.maxCodOrdersPerCustomer != null && settings.maxCodOrdersPerCustomer > 0) {
        reasons.push('max_cod_orders');
      }
    }
  }

  return { isCod, allowed: reasons.length === 0, reasons };
}
