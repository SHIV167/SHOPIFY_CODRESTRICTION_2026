'use client';

import { useEffect, useMemo, useState } from 'react';

export default function EmbeddedApp() {
  const [shop, setShop] = useState<string | null>(null);
  const [host, setHost] = useState<string | null>(null);

  const authUrl = useMemo(() => {
    if (!shop) return null;
    return `/api/shopify/auth?shop=${encodeURIComponent(shop)}`;
  }, [shop]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shopParam = params.get('shop');
    const hostParam = params.get('host');

    if (hostParam) {
      setHost(hostParam);
      try {
        localStorage.setItem('shopifyHost', hostParam);
      } catch {
        // ignore
      }
    } else {
      try {
        const storedHost = localStorage.getItem('shopifyHost');
        if (storedHost) setHost(storedHost);
      } catch {
        // ignore
      }
    }

    if (shopParam) {
      setShop(shopParam);
      return;
    }

    if (hostParam) {
      try {
        const decoded = atob(hostParam);
        const hostParts = decoded.split('/');
        const maybeShop = hostParts[hostParts.length - 1];
        if (maybeShop) setShop(maybeShop);
      } catch {
        // ignore
      }
    }
  }, []);

  const adminUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (shop) p.set('shop', shop);
    if (host) p.set('host', host);
    const qs = p.toString();
    return qs ? `/admin?${qs}` : '/admin';
  }, [shop, host]);

  useEffect(() => {
    if (!authUrl) return;

    const isEmbedded = window.top !== window.self;
    if (!isEmbedded) return;

    try {
      window.top!.location.href = authUrl;
    } catch {
      window.location.href = authUrl;
    }
  }, [authUrl]);

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 680, width: '100%', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 650, margin: 0 }}>Embedded App</h1>
        <p style={{ marginTop: 8, color: '#4b5563' }}>
          Open this inside Shopify Admin (embedded). The app will request a session token and authorize API calls.
        </p>

        <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a
            href={adminUrl}
            style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: 8, border: '1px solid #111', background: '#111', color: '#fff', textDecoration: 'none' }}
          >
            Open Admin
          </a>
          <a
            href={authUrl || '/install'}
            style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: 8, border: '1px solid #111', background: '#fff', color: '#111', textDecoration: 'none' }}
          >
            {shop ? 'Continue OAuth' : 'Install'}
          </a>
        </div>
      </div>
    </div>
  );
}
