# COD Restrictions Shopify App

COD Restrictions is a Shopify app that enforces Cash on Delivery (COD) rules by handling the `orders/create` webhook.

When a COD order violates your configured rules, the app automatically cancels the order (and optionally tags it and adds a note).

## Features

- **Embedded admin UI** to configure COD rules.
- **Rule engine** that evaluates:
  - Blocked product IDs
  - Blocked SKUs
  - Blocked customer IDs
  - Blocked customer emails
  - Allowed pincodes / blocked pincodes
  - Max COD order amount
  - Min successful prepaid orders (per customer email)
  - Max COD orders per customer (per customer email)
- **Automatic enforcement** via `orders/create` webhook.
- **Decision logging** (stores each decision and reasons in the DB).

## Tech stack

- Next.js (App Router)
- Prisma + PostgreSQL
- `@shopify/shopify-api` for REST/GraphQL calls
- Shopify embedded app auth for API calls in the admin UI using App Bridge session tokens

## Project structure

- `src/app/install`
  - Install screen (enter `your-store.myshopify.com`)
- `src/app/api/shopify/*`
  - OAuth endpoints (`/api/shopify/auth` and `/api/shopify/callback`)
- `src/app/embed`
  - Embedded landing page (used after OAuth so Shopify Admin can pass `host`)
- `src/app/admin`
  - Embedded admin config UI
- `src/app/api/webhooks/orders-create`
  - COD enforcement webhook
- `src/app/api/webhooks/app-uninstalled`
  - Uninstall webhook
- `src/app/api/cod-settings`
  - Load / update COD settings for the embedded admin
- `src/lib/cod-rules.ts`
  - COD rule evaluation
- `prisma/schema.prisma`
  - DB schema (Shop, CodSettings, CodDecisionLog)

## Setup (local)

1. Install dependencies

```bash
npm install
```

2. Configure environment

```bash
cp .env.example .env
```

Fill in at least:

- `HOST` (your public URL; use ngrok / Cloudflare tunnel for local testing)
- `SHOPIFY_API_KEY`
- `NEXT_PUBLIC_SHOPIFY_API_KEY` (same value as `SHOPIFY_API_KEY`)
- `SHOPIFY_API_SECRET`
- `SHOPIFY_SCOPES`
- `DATABASE_URL`
- `JWT_SECRET`

3. Setup database

```bash
npx prisma generate
npx prisma db push
```

4. Run dev server

```bash
npm run dev
```

## Shopify Partner Dashboard configuration

In your app settings:

- **App URL**
  - `https://YOUR_HOST/`
- **Allowed redirection URL(s)**
  - `https://YOUR_HOST/api/shopify/callback`

After installing, Shopify will load the embedded page:

- `https://YOUR_HOST/embed?shop=...&host=...`

## Required API scopes

This app needs:

- `read_orders`
- `write_orders`
- `read_customers`
- `read_products`

Make sure your `SHOPIFY_SCOPES` env var matches what you configured in the Partner Dashboard.

## Webhooks

This app registers webhooks after OAuth:

- `ORDERS_CREATE` -> `POST /api/webhooks/orders-create`
- `APP_UNINSTALLED` -> `POST /api/webhooks/app-uninstalled`

Webhook security:

- The handler verifies `x-shopify-hmac-sha256` using `SHOPIFY_API_SECRET` (or `SHOPIFY_WEBHOOK_SECRET` if set).

## How enforcement works

On each `orders/create` event:

1. The webhook validates HMAC.
2. The app checks whether the order is COD (`payment_gateway_names` contains `cash` / `cod`).
3. If COD:
   - Loads `CodSettings` for the shop
   - Evaluates all configured rules
4. The app writes a row to `CodDecisionLog` with `allowed=false` and the reason codes.
5. If blocked:
   - Cancels the order using GraphQL `orderCancel`
   - Optionally tags and notes the order using REST (if `tagOnCancel` is set)

## Reason codes

The rule engine can return these reason codes:

- `cod_disabled`
- `max_order_amount`
- `blocked_customer_email`
- `blocked_customer_id`
- `blocked_product_id`
- `blocked_sku`
- `pincode_not_allowed`
- `pincode_blocked`
- `min_prepaid_orders`
- `max_cod_orders`

## Troubleshooting

- **Admin shows "Unauthorized"**
  - Open the app from **Shopify Admin** (embedded) so App Bridge can generate a session token.
- **Webhook not firing**
  - Your `HOST` must be publicly reachable.
  - Confirm webhooks are registered (Shopify Admin -> Settings -> Notifications/Webhooks).
- **Orders not cancelled**
  - Confirm the store granted the required scopes.
  - Check `CodDecisionLog` and the webhook response logs.

## Theme customization (optional)

This app enforces COD at the **order level** using the `orders/create` webhook.

If you also want to hide/disable COD at checkout or show custom messaging earlier in the storefront, you may need theme customization.

Reference theme export:

- `theme_export__store-2024-dev/`

Typical approaches:

- Add messaging / UI hints on product/cart pages
- Disable COD selection for certain pincodes or products (depending on your checkout/customization capabilities)

Theme changes are store/theme-specific; keep them separate from the app code.
# SHOPIFY_CODRESTRICTION_2026
