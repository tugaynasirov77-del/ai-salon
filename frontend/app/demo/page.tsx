'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Send, MessageSquare, Calendar, BarChart3,
  Users, Sparkles, Globe, Loader2, Paperclip, Mic, Square, X, Play, Pause,
} from 'lucide-react';
import { Logo } from '@/components/landing/Logo';
import { track } from '@/lib/analytics';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.ailiva.ru';
const DEMO_SALON_ID = 'cmpfhd7ha00001s7ud34xwfmw';

type Msg = {
  id: string;
  text: string;
  from: 'user' | 'bot';
  at: Date;
  imageUrl?: string; // локальный object URL для прикреплённого фото
  voiceUrl?: string; // локальный object URL для записанного голосового
};

// Лимиты
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_VOICE_SECONDS = 60;

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const PRESET_INITIAL_DIALOGS = [
  { name: 'Анна К.', initial: 'А', channel: 'Telegram', text: 'Хочу записаться на маникюр в пятницу', time: '12 мин', tone: 'indigo' as const },
  { name: 'Дмитрий', initial: 'Д', channel: 'Авито', text: 'Сколько стоит мужская стрижка?', time: '34 мин', tone: 'orange' as const },
  { name: 'Мария В.', initial: 'М', channel: 'Веб-чат', text: 'А вы работаете в воскресенье?', time: '1 ч', tone: 'emerald' as const },
];

const SUGGESTED = [
  'Здравствуйте! А вы сегодня работаете?',
  'Сколько стоит стрижка?',
  'Запишите на маникюр в пятницу в 15:00',
  'А где вы находитесь?',
];

const CHANNEL_TONE: Record<string, string> = {
  indigo: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
  emerald: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  orange: 'border-orange-400/30 bg-orange-500/10 text-orange-200',
  fuchsia: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
};

