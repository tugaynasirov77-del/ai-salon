'use client';

import { useState } from 'react';
import { MessageSquare, Bot, Link as LinkIcon, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';

// Заглушка проверки бота на время онбординга. Реальное подключение —
// POST /api/salons/:id/telegram/connect — делаем в админке после регистрации салона.
async function checkTelegramBot(): Promise<{ ok: boolean; botUrl?: string }> {
  await new Promise((r) => setTimeout(r, 800));
  return { ok: true, botUrl: 'https://t.me/demo_salon_bot' };
}

type Status = 'idle' | 'creating' | 'created' | 'checking' | 'success' | 'failed';

export function ConnectBot() {
  const setData = useAppStore((s) => s.setBusinessData);
  const businessData = useAppStore((s) => s.onboarding.businessData);
  const [status, setStatus] = useState<Status>(
    businessData.telegramConnected ? 'success' : businessData.telegramBotUrl ? 'created' : 'idle',
  );
  const [botUrl, setBotUrl] = useState<string | null>(businessData.telegramBotUrl || null);

  async function createBot() {
    setStatus('creating');
    // Имитация создания бота через BotFather. Реальный бэкенд должен вернуть ссылку.
    await new Promise((r) => setTimeout(r, 1500));
    const url = 'https://t.me/demo_salon_bot';
    setBotUrl(url);
    setData({ telegramBotUrl: url });
    setStatus('created');
  }

  async function checkConnection() {
    setStatus('checking');
    try {
      const res = await checkTelegramBot();
      if (res.ok) {
        setData({ telegramConnected: true });
        setStatus('success');
      } else {
        setStatus('failed');
      }
    } catch {
      setStatus('failed');
    }
  }

  return (
    <div>
      <h2 className="mb-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
        Подключите Telegram
      </h2>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Бот начнёт принимать сообщения клиентов сразу после подключения.
      </p>

      <ol className="mb-6 space-y-3">
        <Step icon={<Bot className="h-5 w-5" />} num={1} title="Создайте бота">
          Нажмите кнопку ниже — мы автоматически создадим Telegram-бота для вашего бизнеса.
        </Step>
        <Step icon={<LinkIcon className="h-5 w-5" />} num={2} title="Получите ссылку">
          После создания вы увидите ссылку — её можно отправлять клиентам или разместить на сайте.
        </Step>
        <Step icon={<MessageSquare className="h-5 w-5" />} num={3} title="Проверьте работу">
          Напишите боту любое сообщение и нажмите «Проверить подключение».
        </Step>
      </ol>

      {status === 'idle' && (
        <Button onClick={createBot} size="lg">
          Создать бота автоматически
        </Button>
      )}

      {status === 'creating' && (
        <Button disabled size="lg">
          <Loader2 className="h-4 w-4 animate-spin" />
          Создаём бота…
        </Button>
      )}

      {(status === 'created' || status === 'checking' || status === 'failed') && botUrl && (
        <div className="space-y-3">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950/30">
            <div className="text-xs font-medium uppercase text-blue-700 dark:text-blue-300">
              Ссылка на бота
            </div>
            <a
              href={botUrl}
              target="_blank"
              rel="noreferrer"
              className="text-base font-semibold text-blue-700 underline dark:text-blue-300"
            >
              {botUrl}
            </a>
          </div>
          <Button onClick={checkConnection} disabled={status === 'checking'}>
            {status === 'checking' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Проверяем…
              </>
            ) : (
              'Проверить подключение'
            )}
          </Button>
          {status === 'failed' && (
            <p className="text-sm text-red-600">
              Не удалось получить сообщение от бота. Напишите ему в Telegram и попробуйте ещё раз.
            </p>
          )}
        </div>
      )}

      {status === 'success' && botUrl && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
          <div>
            <div className="font-semibold text-green-800 dark:text-green-200">Бот работает!</div>
            <div className="mt-0.5 text-sm text-green-700 dark:text-green-300">
              Можно открывать дашборд.{' '}
              <a href={botUrl} target="_blank" rel="noreferrer" className="underline">
                {botUrl}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Step({
  icon,
  num,
  title,
  children,
}: {
  icon: React.ReactNode;
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
        {icon}
      </div>
      <div>
        <div className="font-medium text-slate-900 dark:text-slate-100">
          Шаг {num}. {title}
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">{children}</div>
      </div>
    </li>
  );
}
