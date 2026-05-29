/**
 * Liva ai — фирменный логотип (золотое пламя).
 * Иконка-пламя берётся из файла /brand/liva-flame.png (положить в frontend/public/brand/).
 * Если есть SVG — заменить путь на /brand/liva-flame.svg.
 */

const FLAME_SRC = '/brand/liva-flame.png';

export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={FLAME_SRC}
      alt=""
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: 'contain' }}
      aria-hidden="true"
    />
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
  // 'light' = светлый текст (для тёмного фона)
  // 'dark' = тёмный текст (для светлого фона)
  variant?: 'light' | 'dark' | 'auto';
}) {
  const textColor =
    variant === 'light'
      ? 'text-white'
      : variant === 'dark'
        ? 'text-[#8C5E22]'
        : 'text-[#8C5E22] dark:text-white';
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {wordmark && (
        <span
          className={`font-semibold tracking-tight ${textColor}`}
          style={{ fontSize: Math.round(size * 0.55) }}
        >
          Liva<span className="text-[#CFA049]"> ai</span>
        </span>
      )}
    </div>
  );
}
