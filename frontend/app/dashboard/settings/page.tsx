'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Send, MessagesSquare, Briefcase, Globe, Copy, Check, Loader2, Bell, Lock,
  AlertTriangle, Settings as SettingsIcon, User as UserIcon, Calendar as CalendarIcon,
  Palette, LinkIcon, Unlink,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Label } from '@/components/ui/input';
import {
  connectTelegram, connectMax, connectAvito, connectYclients,
  disconnectTelegram, disconnectMax, disconnectAvito, disconnectYclients,
  updateSalon,
  type IYclientsStep1,
} from '@/lib/api';
import { apiChangePassword, apiMe, useAuthStore } from '@/lib/auth';
import { useSalonId } from '@/lib/config';
import { cn, timeAgo } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.ailiva.ru';

type Tab = 'channels' | 'escalation' | 'widget' | 'account';

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'channels', label: 'Каналы', icon: LinkIcon },
  { id: 'escalation', label: 'Эскалация', icon: Bell },
  { id: 'widget', label: 'Виджет на сайт', icon: Palette },
  { id: 'account', label: 'Аккаунт', icon: UserIcon },
];

function StatusPill({ ok, labelOk = 'Подключён', labelOff = 'Не подключён' }: { ok: boolean; labelOk?: string; labelOff?: string }) {
  return (
    <span
      className={
        ok
          ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400'
          : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800'
      }
    >
      {ok ? `✓ ${labelOk}` : labelOff}
    </span>
  );
}

function ChannelHeader({ icon: Icon, title, status }: { icon: React.ComponentType<{ className?: string }>; title: string; status?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4 text-slate-500" />
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {status}
    </div>
  );
}

