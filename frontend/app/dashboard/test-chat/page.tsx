'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, RotateCcw, Sparkles, Loader2, Bot, User } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sendTestChat, resetTestChat, type ITestChatResponse } from '@/lib/api';
import { useSalonId } from '@/lib/config';
import { cn } from '@/lib/utils';

type Role = 'user' | 'bot';
interface ChatMessage {
  role: Role;
  text: string;
  ts: number;
  usage?: ITestChatResponse['usage'];
}

function tokensOf(u?: ITestChatResponse['usage']) {
  if (!u) return 0;
  return u.inputTokens + u.outputTokens + u.cacheReadTokens + u.cacheCreateTokens;
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export default function TestChatPage() {
  const SALON_ID = useSalonId();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalTokens = messages.reduce((sum, m) => sum + tokensOf(m.usage), 0);
  const botReplies = messages.filter((m) => m.role === 'bot').length;

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setError(null);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text, ts: Date.now() }]);
    setSending(true);
    try {
      const res = await sendTestChat(SALON_ID, text, sessionId ?? undefined);
      setSessionId(res.sessionId);
      setMessages((prev) => [...prev, { role: 'bot', text: res.reply, ts: Date.now(), usage: res.usage }]);
    } catch (e: any) {
      setError(e?.message || 'Не удалось получить ответ');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function reset() {
    if (sessionId) {
      try { await resetTestChat(SALON_ID, sessionId); } catch { /* ignore */ }
    }
    setMessages([]);
    setSessionId(null);
    setError(null);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      <div className="mb-4 flex items-start justify-between gap-4">
        <PageHeader
          title="Тест-чат"
          description="Проверьте, как AI-администратор отвечает клиентам. Сессия живёт 30 минут и не сохраняется в БД."
        />
        <Button variant="outline" onClick={reset} disabled={sending || messages.length === 0}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Сбросить
        </Button>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {messages.length === 0 && !sending ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40">
                <Sparkles className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-base font-medium text-slate-700 dark:text-slate-200">Поговорите с AI как клиент</div>
              <div className="mt-1 max-w-md text-sm text-slate-500">
                Напишите «Сколько стоит стрижка?» или «Запишите меня на завтра в 14:00» —
                и посмотрите, что ответит бот вашим клиентам.
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-3xl flex-col gap-4">
              {messages.map((m, i) => {
                const isUser = m.role === 'user';
                return (
                  <div key={i} className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
                    <div
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                        isUser ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
                      )}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn('max-w-[80%]', isUser ? 'items-end' : 'items-start', 'flex flex-col')}>
                      <div
                        className={cn(
                          'whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm',
                          isUser
                            ? 'rounded-br-sm bg-blue-600 text-white'
                            : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
                        )}
                      >
                        {m.text}
                      </div>
                      <div className="mt-1 px-2 text-[11px] text-slate-400">
                        {fmtTime(m.ts)}
                        {m.usage ? ` · ${tokensOf(m.usage)} ток.` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
              {sending && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    AI думает…
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-3xl items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Напишите сообщение от лица клиента…"
              rows={1}
              disabled={sending}
              className="flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <Button onClick={send} disabled={sending || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <div className="mx-auto mt-2 flex max-w-3xl items-center justify-between text-[11px] text-slate-400">
            <div>Enter — отправить, Shift+Enter — новая строка</div>
            <div>
              {botReplies > 0 && <>Ответов AI: {botReplies} · </>}
              Токенов всего: {totalTokens}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
