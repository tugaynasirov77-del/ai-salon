// LLM-judge: проверяет ответ AI на соответствие критерию.
// Использует тот же LLM-клиент (Haiku через OpenRouter).
import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.LLM_MODEL || 'claude-haiku-4-5-20251001';
const LLM_BASE_URL = process.env.LLM_BASE_URL;
const LLM_API_KEY = process.env.LLM_API_KEY || process.env.ANTHROPIC_API_KEY || '';

const client = new Anthropic({
  apiKey: LLM_BASE_URL ? 'dummy' : LLM_API_KEY,
  baseURL: LLM_BASE_URL,
  defaultHeaders: LLM_BASE_URL ? { Authorization: `Bearer ${LLM_API_KEY}` } : undefined,
});

export type JudgeResult = { pass: boolean; reason: string };

export async function judge(criterion: string, assistantText: string): Promise<JudgeResult> {
  const prompt = `Ты строгий эксперт, проверяешь ответ AI-ассистента на соответствие критерию.

КРИТЕРИЙ:
${criterion}

ОТВЕТ AI:
"""
${assistantText}
"""

Ответь СТРОГО в формате JSON, без markdown-блоков:
{"pass": true|false, "reason": "краткое объяснение"}`;

  const r = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = r.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as Anthropic.TextBlock).text)
    .join('')
    .trim();
  try {
    const json = text.replace(/^```json\s*|```\s*$/g, '').trim();
    const parsed = JSON.parse(json);
    return { pass: Boolean(parsed.pass), reason: String(parsed.reason || '') };
  } catch {
    return { pass: false, reason: `judge не вернул валидный JSON: ${text.slice(0, 120)}` };
  }
}
