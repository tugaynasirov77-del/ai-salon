import { ImageResponse } from 'next/og';
import { FLAME_PATH } from '../flame-path';

export const runtime = 'edge';
export const alt = 'Живое демо Liva ai — ИИ-администратор для малого бизнеса';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGDemoImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 60,
          background: '#080C14',
          backgroundImage:
            'radial-gradient(circle at 15% 25%, rgba(59,130,246,0.45) 0%, transparent 50%), radial-gradient(circle at 85% 75%, rgba(59,130,246,0.4) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(59,130,246,0.25) 0%, transparent 60%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        {/* === Top row: brand + live badge === */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <svg width="60" height="60" viewBox="0 0 1024 1024" fill="none">
              <path d={FLAME_PATH} fill="#9CA0A8" fillRule="evenodd" clipRule="evenodd" />
            </svg>
            <div
              style={{
                display: 'flex',
                fontSize: 40,
                fontWeight: 700,
                letterSpacing: -1,
              }}
            >
              Liva<span style={{ opacity: 0.6 }}>&nbsp;ai</span>
            </div>
          </div>

          {/* LIVE badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              borderRadius: 999,
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(110,231,183,0.4)',
              fontSize: 22,
              fontWeight: 600,
              color: '#6EE7B7',
              letterSpacing: 1,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: '#10B981',
              }}
            />
            ЖИВОЕ ДЕМО
          </div>
        </div>

        {/* === Headline === */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginBottom: 30,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.05,
              backgroundImage:
                'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.65) 100%)',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Слева вы клиент.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: -1.5,
              lineHeight: 1.05,
              marginTop: 6,
            }}
          >
            Справа —&nbsp;
            <span
              style={{
                display: 'flex',
                backgroundImage:
                  'linear-gradient(90deg, #C0C4CB 0%, #8A8E96 50%, #5A5E66 100%)',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              что видит владелец
            </span>
          </div>
        </div>

        {/* === Split-screen preview === */}
        <div
          style={{
            display: 'flex',
            gap: 18,
            flex: 1,
            marginBottom: 24,
          }}
        >
          {/* LEFT: chat */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(15,23,42,0.65)',
              padding: 20,
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                paddingBottom: 12,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background:
                    'linear-gradient(135deg, #8A8E96 0%, #5A5E66 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Л
              </div>
              <div style={{ display: 'flex', fontSize: 18, fontWeight: 600 }}>
                Демо-салон Liva ai
              </div>
            </div>

            {/* Bubbles */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div
                style={{
                  display: 'flex',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: 14,
                  borderBottomRightRadius: 4,
                  background:
                    'linear-gradient(135deg, #8A8E96 0%, #5A5E66 100%)',
                  fontSize: 18,
                  lineHeight: 1.3,
                }}
              >
                Сколько стоит маникюр в пятницу?
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div
                style={{
                  display: 'flex',
                  maxWidth: '85%',
                  padding: '10px 14px',
                  borderRadius: 14,
                  borderBottomLeftRadius: 4,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontSize: 18,
                  lineHeight: 1.3,
                }}
              >
                Маникюр — 1 500 ₽, в пятницу свободно в 15:00 и 17:30.
              </div>
            </div>
          </div>

          {/* RIGHT: admin */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(15,23,42,0.65)',
              padding: 20,
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingBottom: 12,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: 'rgba(248,113,113,0.6)',
                }}
              />
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: 'rgba(250,204,21,0.6)',
                }}
              />
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: 'rgba(74,222,128,0.6)',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  marginLeft: 8,
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.5)',
                }}
              >
                ailiva.ru/dashboard
              </div>
            </div>

            {/* Metrics grid */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <Metric label="ЗАПИСЕЙ" value="9" tone="emerald" />
              <Metric label="ВЫРУЧКА" value="18 800 ₽" tone="emerald" />
              <Metric label="КОНВЕРСИЯ" value="41%" tone="indigo" />
              <Metric label="СООБЩЕНИЙ" value="88" trend="+1 live" tone="fuchsia" />
            </div>
          </div>
        </div>

        {/* === Footer === */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              color: 'rgba(255,255,255,0.65)',
            }}
          >
            ailiva.ru/demo · без регистрации
          </div>
          <div
            style={{
              display: 'flex',
              padding: '14px 28px',
              borderRadius: 14,
              background:
                'linear-gradient(90deg, #8A8E96 0%, #5A5E66 50%, #5A5E66 100%)',
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            Открыть демо →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Metric({
  label,
  value,
  trend,
  tone,
}: {
  label: string;
  value: string;
  trend?: string;
  tone: 'emerald' | 'indigo' | 'fuchsia';
}) {
  const trendColor =
    tone === 'emerald'
      ? '#6EE7B7'
      : tone === 'fuchsia'
      ? '#C0C4CB'
      : '#C0C4CB';
  return (
    <div
      style={{
        flex: '1 1 calc(50% - 5px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 14px',
        borderRadius: 12,
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 11,
          letterSpacing: 1.2,
          color: 'rgba(255,255,255,0.45)',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 6,
          marginTop: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            fontWeight: 700,
            color: 'white',
          }}
        >
          {value}
        </div>
        {trend && (
          <div
            style={{
              display: 'flex',
              fontSize: 12,
              color: trendColor,
              fontWeight: 600,
            }}
          >
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
