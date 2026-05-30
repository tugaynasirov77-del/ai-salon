import { ImageResponse } from 'next/og';
import { FLAME_PATH } from './flame-path';

export const runtime = 'edge';
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
          background: '#14100A',
        }}
      >
        <svg width="24" height="24" viewBox="0 0 1024 1024" fill="none">
          <path d={FLAME_PATH} fill="#CD9842" fillRule="evenodd" clipRule="evenodd" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
