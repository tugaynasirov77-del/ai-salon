import { cn } from '@/lib/utils';

interface ChannelInfo {
  key: string;
  label: string;
  ok: boolean;
}

// Только каналы которые мы реально предлагаем клиентам:
// Telegram, Авито, YClients (CRM), веб-чат на сайт. MAX/VK/SMS убраны из UI.
const DEFAULT_CHANNELS: ChannelInfo[] = [
  { key: 'TG', label: 'Telegram', ok: true },
  { key: 'AV', label: 'Авито', ok: false },
  { key: 'YC', label: 'YClients', ok: false },
  { key: 'WEB', label: 'Веб-чат', ok: true },
];

export function ChannelStatus({ channels = DEFAULT_CHANNELS }: { channels?: ChannelInfo[] }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase text-slate-400">Каналы</div>
      <div className="grid grid-cols-2 gap-1.5">
        {channels.map((c) => (
          <div
            key={c.key}
            className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400"
            title={c.ok ? 'Работает' : 'Не подключён'}
          >
            <span className={cn('h-2 w-2 rounded-full', c.ok ? 'bg-green-500' : 'bg-red-500')} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}
