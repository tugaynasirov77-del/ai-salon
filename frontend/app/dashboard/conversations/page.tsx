'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Send, Phone, MessagesSquare, Globe, Users as UsersIcon,
  MailX, Calendar, MessageSquare, Bot, User as UserIcon, Loader2, AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import {
  fetchConversations, fetchConversationDetail,
  sendOwnerMessage, markConversationRead,
} from '@/lib/api';
import { useSalonId } from '@/lib/config';
import { cn, timeAgo, fmtDayMonth } from '@/lib/utils';
import type { Channel, AppointmentStatus } from '@shared/types';

const CHANNEL_ICON: Record<Channel, React.ComponentType<{ className?: string }>> = {
  telegram: Send,
  max: MessagesSquare,
  vk: UsersIcon,
  sms: Phone,
  webchat: Globe,
};
const CHANNEL_COLOR: Record<Channel, string> = {
  telegram: 'text-amber-500',
  max: 'text-purple-500',
  vk: 'text-amber-500',
  sms: 'text-slate-500',
  webchat: 'text-emerald-500',
};
const CHANNEL_LABEL: Record<Channel, string> = {
  telegram: 'Telegram',
  max: 'MAX',
  vk: 'ВКонтакте',
  sms: 'SMS',
  webchat: 'Веб-чат',
};
const STATUS_LABEL: Record<AppointmentStatus, { label: string; cls: string }> = {
  confirmed: { label: 'Подтверждена', cls: 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300' },
  completed: { label: 'Завершена', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  cancelled: { label: 'Отменена', cls: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' },
  no_show: { label: 'Не пришёл', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' },
};

function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export default function ConversationsPage() {
  const SALON_ID = useSalonId();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ['conversations', SALON_ID],
    queryFn: () => fetchConversations(SALON_ID),
    refetchInterval: 15_000,
  });

  // Авто-выбор первого диалога при загрузке
  useEffect(() => {
    if (!selectedId && listQ.data && listQ.data.length > 0) {
      setSelectedId(listQ.data[0].client.id);
    }
  }, [listQ.data, selectedId]);

  const detailQ = useQuery({
    queryKey: ['conversation', SALON_ID, selectedId],
    queryFn: () => fetchConversationDetail(SALON_ID, selectedId!),
    enabled: !!selectedId,
    refetchInterval: 10_000,
  });

  // Авто-mark read при выборе диалога с непрочитанными
  const markReadMut = useMutation({
    mutationFn: (clientId: string) => markConversationRead(SALON_ID, clientId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations', SALON_ID] }),
  });
  useEffect(() => {
    if (!selectedId) return;
    const item = listQ.data?.find((it) => it.client.id === selectedId);
    if (item && (item.unreadCount || 0) > 0) {
      markReadMut.mutate(selectedId);
    }
  }, [selectedId, listQ.data]);

  // Ручная отправка владельцем
  const sendMut = useMutation({
    mutationFn: ({ clientId, text }: { clientId: string; text: string }) => sendOwnerMessage(SALON_ID, clientId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversation', SALON_ID, selectedId] });
      qc.invalidateQueries({ queryKey: ['conversations', SALON_ID] });
    },
  });

  const filtered = useMemo(() => {
    if (!listQ.data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return listQ.data;
    return listQ.data.filter((it) => {
      const name = (it.client.name || '').toLowerCase();
      const phone = (it.client.phone || '').toLowerCase();
      const text = (it.lastMessage?.text || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || text.includes(q);
    });
  }, [listQ.data, search]);

  return (
    <div>
      <PageHeader title="Диалоги" description="Все сообщения клиентов из всех каналов." />

      <Card className="overflow-hidden">
        <div className="grid h-[calc(100vh-220px)] min-h-[500px] grid-cols-1 md:grid-cols-[320px_1fr]">
          {/* ===== Левая панель — список ===== */}
          <aside className="flex min-h-0 flex-col border-r border-slate-200 dark:border-slate-800">
            <div className="border-b border-slate-100 p-3 dark:border-slate-800">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по диалогам…"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {listQ.isLoading ? (
                <LoadingSpinner label="Загружаем диалоги…" />
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <MailX className="mb-3 h-10 w-10" />
                  <div className="text-sm">
                    {(listQ.data || []).length === 0 ? 'Диалогов пока нет' : 'Ничего не найдено'}
                  </div>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filtered.map((it) => {
                    const ch = it.client.preferredChannel;
                    const Icon = CHANNEL_ICON[ch];
                    const active = it.client.id === selectedId;
                    return (
                      <li key={it.client.id}>
                        <button
                          onClick={() => setSelectedId(it.client.id)}
                          className={cn(
                            'flex w-full gap-3 px-3 py-3 text-left transition-colors',
                            active
                              ? 'bg-amber-50 dark:bg-amber-950/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
                          )}
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            {initials(it.client.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                  {it.client.name || 'Без имени'}
                                </span>
                                <Icon className={cn('h-3.5 w-3.5 flex-shrink-0', CHANNEL_COLOR[ch])} />
                              </div>
                              {it.lastMessage && (
                                <span className="flex-shrink-0 text-[10px] text-slate-400">
                                  {timeAgo(it.lastMessage.createdAt)}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              <div
                                className={cn(
                                  'min-w-0 flex-1 truncate text-xs',
                                  (it.unreadCount || 0) > 0
                                    ? 'font-semibold text-slate-900 dark:text-slate-100'
                                    : 'text-slate-500 dark:text-slate-400',
                                )}
                              >
                                {it.lastMessage?.text || 'Нет сообщений'}
                              </div>
                              {(it.unreadCount || 0) > 0 ? (
                                <span className="rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                  {it.unreadCount}
                                </span>
                              ) : it.messagesCount > 0 ? (
                                <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800">
                                  {it.messagesCount}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* ===== Правая панель — тред ===== */}
          <section className="flex min-h-0 flex-col bg-slate-50 dark:bg-slate-900/40">
            {!selectedId ? (
              <div className="flex flex-1 flex-col items-center justify-center text-slate-400">
                <MessageSquare className="mb-3 h-12 w-12" />
                <div className="text-sm">Выберите диалог слева</div>
              </div>
            ) : detailQ.isLoading || !detailQ.data ? (
              <LoadingSpinner label="Загружаем переписку…" />
            ) : (
              <ConversationDetail
                data={detailQ.data}
                onSend={(text) => sendMut.mutateAsync({ clientId: selectedId!, text })}
                sending={sendMut.isPending}
                sendError={sendMut.error?.message || null}
              />
            )}
          </section>
        </div>
      </Card>
    </div>
  );
}

// ============================================================
// Деталь диалога — шапка, записи, лента сообщений
// ============================================================

function ConversationDetail({
  data,
  onSend,
  sending,
  sendError,
}: {
  data: { client: any; messages: any[]; appointments: any[] };
  onSend: (text: string) => Promise<unknown>;
  sending: boolean;
  sendError: string | null;
}) {
  const { client, messages, appointments } = data;
  const ch = client.preferredChannel as Channel;
  const Icon = CHANNEL_ICON[ch];
  const [draft, setDraft] = useState('');
  const draftRef = useRef<HTMLTextAreaElement | null>(null);

  // Авто-скролл к низу при смене диалога / прибытии нового сообщения
  const bottomRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [client.id, messages.length]);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    try {
      await onSend(text);
      setDraft('');
      draftRef.current?.focus();
    } catch { /* ошибка показывается через sendError */ }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Шапка */}
      <header className="border-b border-slate-200 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            {initials(client.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-slate-900 dark:text-slate-100">
              {client.name || 'Без имени'}
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
              <Icon className={cn('h-3.5 w-3.5', CHANNEL_COLOR[ch])} />
              {CHANNEL_LABEL[ch]}
              {client.phone && <span>· {client.phone}</span>}
            </div>
          </div>
        </div>
      </header>

      {/* Записи клиента (если есть) */}
      {appointments.length > 0 && (
        <div className="border-b border-slate-200 bg-white px-5 py-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            <Calendar className="h-3 w-3" />
            Записи ({appointments.length})
          </div>
          <div className="flex flex-wrap gap-1.5">
            {appointments
              .slice()
              .sort((a: any, b: any) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
              .slice(0, 4)
              .map((a: any) => {
                const dt = new Date(a.datetime);
                const time = dt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                const st = STATUS_LABEL[a.status as AppointmentStatus];
                return (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <span className="font-medium">{a.service}</span>
                    <span className="text-slate-400">· {fmtDayMonth(dt)} {time}</span>
                    <span className={cn('rounded px-1 text-[10px] font-medium', st.cls)}>{st.label}</span>
                  </span>
                );
              })}
          </div>
        </div>
      )}

      {/* Лента сообщений */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <MailX className="mb-3 h-10 w-10" />
            <div className="text-sm">Сообщений пока нет</div>
          </div>
        ) : (
          <ul className="space-y-2">
            {messages.map((m: any) => {
              const out = m.direction === 'out';
              const byOwner = !!m.sentByOwner;
              return (
                <li key={m.id} className={cn('flex', out ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                      out && byOwner
                        ? 'rounded-br-md bg-emerald-600 text-white'
                        : out
                          ? 'rounded-br-md bg-amber-600 text-white'
                          : 'rounded-bl-md bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100',
                    )}
                  >
                    {out && (
                      <div className={cn('mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider', byOwner ? 'text-emerald-100' : 'text-amber-100')}>
                        {byOwner ? <><UserIcon className="h-2.5 w-2.5" /> Вы</> : <><Bot className="h-2.5 w-2.5" /> AI</>}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">{m.text}</div>
                    <div className={cn('mt-1 text-[10px]', out ? (byOwner ? 'text-emerald-100' : 'text-amber-100') : 'text-slate-400')}>
                      {new Date(m.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      {m.intent && <span className="ml-1">· {m.intent}</span>}
                    </div>
                  </div>
                </li>
              );
            })}
            <div ref={bottomRef} />
          </ul>
        )}
      </div>

      {/* Форма ручного ответа */}
      <footer className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        {sendError && (
          <div className="mb-2 flex items-center gap-2 rounded-md bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="h-3.5 w-3.5" />
            {sendError}
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={draftRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            placeholder={`Написать клиенту через ${CHANNEL_LABEL[ch] || 'канал клиента'}…`}
            rows={1}
            disabled={sending}
            className="flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white transition-colors hover:bg-emerald-700 disabled:bg-emerald-300"
            aria-label="Отправить"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-1.5 text-[10px] text-slate-400">
          Enter — отправить, Shift+Enter — новая строка. Сообщение уйдёт через {CHANNEL_LABEL[ch] || ch}.
        </div>
      </footer>
    </>
  );
}
