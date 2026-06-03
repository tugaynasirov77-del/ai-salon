export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-8 border-b border-white/[0.08] pb-6">
      <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
        Liva ai · Админка
      </div>
      <h1 className="font-bebas mt-2 text-[2rem] uppercase leading-[1] tracking-[0.04em] text-white sm:text-[2.5rem]">
        {title}
      </h1>
      {description && (
        <p className="mt-3 max-w-2xl text-sm text-white/55">{description}</p>
      )}
    </header>
  );
}
