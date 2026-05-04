export default function InstallPage({ searchParams }: { searchParams?: { error?: string; details?: string } }) {
  const error = searchParams?.error;
  const details = searchParams?.details;

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 720 }}>
      <h1>COD Restrictions</h1>
      <p>Enter your Shopify store domain to install the app.</p>

      {error ? (
        <div style={{ padding: 12, border: '1px solid #fca5a5', background: '#fef2f2', margin: '12px 0' }}>
          <div><strong>Error:</strong> {error}</div>
          {details ? <div style={{ marginTop: 8 }}>{details}</div> : null}
        </div>
      ) : null}

      <form method="GET" action="/api/shopify/auth" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          name="shop"
          placeholder="your-store.myshopify.com"
          style={{ flex: 1, padding: 10, border: '1px solid #ddd', borderRadius: 6 }}
          required
        />
        <button type="submit" style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #111' }}>
          Install
        </button>
      </form>
    </main>
  );
}
