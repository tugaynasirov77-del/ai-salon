'use client';

import { useEffect, useRef, useState } from 'react';

type Turn = { role: 'user' | 'ai'; text: string };

const SCRIPT: Turn[] = [
  { role: 'user', text: 'Здравствуйте! Можно записаться на стрижку в субботу?' },
  { role: 'ai', text: 'Да! В субботу свободно 12:00, 15:30 и 18:00. Какое время удобно?' },
  { role: 'user', text: 'Давайте 15:30' },
  { role: 'ai', text: 'Записала к мастеру Игорю на 15:30. Напомню за 2 часа до визита 🙌' },
];

export function TypingDemo() {
  const [msgs, setMsgs] = useState<Turn[]>([]);
  const [typing, setTyping] = useState<'user' | 'ai' | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setMsgs(SCRIPT);
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => {
        timers.push(setTimeout(res, ms));
      });

    async function loop() {
      while (!cancelled) {
        setMsgs([]);
        setTyping(null);
        await wait(700);
        const acc: Turn[] = [];
        for (const turn of SCRIPT) {
          if (cancelled) return;
          setTyping(turn.role);
          await wait(turn.role === 'ai' ? 1100 : 750);
          if (cancelled) return;
          setTyping(null);
          acc.push(turn);
          setMsgs([...acc]);
          await wait(turn.role === 'ai' ? 1400 : 600);
        }
        await wait(2800);
      }
    }
    loop();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  return (
    <div className="flex h-[300px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0F1216]/60">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#C0C4CB]/30 to-[#8A8E96]/30 text-[11px] font-semibold text-[#E8EBEF] ring-1 ring-inset ring-white/10">
          ИИ
        </span>
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-white">Liva ai</div>
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            онлайн · Telegram
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-2.5 overflow-hidden px-4 py-3.5">
        {msgs.map((m, i) => (
          <Bubble key={i} role={m.role} text={m.text} />
        ))}
        {typing && <TypingBubble role={typing} />}
      </div>
    </div>
  );
}

function Bubble({ role, text }: { role: 'user' | 'ai'; text: string }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={
          isUser
            ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-br from-[#8A8E96] to-[#8A8E96] px-3.5 py-2 text-[12.5px] leading-snug text-white shadow-[0_8px_24px_-12px_rgba(59,130,246,0.8)]'
            : 'max-w-[80%] rounded-2xl rounded-bl-sm border border-white/10 bg-white/[0.06] px-3.5 py-2 text-[12.5px] leading-snug text-slate-100'
        }
        style={{ animation: 'liva-pop 0.32s cubic-bezier(0.16,1,0.3,1)' }}
      >
        {text}
      </div>
    </div>
  );
}

function TypingBubble({ role }: { role: 'user' | 'ai' }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`flex items-center gap-1 rounded-2xl px-3.5 py-2.5 ${
          isUser ? 'rounded-br-sm bg-[#8A8E96]/40' : 'rounded-bl-sm border border-white/10 bg-white/[0.06]'
        }`}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="liva-typing-dot h-1.5 w-1.5 rounded-full bg-slate-200"
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
    </div>
  );
}
