import { ImageResponse } from 'next/og';

export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 55%, #EC4899 100%)',
          position: 'relative',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
          {/* Левая форма */}
          <path
            d="M11 13 C11 11, 12.5 9.5, 14.5 9.5 L20 9.5 C20 14, 17 17, 14 17 L13 17 L13 21 L11 21 Z"
            fill="white"
            fillOpacity="0.94"
          />
          {/* Правая форма */}
          <path
            d="M29 27 C29 29, 27.5 30.5, 25.5 30.5 L20 30.5 C20 26, 23 23, 26 23 L27 23 L27 19 L29 19 Z"
            fill="white"
            fillOpacity="0.85"
          />
          {/* Узел */}
          <circle cx="20" cy="20" r="2.4" fill="white" />
          {/* AI-искра */}
          <g transform="translate(30 9)">
            <path d="M0 -3 L0.7 -0.7 L3 0 L0.7 0.7 L0 3 L-0.7 0.7 L-3 0 L-0.7 -0.7 Z" fill="white" />
          </g>
        </svg>
      </div>
    ),
    { ...size },
  );
}