export default function DemoPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: 'init',
      text: 'Здравствуйте! Это демо AI-администратора Liva. Напишите как клиент — спросите цену услуги, попросите записаться, задайте каверзный вопрос. Я отвечу как настоящий администратор.',
      from: 'bot',
      at: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [tab, setTab] = useState<'main' | 'dialogs' | 'schedule'>('main');
  const [error, setError] = useState<string | null>(null);

  // Прикреплённое фото
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);

  // Голосовое
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const [voicePlaying, setVoicePlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordStartRef = useRef<number>(0);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const userMessages = messages.filter(m => m.from === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1];
  const hasAttachment = !!attachedImage || !!voiceBlob;
  const canSend = !sending && !recording && (input.trim().length > 0 || hasAttachment);

  // Auto-scroll chat
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Очистка ресурсов при размонтировании
  useEffect(() => {
    return () => {
      if (attachedImageUrl) URL.revokeObjectURL(attachedImageUrl);
      if (voiceUrl) URL.revokeObjectURL(voiceUrl);
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Прикрепление фото ─── */
  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError('Поддерживаются JPEG, PNG и WebP');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Размер фото — не более 5 МБ');
      return;
    }
    setError(null);
    if (attachedImageUrl) URL.revokeObjectURL(attachedImageUrl);
    setAttachedImage(file);
    setAttachedImageUrl(URL.createObjectURL(file));
  }
  function removeAttachedImage() {
    if (attachedImageUrl) URL.revokeObjectURL(attachedImageUrl);
    setAttachedImage(null);
    setAttachedImageUrl(null);
  }

  /* ─── Запись голосового ─── */
  async function startRecording() {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setError('Браузер не поддерживает запись звука');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', ''];
      let mime = '';
      for (const c of candidates) {
        if (c === '' || (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c))) {
          mime = c;
          break;
        }
      }
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recordChunksRef.current = [];
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordChunksRef.current.push(ev.data);
      };
      rec.onstop = () => {
        const type = mime || 'audio/webm';
        const blob = new Blob(recordChunksRef.current, { type });
        if (voiceUrl) URL.revokeObjectURL(voiceUrl);
        setVoiceBlob(blob);
        setVoiceUrl(URL.createObjectURL(blob));
        mediaStreamRef.current?.getTracks().forEach(t => t.stop());
        mediaStreamRef.current = null;
      };
      mediaRecorderRef.current = rec;
      rec.start();
      recordStartRef.current = Date.now();
      setRecordSeconds(0);
      setRecording(true);
      recordTimerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - recordStartRef.current) / 1000);
        setRecordSeconds(elapsed);
        if (elapsed >= MAX_VOICE_SECONDS) stopRecording();
      }, 250);
    } catch (e: any) {
      setError(e?.name === 'NotAllowedError' ? 'Нужно разрешить доступ к микрофону' : 'Не удалось начать запись');
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
  }
  function stopRecording() {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== 'inactive') rec.stop();
    setRecording(false);
  }
  function removeVoice() {
    if (voiceUrl) URL.revokeObjectURL(voiceUrl);
    setVoiceBlob(null);
    setVoiceUrl(null);
    setVoicePlaying(false);
  }
  function togglePlayVoice() {
    const a = voiceAudioRef.current;
    if (!a) return;
    if (a.paused) { a.play().catch(() => {}); setVoicePlaying(true); }
    else { a.pause(); setVoicePlaying(false); }
  }

  /* ─── Отправка ─── */
  async function send(text?: string) {
    const value = (text ?? input).trim();
    const hasAtt = !!attachedImage || !!voiceBlob;
    if ((!value && !hasAtt) || sending || recording) return;
    setError(null);

    // Первое сообщение посетителя — главное микро-conversion
    if (userMessages.length === 0) {
      track('demo_first_message', {
        has_image: !!attachedImage,
        has_voice: !!voiceBlob,
        text_length: value.length,
      });
    }

    // Снимок прикреплений
    const snapshotImage = attachedImage;
    const snapshotImageUrl = attachedImageUrl;
    const snapshotVoice = voiceBlob;
    const snapshotVoiceUrl = voiceUrl;

    setMessages(m => [
      ...m,
      {
        id: Date.now() + 'u',
        text: value,
        from: 'user',
        at: new Date(),
        imageUrl: snapshotImageUrl ?? undefined,
        voiceUrl: snapshotVoiceUrl ?? undefined,
      },
    ]);
    setInput('');
    setAttachedImage(null);
    setAttachedImageUrl(null);
    setVoiceBlob(null);
    setVoiceUrl(null);
    setVoicePlaying(false);
    setSending(true);

    try {
      let data: { sessionId?: string; reply?: string };
      const url = `${API_BASE}/api/widget/${DEMO_SALON_ID}/message`;
      if (snapshotImage || snapshotVoice) {
        const fd = new FormData();
        if (value) fd.append('text', value);
        if (sessionId) fd.append('sessionId', sessionId);
        if (snapshotImage) fd.append('image', snapshotImage, snapshotImage.name);
        if (snapshotVoice) fd.append('voice', snapshotVoice, 'voice.webm');
        const r = await fetch(url, { method: 'POST', body: fd });
        data = await r.json();
      } else {
        const body: Record<string, string> = { text: value };
        if (sessionId) body.sessionId = sessionId;
        const r = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        data = await r.json();
      }
      if (data.sessionId && !sessionId) setSessionId(data.sessionId);
      setMessages(m => [
        ...m,
        { id: Date.now() + 'b', text: data.reply || '(пустой ответ)', from: 'bot', at: new Date() },
      ]);
    } catch {
      setMessages(m => [
        ...m,
        { id: Date.now() + 'e', text: 'Не удалось получить ответ. Проверьте интернет и попробуйте ещё раз.', from: 'bot', at: new Date() },
      ]);
    } finally {
      setSending(false);
    }
  }

  // Live dialog entry for the visitor
  const yourDialog = lastUserMsg
    ? {
        name: 'Вы',
        initial: 'В',
        channel: 'Веб-чат',
        text: lastUserMsg.text.length > 60 ? lastUserMsg.text.slice(0, 60) + '…' : lastUserMsg.text,
        time: 'сейчас',
        tone: 'fuchsia' as const,
        live: true,
      }
    : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0E121A] text-slate-100">
      {/* Ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 -left-40 h-[520px] w-[520px] rounded-full bg-amber-600/20 blur-[140px]" />
        <div className="absolute top-[40%] -right-32 h-[480px] w-[480px] rounded-full bg-amber-600/15 blur-[140px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0E121A]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-3 text-sm text-slate-300 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <Logo size={28} variant="light" />
          </Link>
          <Link
            href="/register"
            onClick={() => track('cta_register', { location: 'demo_header' })}
            className="group inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(59,130,246,0.45)] transition-transform hover:scale-[1.02]"
          >
            Попробовать бесплатно
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* Title */}
      <section className="px-4 pt-10 pb-6 text-center sm:pt-14">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-300 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Живое демо · реальный AI на Claude
        </div>
        <h1 className="mx-auto mt-5 max-w-3xl bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-5xl">
          Слева вы клиент. Справа — что видит владелец.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-400">
          Напишите ИИ-администратору как обычный клиент — спросите цену услуги, попросите записаться. Ваше сообщение появится в админке справа в реальном времени, точно так же, как у владельца на телефоне.
        </p>
      </section>

      {/* Split screen */}
      <section className="px-4 pb-16">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
          {/* === CHAT (LEFT) === */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#181B22]/70 shadow-[0_30px_80px_-20px_rgba(59,130,246,0.4)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-sm font-semibold text-white">Л</span>
                <div>
                  <div className="text-sm font-semibold text-white">Демо-салон Liva ai</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    AI отвечает онлайн
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] uppercase tracking-wider text-slate-400">
                Вы — клиент
              </span>
            </div>

            <div ref={scrollRef} className="flex h-[480px] flex-col gap-3 overflow-y-auto bg-[#0E121A]/40 px-4 py-5 sm:px-6">
              {messages.map(m => (
                <Bubble key={m.id} from={m.from} text={m.text} imageUrl={m.imageUrl} voiceUrl={m.voiceUrl} />
              ))}
              {sending && <BubbleTyping />}
            </div>

            {/* Suggested prompts */}
            {userMessages.length === 0 && !hasAttachment && !recording && (
              <div className="flex flex-wrap gap-2 border-t border-white/[0.06] bg-white/[0.01] px-4 py-3">
                {SUGGESTED.map(p => (
                  <button
                    key={p}
                    onClick={() => send(p)}
                    disabled={sending}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="border-t border-red-400/30 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                {error}
              </div>
            )}

            {/* Recording indicator */}
            {recording && (
              <div className="flex items-center gap-3 border-t border-red-400/30 bg-red-500/10 px-4 py-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
                <span className="text-sm font-medium text-red-200">Запись · {fmtDuration(recordSeconds)}</span>
                <span className="text-[11px] text-red-300/70">макс {fmtDuration(MAX_VOICE_SECONDS)}</span>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-red-400/30 bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-100 hover:bg-red-500/30"
                >
                  <Square className="h-3 w-3 fill-current" /> Остановить
                </button>
              </div>
            )}

            {/* Attachments preview */}
            {(attachedImageUrl || voiceUrl) && (
              <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] bg-white/[0.01] px-4 py-2.5">
                {attachedImageUrl && (
                  <div className="relative inline-block">
                    <img src={attachedImageUrl} alt="Превью" className="h-14 w-14 rounded-lg border border-white/15 object-cover" />
                    <button
                      type="button"
                      onClick={removeAttachedImage}
                      aria-label="Убрать фото"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white shadow ring-1 ring-white/10 hover:bg-slate-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {voiceUrl && (
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-2">
                    <button
                      type="button"
                      onClick={togglePlayVoice}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-white"
                      aria-label={voicePlaying ? 'Пауза' : 'Воспроизвести'}
                    >
                      {voicePlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                    <span className="text-xs text-slate-300">Голосовое</span>
                    <audio ref={voiceAudioRef} src={voiceUrl} onEnded={() => setVoicePlaying(false)} onPause={() => setVoicePlaying(false)} preload="auto" />
                    <button
                      type="button"
                      onClick={removeVoice}
                      aria-label="Удалить голосовое"
                      className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-slate-400 hover:bg-white/[0.08] hover:text-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2 border-t border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_IMAGE_TYPES.join(',')}
                onChange={onPickImage}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || recording || !!attachedImage}
                title={attachedImage ? 'Фото уже прикреплено' : 'Прикрепить фото'}
                aria-label="Прикрепить фото"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={sending || !!voiceBlob}
                title={voiceBlob ? 'Голосовое уже записано' : recording ? 'Остановить запись' : 'Записать голосовое'}
                aria-label={recording ? 'Остановить запись' : 'Записать голосовое'}
                className={
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50 ' +
                  (recording
                    ? 'border-red-400/40 bg-red-500/80 text-white hover:bg-red-500'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white')
                }
              >
                {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
              </button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  recording
                    ? 'Идёт запись голосового…'
                    : hasAttachment
                    ? 'Добавьте комментарий (необязательно)…'
                    : 'Напишите сообщение…'
                }
                disabled={sending || recording}
                className="flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!canSend}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#3B82F6] via-[#3B82F6] to-[#2563EB] text-white shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-transform hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>

          {/* === ADMIN (RIGHT) === */}
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#181B22]/70 shadow-[0_30px_80px_-20px_rgba(59,130,246,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                <div className="ml-3 hidden items-center gap-1.5 rounded-md bg-white/[0.04] px-2.5 py-1 text-[11px] text-slate-400 sm:flex">
                  <Globe className="h-3 w-3" />
                  ailiva.ru/dashboard
                </div>
              </div>
              <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-[10px] uppercase tracking-wider text-amber-200">
                Вид владельца
              </span>
            </div>

            <div className="flex items-center gap-1 border-b border-white/[0.06] bg-white/[0.01] px-4 py-2">
              <TabBtn active={tab === 'main'} onClick={() => setTab('main')} icon={<BarChart3 className="h-3.5 w-3.5" />}>Главная</TabBtn>
              <TabBtn active={tab === 'dialogs'} onClick={() => setTab('dialogs')} icon={<MessageSquare className="h-3.5 w-3.5" />}>
                Диалоги{yourDialog ? <Dot /> : null}
              </TabBtn>
              <TabBtn active={tab === 'schedule'} onClick={() => setTab('schedule')} icon={<Calendar className="h-3.5 w-3.5" />}>Расписание</TabBtn>
            </div>

            <div className="h-[480px] overflow-y-auto px-5 py-5 sm:px-6">
              {tab === 'main' && <TabMain msgCount={userMessages.length} yourDialog={yourDialog} />}
              {tab === 'dialogs' && <TabDialogs yourDialog={yourDialog} />}
              {tab === 'schedule' && <TabSchedule />}
            </div>
          </div>
        </div>

        {/* Hint */}
        <p className="mx-auto mt-6 max-w-3xl text-center text-sm text-slate-500">
          Виджет ниже справа — это тот же самый ИИ, только в режиме floating-chat для встраивания на ваш сайт.
        </p>
      </section>

      {/* CTA */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-amber-900/40 via-amber-900/30 to-amber-900/40 p-10 text-center sm:p-14">
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-amber-500/20 blur-[100px]" />
            <div className="relative">
              <Sparkles className="mx-auto h-8 w-8 text-amber-300" />
              <h2 className="mt-4 bg-gradient-to-b from-white to-white/70 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl">
                Понравилось? Запустите такого же ИИ-администратора<br className="hidden sm:block" /> для своего бизнеса за 15 минут
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-300">
                Первая 1 000 сообщений — бесплатно. Без карты. Отмена в один клик.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href="/register"
                  onClick={() => track('cta_register', { location: 'demo_footer' })}
                  className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#3B82F6] to-[#2563EB] px-7 py-3.5 text-base font-semibold text-white shadow-[0_0_40px_rgba(59,130,246,0.5)] transition-transform hover:scale-[1.02] sm:w-auto"
                >
                  Попробовать бесплатно
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/#pricing"
                  onClick={() => track('cta_turnkey_anchor', { location: 'demo_footer' })}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 py-3.5 text-base font-medium text-slate-200 transition-colors hover:bg-white/[0.08] sm:w-auto"
                >
                  Подключим за вас
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ─────────── Chat bubbles ─────────── */

function Bubble({ from, text, imageUrl, voiceUrl }: { from: 'user' | 'bot'; text: string; imageUrl?: string; voiceUrl?: string }) {
  if (from === 'user') {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {imageUrl && (
          <a href={imageUrl} target="_blank" rel="noreferrer" className="block max-w-[80%]">
            <img src={imageUrl} alt="Фото" className="max-h-48 rounded-2xl border border-white/10 object-cover" />
          </a>
        )}
        {voiceUrl && (
          <audio controls src={voiceUrl} className="h-9 max-w-[80%] rounded-full" />
        )}
        {text && (
          <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-gradient-to-br from-[#3B82F6] to-[#2563EB] px-4 py-2.5 text-sm leading-relaxed text-white shadow-lg">
            {text}
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-[11px] font-semibold text-white">Л</span>
      <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm leading-relaxed text-slate-100">
        {text}
      </div>
    </div>
  );
}

function BubbleTyping() {
  return (
    <div className="flex items-end gap-2">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#3B82F6] to-[#2563EB] text-[11px] font-semibold text-white">Л</span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
      </div>
    </div>
  );
}

/* ─────────── Admin tabs ─────────── */

type LiveDialog = { name: string; initial: string; channel: string; text: string; time: string; tone: 'indigo' | 'orange' | 'emerald' | 'fuchsia'; live?: boolean };

function TabMain({ msgCount, yourDialog }: { msgCount: number; yourDialog: LiveDialog | null }) {
  // Metrics tick up live as the visitor chats
  const baseMsg = 87;
  const baseConv = 41;
  const baseRev = 18450;
  return (
    <div className="space-y-5">
      <div>
        <div className="text-sm font-semibold text-white">Главная</div>
        <div className="text-[11px] text-slate-500">Сводка за сегодня</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Записей" value="9" trend="+2" tone="emerald" />
        <Metric label="Выручка" value={(baseRev + msgCount * 350).toLocaleString('ru-RU') + ' ₽'} trend="+340 ₽" tone="emerald" />
        <Metric label="Конверсия" value={`${baseConv}%`} trend="+3%" tone="indigo" />
        <Metric label="Сообщений" value={String(baseMsg + msgCount)} trend={msgCount > 0 ? `+${msgCount} live` : ''} tone={msgCount > 0 ? 'fuchsia' : 'violet'} />
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[11px] font-medium text-slate-300">Последние диалоги</div>
          {yourDialog && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-200">
              <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" /></span>
              новый
            </span>
          )}
        </div>
        <div className="space-y-3">
          {yourDialog && <DialogRow d={yourDialog} />}
          {PRESET_INITIAL_DIALOGS.map(d => <DialogRow key={d.name} d={d} />)}
        </div>
      </div>
    </div>
  );
}

function TabDialogs({ yourDialog }: { yourDialog: LiveDialog | null }) {
  const list = yourDialog ? [yourDialog, ...PRESET_INITIAL_DIALOGS] : PRESET_INITIAL_DIALOGS;
  return (
    <div>
      <div className="mb-4">
        <div className="text-sm font-semibold text-white">Диалоги</div>
        <div className="text-[11px] text-slate-500">Все каналы в одном окне</div>
      </div>
      <div className="space-y-2">
        {list.map(d => (
          <div key={d.name + d.time} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-500/40 to-amber-500/40 text-xs font-semibold text-white">{d.initial}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{d.name}</span>
                  <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] uppercase tracking-wider ${CHANNEL_TONE[d.tone]}`}>{d.channel}</span>
                  {d.live && <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] uppercase text-amber-200">live</span>}
                </div>
                <span className="text-[10px] text-slate-500">{d.time}</span>
              </div>
              <p className="mt-1 truncate text-xs text-slate-400">{d.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TabSchedule() {
  const slots = [
    { time: '10:00', client: 'Елена С.', service: 'Маникюр классический', master: 'Ольга', status: 'done' },
    { time: '11:30', client: 'Анна К.', service: 'Окрашивание + укладка', master: 'Татьяна', status: 'done' },
    { time: '13:00', client: 'Дмитрий', service: 'Мужская стрижка', master: 'Игорь', status: 'now' },
    { time: '14:30', client: 'Мария В.', service: 'Педикюр + покрытие', master: 'Ольга', status: 'next' },
    { time: '16:00', client: 'Александра', service: 'Стрижка + укладка', master: 'Татьяна', status: 'next' },
    { time: '18:00', client: '— свободно —', service: '', master: '', status: 'free' },
  ];
  return (
    <div>
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <div className="text-sm font-semibold text-white">Расписание · сегодня</div>
          <div className="text-[11px] text-slate-500">Записи синхронизированы с YClients</div>
        </div>
        <div className="text-[11px] text-emerald-300">5 из 6 слотов</div>
      </div>
      <div className="space-y-2">
        {slots.map(s => (
          <div key={s.time} className={`grid grid-cols-[60px_1fr_auto] items-center gap-3 rounded-xl border px-4 py-3 ${
            s.status === 'now' ? 'border-amber-400/40 bg-amber-500/[0.06]' :
            s.status === 'free' ? 'border-dashed border-white/[0.08] bg-transparent' :
            'border-white/[0.06] bg-white/[0.02]'
          }`}>
            <div className="text-sm font-semibold text-white">{s.time}</div>
            <div className="min-w-0">
              <div className="truncate text-sm text-slate-200">{s.client}</div>
              {s.service && <div className="truncate text-[11px] text-slate-500">{s.service} · {s.master}</div>}
            </div>
            <SlotBadge status={s.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SlotBadge({ status }: { status: string }) {
  if (status === 'done') return <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-300">Выполнено</span>;
  if (status === 'now') return <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200">Сейчас</span>;
  if (status === 'next') return <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-200">Скоро</span>;
  return <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-500">Свободно</span>;
}

function DialogRow({ d }: { d: LiveDialog }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-500/40 to-amber-500/40 text-[10px] font-semibold text-white">{d.initial}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[11px] font-medium text-slate-200">{d.name}</span>
            {d.live && <span className="rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[8px] uppercase text-amber-200">live</span>}
          </div>
          <span className="shrink-0 text-[9px] text-slate-500">{d.time}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span className={`text-[9px] uppercase tracking-wider ${d.tone === 'indigo' ? 'text-amber-300' : d.tone === 'emerald' ? 'text-emerald-300' : d.tone === 'orange' ? 'text-orange-300' : 'text-amber-300'}`}>{d.channel}</span>
          <span className="truncate text-[10px] text-slate-400">{d.text}</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────── Primitives ─────────── */

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ' +
        (active
          ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-500/10 text-white'
          : 'text-slate-400 hover:bg-white/[0.04] hover:text-white')
      }
    >
      {icon}
      {children}
    </button>
  );
}

function Dot() {
  return <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />;
}

function Metric({ label, value, trend, tone }: { label: string; value: string; trend?: string; tone: 'emerald' | 'indigo' | 'violet' | 'fuchsia' }) {
  const trendColor = tone === 'emerald' ? 'text-emerald-400' : tone === 'fuchsia' ? 'text-amber-300' : tone === 'violet' ? 'text-amber-300' : 'text-amber-300';
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-lg font-semibold text-white sm:text-xl">{value}</div>
        {trend && <div className={`text-[10px] font-medium ${trendColor}`}>{trend}</div>}
      </div>
    </div>
  );
}
