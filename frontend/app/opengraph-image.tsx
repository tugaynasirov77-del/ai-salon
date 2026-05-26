import { ImageResponse } from 'next/og';

export const alt = 'Liva ai — AI-администратор для малого бизнеса';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 80,
          background: '#0f0a1f',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(99,102,241,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(236,72,153,0.35) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(139,92,246,0.25) 0%, transparent 60%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 55%, #EC4899 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="56" height="56" viewBox="0 0 40 40" fill="none">
              <path d="M11 13 C11 11, 12.5 9.5, 14.5 9.5 L20 9.5 C20 14, 17 17, 14 17 L13 17 L13 21 L11 21 Z" fill="white" fillOpacity="0.94" />
              <path d="M29 27 C29 29, 27.5 30.5, 25.5 30.5 L20 30.5 C20 26, 23 23, 26 23 L27 23 L27 19 L29 19 Z" fill="white" fillOpacity="0.85" />
              <circle cx="20" cy="20" r="2.4" fill="white" />
              <g transform="translate(30 9)">
                <path d="M0 -3 L0.7 -0.7 L3 0 L0.7 0.7 L0 3 L-0.7 0.7 L-3 0 L-0.7 -0.7 Z" fill="white" />
              </g>
            </svg>
          </div>
          <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>
            Liva<span style={{ opacity: 0.6 }}> ai</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1.05,
              backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Бот, который записывает
            <br />
            клиентов{' '}
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg, #818CF8 0%, #C084FC 50%, #F472B6 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              за вас
            </span>
          </div>
          <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.7)', lineHeight: 1.3 }}>
            AI-администратор для салонов, барбершопов, СТО и других нишевых бизнесов.
            <br />
            Отвечает 24/7 в Telegram, Авито, YClients и веб-чате.
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)' }}>ailiva.ru</div>
          <div
            style={{
              padding: '14px 32px',
              borderRadius: 16,
              background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
              fontSize: 28,
              fontWeight: 600,
            }}
          >
            Начать бесплатно →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
