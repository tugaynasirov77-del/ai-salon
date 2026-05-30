export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-6">
      <h1 className="bg-gradient-to-b from-[#181B22] to-slate-700 bg-clip-text text-2xl font-semibold tracking-tight text-transparent dark:from-white dark:to-white/70">
        {title}
      </h1>
      {description && (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      )}
    </header>
  );
}
