'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Send, MessageCircle, Phone, MessagesSquare, X, MessageSquarePlus, Users as UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { fetchClients, fetchAppointments, fetchMessages } from '@/lib/api';
import { cn, timeAgo } from '@/lib/utils';
import type { IClient, IAppointment, IMessage, Channel } from '@shared/types';

const SALON_ID = 'mock-salon-1';

const CHANNEL_ICON: Record<Channel, React.ComponentType<{ className?: string }>> = {
  telegram: Send,
  whatsapp: MessageCircle,
  sms: Phone,
  max: MessagesSquare,
};
const CHANNEL_LABEL: Record<Channel, string> = {
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  max: 'MAX',
};

type ChannelFilter = 'all' | Channel;

export default function ClientsPage() {
  const clientsQ = useQuery({ queryKey: ['clients', SALON_ID], queryFn: () => fetchClients(SALON_ID) });
  const apptsQ = useQuery({ queryKey: ['appointments', SALON_ID], queryFn: () => fetchAppointments(SALON_ID) });
  const messagesQ = useQuery({ queryKey: ['messages', SALON_ID], queryFn: () => fetchMessages(SALON_ID) });

  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const clients = clientsQ.data || [];
  const appointments = apptsQ.data || [];
  const messages = messagesQ.data || [];

  // Агрегаты по клиенту: lastVisit и visitsCount считаем из appointments
  const stats = useMemo(() => {
    const map = new Map<string, { lastVisit: Date | null; visitsCount: number }>();
    for (const a of appointments) {
      const cur = map.get(a.clientId) || { lastVisit: null, visitsCount: 0 };
      cur.visitsCount += 1;
      const dt = new Date(a.datetime);
      if (!cur.lastVisit || dt > cur.lastVisit) cur.lastVisit = dt;
      map.set(a.clientId, cur);
    }
    return map;
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (channelFilter !== 'all' && c.preferredChannel !== channelFilter) return false;
      if (!q) return true;
      const name = (c.name || '').toLowerCase();
      const phone = (c.phone || '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }, [clients, search, channelFilter]);

  const selected = selectedId ? clients.find((c) => c.id === selectedId) : null;
  const selectedAppts = selected ? appointments.filter((a) => a.clientId === selected.id) : [];
  const selectedMessages = selected ? messages.filter((m) => m.clientId === selected.id) : [];

  return (
    <div>
      <PageHeader title="Клиенты" description="Все клиенты и история обращений." />

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по имени или телефону…"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            {(['all', 'telegram', 'whatsapp', 'sms'] as ChannelFilter[]).map((c) => (
              <button
                key={c}
                onClick={() => setChannelFilter(c)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  channelFilter === c
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
                )}
              >
                {c === 'all' ? 'Все' : CHANNEL_LABEL[c as Channel]}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {clientsQ.isLoading ? (
          <LoadingSpinner label="Загружаем клиентов…" />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <UsersIcon className="mb-3 h-10 w-10" />
            <div className="text-sm">
              {clients.length === 0 ? 'Клиентов пока нет' : 'По фильтру ничего не найдено'}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/50">
                <tr>
                  <th className="px-5 py-3 font-medium">Имя</th>
                  <th className="px-5 py-3 font-medium">Телефон</th>
                  <th className="px-5 py-3 font-medium">Канал</th>
                  <th className="px-5 py-3 font-medium">Последний визит</th>
                  <th className="px-5 py-3 font-medium">Всего</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((c) => {
                  const s = stats.get(c.id) || { lastVisit: null, visitsCount: 0 };
                  const Icon = CHANNEL_ICON[c.preferredChannel];
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={cn(
                        'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50',
                        selectedId === c.id && 'bg-blue-50 dark:bg-blue-950/30',
                      )}
                    >
                      <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">
                        {c.name || '—'}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{c.phone || '—'}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Icon className="h-4 w-4" />
                          {CHANNEL_LABEL[c.preferredChannel]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                        {s.lastVisit ? timeAgo(s.lastVisit) : '—'}
                      </td>
                      <td className="px-5 py-3 text-slate-600 dark:text-slate-400">{s.visitsCount}</td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // TODO: открыть форму отправки сообщения
                            alert('Скоро будет: «Написать ' + (c.name || 'клиенту') + '»');
                          }}
                        >
                          <MessageSquarePlus className="h-4 w-4" />
                          Написать
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Drawer с деталями */}
      <ClientDrawer
        client={selected}
        appointments={selectedAppts}
        messages={selectedMessages}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function ClientDrawer({
  client,
  appointments,
  messages,
  onClose,
}: {
  client: IClient | null | undefined;
  appointments: IAppointment[];
  messages: IMessage[];
  onClose: () => void;
}) {
  if (!client) return null;
  const Icon = CHANNEL_ICON[client.preferredChannel];

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/30" />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <header className="flex items-start justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <div className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {client.name || 'Без имени'}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-sm text-slate-500">
              <Icon className="h-3.5 w-3.5" />
              {CHANNEL_LABEL[client.preferredChannel]}
              {client.phone && <span>· {client.phone}</span>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Закрыть" className="text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          <section className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Записи ({appointments.length})
            </h3>
            {appointments.length === 0 ? (
              <div className="text-sm text-slate-400">Записей пока нет</div>
            ) : (
              <ul className="space-y-2">
                {appointments
                  .slice()
                  .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
                  .map((a) => (
                    <li key={a.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{a.service}</div>
                      <div className="mt-0.5 text-xs text-slate-500">
                        {new Date(a.datetime).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {a.master && ' · ' + a.master}
                        <span className="ml-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-slate-800">
                          {a.status}
                        </span>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Сообщения ({messages.length})
            </h3>
            {messages.length === 0 ? (
              <div className="text-sm text-slate-400">Сообщений пока нет</div>
            ) : (
              <ul className="space-y-2">
                {messages.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      'rounded-lg p-3 text-sm',
                      m.direction === 'in'
                        ? 'bg-slate-100 dark:bg-slate-800'
                        : 'ml-8 bg-blue-50 dark:bg-blue-950/30',
                    )}
                  >
                    <div className="text-slate-900 dark:text-slate-100">{m.text}</div>
                    <div className="mt-1 text-[10px] text-slate-400">{timeAgo(m.createdAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <footer className="border-t border-slate-100 p-4 dark:border-slate-800">
          <Button className="w-full" onClick={() => alert('Скоро: форма отправки сообщения')}>
            <MessageSquarePlus className="h-4 w-4" />
            Написать клиенту
          </Button>
        </footer>
      </aside>
    </>
  );
}
