/**
 * Liva ai — фирменный логотип.
 *
 * Геометрия: две пересекающиеся скруглённые формы образуют «канал диалога»
 * между AI и клиентом. В точке пересечения — узел (AI). Сверху — тонкая
 * звёздочка-искра, намёк на «AI inside». Градиент indigo → violet → pink.
 */

export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="liva-grad-main" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="55%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
        <linearGradient id="liva-grad-soft" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#A5B4FC" />
          <stop offset="100%" stopColor="#F0ABFC" />
        </linearGradient>
        <radialGradient id="liva-spark" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Подложка squircle */}
      <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#liva-grad-main)" />

      {/* Левая форма — клиент */}
      <path
        d="M11 13 C11 11, 12.5 9.5, 14.5 9.5 L20 9.5 C20 14, 17 17, 14 17 L13 17 L13 21 L11 21 Z"
        fill="white"
        fillOpacity="0.94"
      />

      {/* Правая форма — AI */}
      <path
        d="M29 27 C29 29, 27.5 30.5, 25.5 30.5 L20 30.5 C20 26, 23 23, 26 23 L27 23 L27 19 L29 19 Z"
        fill="white"
        fillOpacity="0.85"
      />

      {/* Связь — узел между сторонами */}
      <circle cx="20" cy="20" r="2.4" fill="white" />
      <circle cx="20" cy="20" r="4.5" fill="url(#liva-spark)" opacity="0.55" />

      {/* AI-искра в углу */}
      <g transform="translate(30 9)">
        <path d="M0 -3 L0.7 -0.7 L3 0 L0.7 0.7 L0 3 L-0.7 0.7 L-3 0 L-0.7 -0.7 Z" fill="white" />
      </g>
    </svg>
  );
}

export function Logo({
  size = 32,
  className = '',
  wordmark = true,
  variant = 'light',
}: {
  size?: number;
  className?: string;
  wordmark?: boolean;
  // 'light' = белый текст (для тёмного фона)
  // 'dark' = тёмный текст (для светлого фона)
  // 'auto' = подстраивается под dark mode через Tailwind
  variant?: 'light' | 'dark' | 'auto';
}) {
  const textColor =
    variant === 'light'
      ? 'text-white'
      : variant === 'dark'
        ? 'text-slate-900'
        : 'text-slate-900 dark:text-white';
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {wordmark && (
        <span
          className={`font-semibold tracking-tight ${textColor}`}
          style={{ fontSize: Math.round(size * 0.55) }}
        >
          Liva<span className="opacity-60"> ai</span>
        </span>
      )}
    </div>
  );
}
