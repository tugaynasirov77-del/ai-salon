'use client';

// global-error.tsx — последний рубеж, ловит ошибки в root layout.
// Должен сам рендерить <html> и <body>, поскольку перехватывает их падение.

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ maxWidth: 480, padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600, color: '#0f172a' }}>Критическая ошибка</h2>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#475569' }}>
              Приложение упало. Попробуйте перезагрузить страницу.
            </p>
            {error?.digest && (
              <div style={{ marginBottom: 16, fontSize: 11, color: '#94a3b8' }}>ID: {error.digest}</div>
            )}
            <button
              onClick={() => reset()}
              style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 0, borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
            >
              Перезагрузить
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
