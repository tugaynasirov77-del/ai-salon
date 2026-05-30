import { ImageResponse } from 'next/og';
import { FLAME_PATH } from './flame-path';

export const runtime = 'edge';
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
          background: '#14100A',
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(205,152,66,0.40) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(172,104,36,0.35) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(228,188,116,0.20) 0%, transparent 60%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="88" height="88" viewBox="0 0 1024 1024" fill="none">
            <path d={FLAME_PATH} fill="#9CA0A8" fillRule="evenodd" clipRule="evenodd" />
          </svg>
          <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, letterSpacing: -1 }}>
            Liva<span style={{ color: '#9CA0A8' }}>&nbsp;ai</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 96,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1.05,
              backgroundImage: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.6) 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            <div style={{ display: 'flex' }}>ИИ-администратор,</div>
            <div style={{ display: 'flex' }}>
              который&nbsp;
              <span
                style={{
                  backgroundImage: 'linear-gradient(90deg, #ECD09A 0%, #CD9842 55%, #AC6824 100%)',
                  backgroundClip: 'text',
                  color: 'transparent',
                }}
              >
                не спит
              </span>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              fontSize: 32,
              color: 'rgba(255,255,255,0.7)',
              lineHeight: 1.3,
            }}
          >
            <div style={{ display: 'flex' }}>
              AI-администратор для салонов, барбершопов, СТО и других нишевых бизнесов.
            </div>
            <div style={{ display: 'flex' }}>
              Отвечает 24/7 в Telegram, Авито, YClients и веб-чате.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)' }}>ailiva.ru</div>
          <div
            style={{
              padding: '14px 32px',
              borderRadius: 16,
              background: 'linear-gradient(90deg, #E4BC74 0%, #CD9842 50%, #AC6824 100%)',
              fontSize: 28,
              fontWeight: 600,
              color: '#1a1206',
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
