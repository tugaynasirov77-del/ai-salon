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
      <div className="mb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">Каналы</div>
      <div className="grid grid-cols-2 gap-1.5">
        {channels.map((c) => (
          <div
            key={c.key}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70"
            title={c.ok ? 'Работает' : 'Не подключён'}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full', c.ok ? 'bg-emerald-400' : 'bg-red-400')} />
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}
