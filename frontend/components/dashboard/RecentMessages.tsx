import { Send, MessageCircle, Phone, MessagesSquare, MailX } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { timeAgo } from '@/lib/utils';
import type { IMessage, IClient, Channel } from '@shared/types';

interface Props {
  messages: IMessage[];
  clients: IClient[];
  loading?: boolean;
}

const CHANNEL_ICON: Record<Channel, React.ComponentType<{ className?: string }>> = {
  telegram: Send,
  whatsapp: MessageCircle,
  sms: Phone,
  max: MessagesSquare,
};

const CHANNEL_COLOR: Record<Channel, string> = {
  telegram: 'text-blue-500',
  whatsapp: 'text-green-500',
  sms: 'text-slate-500',
  max: 'text-purple-500',
};

function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}

export function RecentMessages({ messages, clients, loading }: Props) {
  const items = messages.slice(0, 8);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние сообщения</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <MailX className="mb-3 h-10 w-10" />
            <div className="text-sm">Сообщений пока нет</div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((m) => {
              const client = clients.find((c) => c.id === m.clientId);
              const Icon = CHANNEL_ICON[m.channel];
              return (
                <li key={m.id} className="flex gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {initials(client?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {client?.name || 'Без имени'}
                        </span>
                        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${CHANNEL_COLOR[m.channel]}`} />
                      </div>
                      <span className="flex-shrink-0 text-xs text-slate-400">{timeAgo(m.createdAt)}</span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {truncate(m.text, 50)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
