'use client';

import { useState } from 'react';

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

function toCsv(arr: string[]) {
  return (arr || []).join(',');
}

function fromCsv(v: string) {
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function SettingsForm({
  initial,
  authFetch,
}: {
  initial: Settings;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(initial.enabled);
  const [blockedProductSkus, setBlockedProductSkus] = useState(toCsv(initial.blockedProductSkus));
  const [blockedProductIds, setBlockedProductIds] = useState(toCsv(initial.blockedProductIds));
  const [blockedCustomerEmails, setBlockedCustomerEmails] = useState(toCsv(initial.blockedCustomerEmails));
  const [blockedCustomerIds, setBlockedCustomerIds] = useState(toCsv(initial.blockedCustomerIds));
  const [maxCodOrderAmount, setMaxCodOrderAmount] = useState(initial.maxCodOrderAmount ?? '');
  const [minSuccessfulPrepaidOrders, setMinSuccessfulPrepaidOrders] = useState(initial.minSuccessfulPrepaidOrders ?? '');
  const [maxCodOrdersPerCustomer, setMaxCodOrdersPerCustomer] = useState(initial.maxCodOrdersPerCustomer ?? '');
  const [allowedPincodes, setAllowedPincodes] = useState(toCsv(initial.allowedPincodes));
  const [blockedPincodes, setBlockedPincodes] = useState(toCsv(initial.blockedPincodes));

  const [messageProductBlock, setMessageProductBlock] = useState(initial.messageProductBlock);
  const [messageCustomerBlock, setMessageCustomerBlock] = useState(initial.messageCustomerBlock);
  const [messageOrderAmountLimit, setMessageOrderAmountLimit] = useState(initial.messageOrderAmountLimit);
  const [messagePincodeBlock, setMessagePincodeBlock] = useState(initial.messagePincodeBlock);
  const [messageGeneric, setMessageGeneric] = useState(initial.messageGeneric);
  const [cancelReason, setCancelReason] = useState(initial.cancelReason);
  const [tagOnCancel, setTagOnCancel] = useState(initial.tagOnCancel ?? '');

  async function onSave() {
    setSaving(true);
    setError(null);
    setOk(null);

    try {
      const res = await authFetch('/api/cod-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          blockedProductSkus: fromCsv(blockedProductSkus),
          blockedProductIds: fromCsv(blockedProductIds),
          blockedCustomerEmails: fromCsv(blockedCustomerEmails),
          blockedCustomerIds: fromCsv(blockedCustomerIds),
          maxCodOrderAmount: maxCodOrderAmount === '' ? null : Number(maxCodOrderAmount),
          minSuccessfulPrepaidOrders: minSuccessfulPrepaidOrders === '' ? null : Number(minSuccessfulPrepaidOrders),
          maxCodOrdersPerCustomer: maxCodOrdersPerCustomer === '' ? null : Number(maxCodOrdersPerCustomer),
          allowedPincodes: fromCsv(allowedPincodes),
          blockedPincodes: fromCsv(blockedPincodes),
          messageProductBlock,
          messageCustomerBlock,
          messageOrderAmountLimit,
          messagePincodeBlock,
          messageGeneric,
          cancelReason,
          tagOnCancel: tagOnCancel.trim() ? tagOnCancel.trim() : null,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Save failed: ${res.status}`);
      }

      setOk('Saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
          Enable COD rules enforcement
        </label>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{ marginLeft: 'auto', padding: '8px 12px', borderRadius: 8, border: '1px solid #111' }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {error ? <div style={{ marginTop: 12, color: '#b91c1c' }}>{error}</div> : null}
      {ok ? <div style={{ marginTop: 12, color: '#15803d' }}>{ok}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <Field label="Blocked Product SKUs (comma separated)" value={blockedProductSkus} onChange={setBlockedProductSkus} />
        <Field label="Blocked Product IDs (comma separated)" value={blockedProductIds} onChange={setBlockedProductIds} />
        <Field label="Blocked Customer Emails (comma separated)" value={blockedCustomerEmails} onChange={setBlockedCustomerEmails} />
        <Field label="Blocked Customer IDs (comma separated)" value={blockedCustomerIds} onChange={setBlockedCustomerIds} />
        <Field label="Max COD Order Amount" value={String(maxCodOrderAmount)} onChange={setMaxCodOrderAmount} />
        <Field label="Min Successful Prepaid Orders" value={String(minSuccessfulPrepaidOrders)} onChange={setMinSuccessfulPrepaidOrders} />
        <Field label="Max COD Orders Per Customer" value={String(maxCodOrdersPerCustomer)} onChange={setMaxCodOrdersPerCustomer} />
        <Field label="Allowed Pincodes (comma separated)" value={allowedPincodes} onChange={setAllowedPincodes} />
        <Field label="Blocked Pincodes (comma separated)" value={blockedPincodes} onChange={setBlockedPincodes} />
        <Field label="Tag on Cancel (optional)" value={tagOnCancel} onChange={setTagOnCancel} />
        <Field label="Cancel Reason" value={cancelReason} onChange={setCancelReason} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
        <Field label="Message: Product Block" value={messageProductBlock} onChange={setMessageProductBlock} />
        <Field label="Message: Customer Block" value={messageCustomerBlock} onChange={setMessageCustomerBlock} />
        <Field label="Message: Order Amount Limit" value={messageOrderAmountLimit} onChange={setMessageOrderAmountLimit} />
        <Field label="Message: Pincode Block" value={messagePincodeBlock} onChange={setMessagePincodeBlock} />
        <Field label="Message: Generic" value={messageGeneric} onChange={setMessageGeneric} />
      </div>

      <p style={{ marginTop: 16, color: '#444' }}>
        Enforcement runs on the <code>orders/create</code> webhook. If a COD order violates rules, the app cancels it.
      </p>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, color: '#111' }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
      />
    </label>
  );
}
