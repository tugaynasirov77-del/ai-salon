// Транскрипция голосовых сообщений через Groq Whisper (whisper-large-v3-turbo).
// Groq доступен из РФ напрямую, бесплатный лимит — 14.4k запросов/день.
// ENV: GROQ_API_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
const MODEL = process.env.WHISPER_MODEL || 'whisper-large-v3-turbo';

export async function transcribeAudio(audioUrl: string): Promise<string | null> {
  if (!GROQ_API_KEY) {
    console.warn('[whisper] GROQ_API_KEY не задан — пропускаем транскрипцию');
    return null;
  }
  try {
    const r = await fetch(audioUrl);
    if (!r.ok) {
      console.warn('[whisper] не удалось скачать аудио:', r.status);
      return null;
    }
    const buf = Buffer.from(await r.arrayBuffer());
    const fileName = audioUrl.split('/').pop()?.split('?')[0] || 'voice.oga';
    return transcribeAudioBuffer(buf, fileName);
  } catch (e: any) {
    console.error('[whisper] error:', e?.message);
    return null;
  }
}

// Транскрипция напрямую из буфера (для multipart upload через web — voice пишется
// в браузере через MediaRecorder и приходит на бэк уже как Blob).
export async function transcribeAudioBuffer(
  buf: Buffer,
  fileName: string = 'voice.webm'
): Promise<string | null> {
  if (!GROQ_API_KEY) {
    console.warn('[whisper] GROQ_API_KEY не задан — пропускаем транскрипцию');
    return null;
  }
  if (buf.length > 25 * 1024 * 1024) {
    console.warn('[whisper] аудио > 25MB — пропускаем');
    return null;
  }
  try {
    const form = new FormData();
    form.append('file', new Blob([buf]), fileName);
    form.append('model', MODEL);
    form.append('language', 'ru');
    form.append('response_format', 'json');

    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: form as any,
    });
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.warn(`[whisper] groq error ${resp.status}: ${errText.slice(0, 200)}`);
      return null;
    }
    const data: any = await resp.json();
    return String(data?.text || '').trim() || null;
  } catch (e: any) {
    console.error('[whisper] error:', e?.message);
    return null;
  }
}
