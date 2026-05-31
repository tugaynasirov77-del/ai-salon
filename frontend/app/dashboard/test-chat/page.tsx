'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Send, RotateCcw, Sparkles, Loader2, Bot, User,
  Paperclip, Mic, Square, X, Play, Pause,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/dashboard/EmptyState';
import {
  sendTestChat,
  sendTestChatMultipart,
  resetTestChat,
  type ITestChatResponse,
} from '@/lib/api';
import { useSalonId } from '@/lib/config';
import { cn } from '@/lib/utils';

type Role = 'user' | 'bot';
interface ChatMessage {
  role: Role;
  text: string;
  ts: number;
  usage?: ITestChatResponse['usage'];
  imageUrl?: string; // локальный объект URL для отображения отправленной картинки
  voiceUrl?: string; // локальный объект URL для отправленного голосового
}

// Лимиты, чтобы не отправить чушь на бэк
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_VOICE_SECONDS = 60; // 1 минута

function tokensOf(u?: ITestChatResponse['usage']) {
  if (!u) return 0;
  return u.inputTokens + u.outputTokens + u.cacheReadTokens + u.cacheCreateTokens;
}

function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function fmtDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function TestChatPage() {
  const SALON_ID = useSalonId();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Прикреплённое фото
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);

  // Голосовое сообщение
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

  const totalTokens = messages.reduce((sum, m) => sum + tokensOf(m.usage), 0);
  const botReplies = messages.filter((m) => m.role === 'bot').length;
  const hasAttachment = !!attachedImage || !!voiceBlob;
  const canSend = !sending && !recording && (input.trim().length > 0 || hasAttachment);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  // Чистим object URLs и поток при размонтировании
  useEffect(() => {
    return () => {
      if (attachedImageUrl) URL.revokeObjectURL(attachedImageUrl);
      if (voiceUrl) URL.revokeObjectURL(voiceUrl);
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Прикрепление фото ─── */

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // позволяет выбрать тот же файл повторно
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

      // Выбираем формат, который поддерживает браузер. webm/opus — стандарт для Chrome/Edge.
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
        // Освобождаем микрофон
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
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
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
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
    if (a.paused) {
      a.play().catch(() => {});
      setVoicePlaying(true);
    } else {
      a.pause();
      setVoicePlaying(false);
    }
  }

  /* ─── Отправка ─── */

  async function send() {
    if (!canSend) return;
    const text = input.trim();
    setError(null);

    // Снимок прикреплений (текущие state-значения мы переиспользуем для отображения в истории)
    const snapshotImage = attachedImage;
    const snapshotImageUrl = attachedImageUrl;
    const snapshotVoice = voiceBlob;
    const snapshotVoiceUrl = voiceUrl;

    // Кладём пользовательское сообщение в чат сразу
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text,
        ts: Date.now(),
        imageUrl: snapshotImageUrl ?? undefined,
        voiceUrl: snapshotVoiceUrl ?? undefined,
      },
    ]);
    // Очищаем поле ввода и прикрепления (object URL'ы остаются у сообщения в истории — не revoke'ем)
    setInput('');
    setAttachedImage(null);
    setAttachedImageUrl(null);
    setVoiceBlob(null);
    setVoiceUrl(null);
    setVoicePlaying(false);

    setSending(true);
    try {
      let res: ITestChatResponse;
      if (snapshotImage || snapshotVoice) {
        res = await sendTestChatMultipart(SALON_ID, {
          text: text || undefined,
          sessionId: sessionId ?? undefined,
          image: snapshotImage ?? undefined,
          voice: snapshotVoice ?? undefined,
        });
      } else {
        res = await sendTestChat(SALON_ID, text, sessionId ?? undefined);
      }
      setSessionId(res.sessionId);
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: res.reply, ts: Date.now(), usage: res.usage },
      ]);
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
    // Чистим object URL'ы во всех сообщениях
    messages.forEach((m) => {
      if (m.imageUrl) URL.revokeObjectURL(m.imageUrl);
      if (m.voiceUrl) URL.revokeObjectURL(m.voiceUrl);
    });
    removeAttachedImage();
    removeVoice();
    if (recording) stopRecording();
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
          description="Проверьте, как ИИ-администратор отвечает клиентам. Можно прикрепить фото и записать голосовое. Сессия живёт 30 минут и не сохраняется в БД."
        />
        <Button variant="outline" onClick={reset} disabled={sending || (messages.length === 0 && !hasAttachment)}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Сбросить
        </Button>
      </div>

      <Card className="flex flex-1 flex-col overflow-hidden p-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {messages.length === 0 && !sending ? (
            <div className="flex h-full items-center justify-center">
              <EmptyState
                icon={<Sparkles className="h-7 w-7" />}
                title="Поговорите с ИИ как клиент"
                text="Напишите «Сколько стоит стрижка?», прикрепите фото или запишите голосовое — и посмотрите, что ответит ИИ вашим клиентам."
                action={{ label: 'Начать диалог', onClick: () => inputRef.current?.focus() }}
              />
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
                        isUser ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
                      )}
                    >
                      {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={cn('max-w-[80%] flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start')}>
                      {m.imageUrl && (
                        <a href={m.imageUrl} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={m.imageUrl}
                            alt="Прикреплённое фото"
                            className="max-h-60 max-w-full rounded-2xl border border-slate-200 object-cover dark:border-slate-700"
                          />
                        </a>
                      )}
                      {m.voiceUrl && (
                        <audio
                          controls
                          src={m.voiceUrl}
                          className="h-10 rounded-full bg-slate-100 dark:bg-slate-800"
                        />
                      )}
                      {m.text && (
                        <div
                          className={cn(
                            'whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm',
                            isUser
                              ? 'rounded-br-sm bg-amber-600 text-white'
                              : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
                          )}
                        >
                          {m.text}
                        </div>
                      )}
                      <div className="px-2 text-[11px] text-slate-400">
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
                    ИИ думает…
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

        <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-[#12151C]">
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {/* Превью прикреплённого контента */}
            {(attachedImageUrl || voiceUrl) && (
              <div className="flex flex-wrap items-center gap-2">
                {attachedImageUrl && (
                  <div className="relative inline-block">
                    <img
                      src={attachedImageUrl}
                      alt="Превью"
                      className="h-16 w-16 rounded-lg border border-slate-300 object-cover dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={removeAttachedImage}
                      aria-label="Убрать фото"
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 text-white shadow hover:bg-slate-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {voiceUrl && (
                  <div className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 py-1 pl-1 pr-2 dark:border-slate-700 dark:bg-slate-800">
                    <button
                      type="button"
                      onClick={togglePlayVoice}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white hover:bg-amber-700"
                      aria-label={voicePlaying ? 'Пауза' : 'Воспроизвести'}
                    >
                      {voicePlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                    <span className="text-xs text-slate-600 dark:text-slate-300">Голосовое</span>
                    <audio
                      ref={voiceAudioRef}
                      src={voiceUrl}
                      onEnded={() => setVoicePlaying(false)}
                      onPause={() => setVoicePlaying(false)}
                      preload="auto"
                    />
                    <button
                      type="button"
                      onClick={removeVoice}
                      aria-label="Удалить голосовое"
                      className="ml-1 flex h-5 w-5 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Запись в процессе — отдельная панель */}
            {recording && (
              <div className="flex items-center gap-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm dark:border-red-900/50 dark:bg-red-950/30">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
                </span>
                <span className="font-medium text-red-700 dark:text-red-300">Запись · {fmtDuration(recordSeconds)}</span>
                <span className="text-xs text-red-600/70 dark:text-red-400/70">
                  макс {fmtDuration(MAX_VOICE_SECONDS)}
                </span>
                <Button variant="outline" size="sm" onClick={stopRecording} className="ml-auto">
                  <Square className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  Остановить
                </Button>
              </div>
            )}

            {/* Ряд кнопок + текстовое поле */}
            <div className="flex items-end gap-2">
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-[#080C14] dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={sending || !!voiceBlob}
                title={voiceBlob ? 'Голосовое уже записано' : recording ? 'Остановить запись' : 'Записать голосовое'}
                aria-label={recording ? 'Остановить запись' : 'Записать голосовое'}
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                  recording
                    ? 'border-red-300 bg-red-600 text-white hover:bg-red-700 dark:border-red-700'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#080C14] dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {recording ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-4 w-4" />}
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  recording
                    ? 'Идёт запись голосового…'
                    : hasAttachment
                    ? 'Добавьте комментарий (необязательно)…'
                    : 'Напишите сообщение от лица клиента…'
                }
                rows={1}
                disabled={sending || recording}
                className="flex-1 resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-[#12151C] placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 dark:border-slate-700 dark:bg-[#080C14] dark:text-slate-100"
              />
              <Button onClick={send} disabled={!canSend}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <div>Enter — отправить · Shift+Enter — новая строка · 📎 фото, 🎤 голосовое</div>
              <div>
                {botReplies > 0 && <>Ответов ИИ: {botReplies} · </>}
                Токенов всего: {totalTokens}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
