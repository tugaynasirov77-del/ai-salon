'use client';

import Link from 'next/link';
import { Send, Phone, MessagesSquare, Globe, MailX, Users as UsersIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { timeAgo } from '@/lib/utils';
import type { Channel } from '@shared/types';
import type { IConversationItem } from '@/lib/api';

interface Props {
  items: IConversationItem[];
  loading?: boolean;
  limit?: number;
}

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

function initials(name?: string | null) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}

export function RecentConversations({ items, loading, limit = 5 }: Props) {
  const list = items.slice(0, limit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние диалоги</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-full animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              </div>
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <MailX className="mb-3 h-10 w-10" />
            <div className="text-sm">Диалогов пока нет</div>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {list.map((it) => {
              const ch = it.client.preferredChannel;
              const Icon = CHANNEL_ICON[ch];
              const msg = it.lastMessage;
              return (
                <li key={it.client.id} className="flex gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    {initials(it.client.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="truncate text-sm font-medium text-[#1E2329] dark:text-slate-100">
                          {it.client.name || 'Без имени'}
                        </span>
                        <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${CHANNEL_COLOR[ch]}`} />
                        {it.messagesCount > 0 && (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800">
                            {it.messagesCount}
                          </span>
                        )}
                      </div>
                      {msg && (
                        <span className="flex-shrink-0 text-xs text-slate-400">{timeAgo(msg.createdAt)}</span>
                      )}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {msg ? truncate(msg.text, 50) : 'Нет сообщений'}
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