export default function SettingsPage() {
  const SALON_ID = useSalonId();
  const { salon, setSession, user } = useAuthStore();
  const [tab, setTab] = useState<Tab>('channels');
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  function notify(kind: 'ok' | 'err', msg: string) {
    setFeedback({ kind, msg });
    if (kind === 'ok') setTimeout(() => setFeedback(null), 4000);
  }

  async function refetchSalon() {
    try {
      const r = await apiMe();
      setSession(r);
    } catch { /* ignore */ }
  }

  return (
    <div>
      <PageHeader title="Настройки" description="Подключение каналов, эскалация, виджет и аккаунт." />

      {feedback && (
        <div
          className={
            feedback.kind === 'ok'
              ? 'mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-950/30 dark:text-green-300'
              : 'mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300'
          }
        >
          {feedback.msg}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-blue-600 text-blue-700 dark:text-blue-300'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'channels' && <ChannelsTab salonId={SALON_ID} salon={salon} refetch={refetchSalon} notify={notify} />}
      {tab === 'escalation' && <EscalationTab salonId={SALON_ID} salon={salon} refetch={refetchSalon} notify={notify} />}
      {tab === 'widget' && <WidgetTab salonId={SALON_ID} salon={salon} refetch={refetchSalon} notify={notify} />}
      {tab === 'account' && <AccountTab email={user?.email} notify={notify} />}
    </div>
  );
}

// ===========================================================================
// CHANNELS TAB
// ===========================================================================

interface TabProps {
  salonId: string;
  salon: any;
  refetch: () => Promise<void>;
  notify: (k: 'ok' | 'err', m: string) => void;
}

function ChannelsTab({ salonId, salon, refetch, notify }: TabProps) {
  const [tgToken, setTgToken] = useState('');
  const [maxToken, setMaxToken] = useState('');
  const [avito, setAvito] = useState({ clientId: '', clientSecret: '', userId: '' });

  const tgOn = !!salon?.telegramBotToken;
  const maxOn = !!salon?.maxBotToken;

  const tgConnect = useMutation({
    mutationFn: () => connectTelegram(salonId, tgToken.trim()),
    onSuccess: async () => { setTgToken(''); await refetch(); notify('ok', 'Telegram подключён'); },
    onError: (e: any) => notify('err', e?.message || 'Не удалось подключить Telegram'),
  });
  const tgDisconnect = useMutation({
    mutationFn: () => disconnectTelegram(salonId),
    onSuccess: async () => { await refetch(); notify('ok', 'Telegram отключён'); },
    onError: (e: any) => notify('err', e?.message || 'Не удалось отключить'),
  });
  const maxConnect = useMutation({
    mutationFn: () => connectMax(salonId, maxToken.trim()),
    onSuccess: async () => { setMaxToken(''); await refetch(); notify('ok', 'MAX подключён'); },
    onError: (e: any) => notify('err', e?.message || 'Не удалось подключить MAX'),
  });
  const maxDisconnect = useMutation({
    mutationFn: () => disconnectMax(salonId),
    onSuccess: async () => { await refetch(); notify('ok', 'MAX отключён'); },
    onError: (e: any) => notify('err', e?.message || 'Не удалось отключить'),
  });
  const avMut = useMutation({
    mutationFn: () => connectAvito(salonId, { clientId: avito.clientId.trim(), clientSecret: avito.clientSecret.trim(), userId: avito.userId.trim() }),
    onSuccess: async () => { setAvito({ clientId: '', clientSecret: '', userId: '' }); await refetch(); notify('ok', 'Авито подключён'); },
    onError: (e: any) => notify('err', e?.message || 'Не удалось подключить Авито'),
  });
  const avDisconnect = useMutation({
    mutationFn: () => disconnectAvito(salonId),
    onSuccess: async () => { await refetch(); notify('ok', 'Авито отключён'); },
    onError: (e: any) => notify('err', e?.message || 'Не удалось отключить'),
  });

  const avitoOn = !!salon?.avitoClientId;

  return (
    <Card>
      <p className="mb-4 text-xs text-slate-500">Без подключения хотя бы одного канала бот не сможет принимать сообщения.</p>

      {/* Telegram */}
      <div className="mb-5 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <ChannelHeader icon={Send} title="Telegram" status={<StatusPill ok={tgOn} />} />
        <p className="mb-3 text-xs text-slate-500">
          Создайте бота через <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">@BotFather</code>, вставьте токен.
        </p>
        {tgOn ? (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => tgDisconnect.mutate()} disabled={tgDisconnect.isPending}>
              {tgDisconnect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
              Отключить
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[260px]">
              <Label htmlFor="tg-token">Токен бота</Label>
              <Input id="tg-token" type="password" value={tgToken} onChange={(e) => setTgToken(e.target.value)} placeholder="123456789:ABCDEF..." />
            </div>
            <Button onClick={() => tgConnect.mutate()} disabled={!tgToken.trim() || tgConnect.isPending}>
              {tgConnect.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Подключить
            </Button>
          </div>
        )}
      </div>

      {/* MAX */}
      <div className="mb-5 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <ChannelHeader icon={MessagesSquare} title="MAX (TamTam)" status={<StatusPill ok={maxOn} />} />
        <p className="mb-3 text-xs text-slate-500">
          Создайте бота через <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">@MasterBot</code> в MAX.
        </p>
        {maxOn ? (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => maxDisconnect.mutate()} disabled={maxDisconnect.isPending}>
              {maxDisconnect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
              Отключить
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[260px]">
              <Label htmlFor="max-token">Токен бота</Label>
              <Input id="max-token" type="password" value={maxToken} onChange={(e) => setMaxToken(e.target.value)} placeholder="MAX token..." />
            </div>
            <Button onClick={() => maxConnect.mutate()} disabled={!maxToken.trim() || maxConnect.isPending}>
              {maxConnect.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Подключить
            </Button>
          </div>
        )}
      </div>

      {/* Авито */}
      <div className="mb-5 rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <ChannelHeader icon={Briefcase} title="Авито" status={<StatusPill ok={avitoOn} />} />
        <p className="mb-3 text-xs text-slate-500">Ключи из Авито → Профиль → Настройки → API.</p>
        {avitoOn ? (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => avDisconnect.mutate()} disabled={avDisconnect.isPending}>
              {avDisconnect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
              Отключить
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <Label htmlFor="av-cid">Client ID</Label>
                <Input id="av-cid" value={avito.clientId} onChange={(e) => setAvito((a) => ({ ...a, clientId: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="av-sec">Client Secret</Label>
                <Input id="av-sec" type="password" value={avito.clientSecret} onChange={(e) => setAvito((a) => ({ ...a, clientSecret: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="av-uid">User ID</Label>
                <Input id="av-uid" value={avito.userId} onChange={(e) => setAvito((a) => ({ ...a, userId: e.target.value }))} />
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <Button
                onClick={() => avMut.mutate()}
                disabled={!avito.clientId.trim() || !avito.clientSecret.trim() || !avito.userId.trim() || avMut.isPending}
              >
                {avMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Подключить
              </Button>
            </div>
          </>
        )}
      </div>

      {/* YClients */}
      <YclientsCard salonId={salonId} salon={salon} refetch={refetch} notify={notify} />

      {/* VK / SMS — заблокированы */}
      <div className="mt-5 rounded-lg border border-dashed border-slate-200 p-4 text-xs text-slate-500 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
          <span>ВКонтакте и SMS пока заблокированы внешними факторами (ИП). Появятся позже.</span>
        </div>
      </div>
    </Card>
  );
}

// ===========================================================================
// YCLIENTS card with two-step wizard
// ===========================================================================

function YclientsCard({ salonId, salon, refetch, notify }: TabProps) {
  // Бэк хранит в отдельных колонках Salon (не в settings)
  const yclientsConnected = !!salon?.yclientsCompanyId;
  const yclientsCompany = salon?.yclientsCompanyTitle;
  const yclientsLastSync = salon?.yclientsLastSyncAt;

  const [step, setStep] = useState<'idle' | 'select_company'>('idle');
  const [creds, setCreds] = useState({ login: '', password: '' });
  const [companies, setCompanies] = useState<Array<{ id: number; title: string }>>([]);

  const mut = useMutation({
    mutationFn: (companyId?: number) =>
      connectYclients(salonId, { login: creds.login.trim(), password: creds.password, companyId }),
    onSuccess: async (res) => {
      if ((res as IYclientsStep1).step === 'select_company') {
        setCompanies((res as IYclientsStep1).companies);
        setStep('select_company');
      } else {
        const r = res as any;
        const mapping = r.mapping || {};
        const title = r.companyTitle || 'филиал';
        setStep('idle');
        setCreds({ login: '', password: '' });
        setCompanies([]);
        await refetch();
        notify('ok', `Подключили филиал «${title}». Сопоставили ${mapping.servicesMatched ?? 0} услуг и ${mapping.staffMatched ?? 0} мастеров`);
      }
    },
    onError: (e: any) => notify('err', e?.message || 'Не удалось подключить YClients'),
  });

  const ycDisconnect = useMutation({
    mutationFn: () => disconnectYclients(salonId),
    onSuccess: async () => { await refetch(); notify('ok', 'YClients отключён'); },
    onError: (e: any) => notify('err', e?.message || 'Не удалось отключить'),
  });

  return (
    <div className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
      <ChannelHeader icon={CalendarIcon} title="YClients" status={<StatusPill ok={yclientsConnected} />} />
      <p className="mb-3 text-xs text-slate-500">
        Интеграция с CRM YClients. Бот будет видеть ваши услуги, мастеров и расписание из YClients.
      </p>

      {yclientsConnected ? (
        <div>
          <div className="rounded-md bg-green-50 px-3 py-2 text-sm dark:bg-green-950/30">
            ✅ Подключён к филиалу <b>«{yclientsCompany || '—'}»</b>
            {yclientsLastSync && (
              <div className="mt-0.5 text-xs text-slate-500">
                Сопоставление обновлено {timeAgo(new Date(yclientsLastSync))}
              </div>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="outline" onClick={() => ycDisconnect.mutate()} disabled={ycDisconnect.isPending}>
              {ycDisconnect.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlink className="h-4 w-4" />}
              Отключить
            </Button>
          </div>
        </div>
      ) : step === 'idle' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="yc-login">Логин YClients</Label>
            <Input id="yc-login" value={creds.login} onChange={(e) => setCreds((c) => ({ ...c, login: e.target.value }))} placeholder="user@example.com" />
          </div>
          <div>
            <Label htmlFor="yc-pw">Пароль</Label>
            <Input id="yc-pw" type="password" value={creds.password} onChange={(e) => setCreds((c) => ({ ...c, password: e.target.value }))} />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <Button
              onClick={() => mut.mutate(undefined)}
              disabled={!creds.login.trim() || !creds.password || mut.isPending}
            >
              {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Продолжить
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-3 text-sm text-slate-700 dark:text-slate-300">
            Выберите филиал, который привязать к этому салону:
          </div>
          <div className="space-y-1.5">
            {companies.map((c) => (
              <button
                key={c.id}
                onClick={() => mut.mutate(c.id)}
                disabled={mut.isPending}
                className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-blue-950/30"
              >
                <span>{c.title}</span>
                <span className="text-xs text-slate-400">id: {c.id}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => { setStep('idle'); setCompanies([]); }}>
              Отмена
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// ESCALATION TAB
// ===========================================================================

function EscalationTab({ salonId, salon, refetch, notify }: TabProps) {
  const [ownerChatId, setOwnerChatId] = useState('');
  useEffect(() => {
    const v = salon?.settings?.ownerChatId;
    if (v !== undefined && v !== null) setOwnerChatId(String(v));
  }, [salon?.id]);

  const mut = useMutation({
    mutationFn: () => updateSalon(salonId, { settings: { ...(salon?.settings || {}), ownerChatId: ownerChatId.trim() || null } as any }),
    onSuccess: async () => { await refetch(); notify('ok', 'Эскалация обновлена'); },
    onError: (e: any) => notify('err', e?.message || 'Не удалось сохранить'),
  });

  return (
    <Card>
      <ChannelHeader icon={Bell} title="Эскалация владельцу" />
      <p className="mb-3 text-xs text-slate-500">
        Telegram chat_id, куда AI напишет, если не уверен в ответе или клиент попросил человека.
        Узнать ваш chat_id: напишите боту <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">@userinfobot</code> в Telegram.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[240px]">
          <Label htmlFor="owner-chat">Telegram chat_id владельца</Label>
          <Input id="owner-chat" value={ownerChatId} onChange={(e) => setOwnerChatId(e.target.value)} placeholder="123456789" />
        </div>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Сохранить
        </Button>
      </div>
    </Card>
  );
}

// ===========================================================================
// WIDGET TAB
// ===========================================================================

function WidgetTab({ salonId, salon, refetch, notify }: TabProps) {
  const initialColor = (salon?.settings?.widgetColor as string) || '#2563eb';
  const initialGreeting = (salon?.settings?.widgetGreeting as string) || 'Здравствуйте! Чем могу помочь?';
  const [color, setColor] = useState(initialColor);
  const [greeting, setGreeting] = useState(initialGreeting);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (salon?.settings) {
      const c = salon.settings.widgetColor;
      const g = salon.settings.widgetGreeting;
      if (c) setColor(c);
      if (g) setGreeting(g);
    }
  }, [salon?.id]);

  const dirty = useMemo(
    () => color !== (salon?.settings?.widgetColor || '#2563eb') || greeting !== (salon?.settings?.widgetGreeting || 'Здравствуйте! Чем могу помочь?'),
    [color, greeting, salon?.settings],
  );

  const mut = useMutation({
    mutationFn: () => updateSalon(salonId, { settings: { ...(salon?.settings || {}), widgetColor: color, widgetGreeting: greeting } as any }),
    onSuccess: async () => { await refetch(); notify('ok', 'Виджет обновлён'); },
    onError: (e: any) => notify('err', e?.message || 'Не удалось сохранить'),
  });

  const snippet = `<script src="${API_BASE}/widget.js?salon=${salonId}" async></script>`;

  async function copySnippet() {
    try { await navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  }

  return (
    <Card>
      <ChannelHeader icon={Palette} title="Виджет на сайт" />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div>
            <Label htmlFor="w-color">Цвет</Label>
            <div className="flex items-center gap-3">
              <input
                id="w-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 w-16 cursor-pointer rounded border border-slate-300 bg-white p-1 dark:border-slate-700"
              />
              <Input value={color} onChange={(e) => setColor(e.target.value)} className="font-mono" />
            </div>
          </div>
          <div>
            <Label htmlFor="w-greet">Приветствие</Label>
            <Textarea id="w-greet" rows={3} value={greeting} onChange={(e) => setGreeting(e.target.value)} />
          </div>
          <Button onClick={() => mut.mutate()} disabled={!dirty || mut.isPending}>
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Сохранить виджет
          </Button>
        </div>

        <div>
          <Label>Превью</Label>
          <div className="relative h-64 overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 dark:border-slate-800 dark:from-slate-900 dark:to-slate-950">
            <div className="absolute right-4 top-4 max-w-[220px] rounded-2xl rounded-tr-sm bg-white px-3 py-2 text-xs text-slate-700 shadow-md dark:bg-slate-800 dark:text-slate-200">
              {greeting}
            </div>
            <button
              className="absolute bottom-4 right-4 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: color }}
              type="button"
              aria-label="Превью виджета"
            >
              <Send className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Label>Сниппет для сайта</Label>
        <p className="mb-2 text-xs text-slate-500">Вставьте перед закрывающим <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">&lt;/body&gt;</code>.</p>
        <div className="flex flex-wrap items-stretch gap-2">
          <pre className="flex-1 min-w-0 overflow-x-auto rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">
            <code>{snippet}</code>
          </pre>
          <Button variant="outline" onClick={copySnippet}>
            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Скопировано' : 'Скопировать'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ===========================================================================
// ACCOUNT TAB
// ===========================================================================

function AccountTab({ email, notify }: { email?: string; notify: (k: 'ok' | 'err', m: string) => void }) {
  const [pw, setPw] = useState({ old: '', new1: '', new2: '' });
  const mut = useMutation({
    mutationFn: () => apiChangePassword(pw.old, pw.new1),
    onSuccess: () => { setPw({ old: '', new1: '', new2: '' }); notify('ok', 'Пароль изменён'); },
    onError: (e: any) => notify('err', e?.message || 'Не удалось сменить пароль'),
  });

  function submit() {
    if (!pw.old || !pw.new1) return notify('err', 'Заполните оба пароля');
    if (pw.new1.length < 8) return notify('err', 'Новый пароль должен быть от 8 символов');
    if (pw.new1 !== pw.new2) return notify('err', 'Новые пароли не совпадают');
    mut.mutate();
  }

  return (
    <Card>
      <ChannelHeader icon={UserIcon} title="Аккаунт" />
      <div className="mb-6">
        <Label>Email</Label>
        <Input value={email || ''} readOnly disabled className="cursor-not-allowed bg-slate-50 dark:bg-slate-900/50" />
        <p className="mt-1 text-xs text-slate-500">Email пока нельзя изменить.</p>
      </div>

      <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
        <ChannelHeader icon={Lock} title="Смена пароля" />
        <div className="grid max-w-md gap-3">
          <div>
            <Label htmlFor="pw-old">Текущий пароль</Label>
            <Input id="pw-old" type="password" value={pw.old} onChange={(e) => setPw((p) => ({ ...p, old: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="pw-new1">Новый пароль</Label>
            <Input id="pw-new1" type="password" value={pw.new1} onChange={(e) => setPw((p) => ({ ...p, new1: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="pw-new2">Повторите новый пароль</Label>
            <Input id="pw-new2" type="password" value={pw.new2} onChange={(e) => setPw((p) => ({ ...p, new2: e.target.value }))} />
          </div>
          <div>
            <Button onClick={submit} disabled={mut.isPending}>
              {mut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Сменить пароль
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
