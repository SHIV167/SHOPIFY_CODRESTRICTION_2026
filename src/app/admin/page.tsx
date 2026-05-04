'use client';

import { useEffect, useState } from 'react';
import createApp from '@shopify/app-bridge';
import { getSessionToken } from '@shopify/app-bridge-utils';
import SettingsForm from './settings-form';

type Settings = {
  id: string;
  enabled: boolean;
  blockedProductSkus: string[];
  blockedProductIds: string[];
  blockedCustomerEmails: string[];
  blockedCustomerIds: string[];
  maxCodOrderAmount: number | null;
  minSuccessfulPrepaidOrders: number | null;
  maxCodOrdersPerCustomer: number | null;
  allowedPincodes: string[];
  blockedPincodes: string[];
  messageProductBlock: string;
  messageCustomerBlock: string;
  messageOrderAmountLimit: string;
  messagePincodeBlock: string;
  messageGeneric: string;
  cancelReason: string;
  tagOnCancel: string | null;
};

export default function AdminPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);

  async function getToken() {
    const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
    const params = new URLSearchParams(window.location.search);
    let host = params.get('host');

    if (!host) {
      try {
        host = localStorage.getItem('shopifyHost');
      } catch {
        // ignore
      }
    }

    if (!apiKey || !host) return null;

    const app = createApp({
      apiKey,
      host,
      forceRedirect: true,
    });

    return getSessionToken(app);
  }

  async function authFetch(input: RequestInfo | URL, init?: RequestInit) {
    const token = await getToken();
    if (!token) {
      setUnauthorized(true);
      throw new Error('Unauthorized');
    }

    const headers = new Headers(init?.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers });
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch('/api/cod-settings');
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Failed to load: ${res.status}`);
        }
        const data = (await res.json()) as Settings;
        setSettings(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 980 }}>
      <h1>COD Restrictions</h1>

      {unauthorized ? (
        <div style={{ marginTop: 12, padding: 12, border: '1px solid #f59e0b', background: '#fffbeb' }}>
          Unauthorized. Open this page from Shopify Admin (embedded) so the app can request a session token.
        </div>
      ) : null}

      {loading ? <p style={{ marginTop: 12 }}>Loading…</p> : null}
      {error ? <p style={{ marginTop: 12, color: '#b91c1c' }}>{error}</p> : null}

      {!loading && settings ? (
        <div style={{ marginTop: 16 }}>
          <SettingsForm initial={settings} authFetch={authFetch} />
        </div>
      ) : null}
    </main>
  );
}
