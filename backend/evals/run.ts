// Eval-раннер: гонит JSON-кейсы из cases/ через aiAgent.processDryRun.
// Запуск: docker exec ai-salon-backend npx tsx evals/run.ts
//   опции:
//     --salon=<id>        переопределить salonId (по умолчанию Гараж 161)
//     --case=<glob>       прогнать только конкретный файл (по имени без .json)
//     --verbose           печатать ответы AI целиком
import fs from 'fs';
import path from 'path';
import { aiAgent } from '../src/agents/aiAgent';
import { judge } from './judge';

const DEFAULT_SALON = process.env.EVAL_SALON_ID || 'cmpihgjp100014g87h7kjet2r';
const CASES_DIR = path.join(__dirname, 'cases');

type Assert =
  | { type: 'contains'; value: string }
  | { type: 'notContains'; value: string }
  | { type: 'regex'; value: string }
  | { type: 'judge'; criterion: string };

type Turn = { user: string; assert?: Assert[] };
type Case = { name: string; description?: string; salonId?: string; turns: Turn[] };

type CheckResult = { ok: boolean; assert: Assert; reason?: string };

function parseArgs(): { salon?: string; only?: string; verbose: boolean } {
  const out: { salon?: string; only?: string; verbose: boolean } = { verbose: false };
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--salon=')) out.salon = a.slice(8);
    else if (a.startsWith('--case=')) out.only = a.slice(7);
    else if (a === '--verbose') out.verbose = true;
  }
  return out;
}

async function checkAssert(a: Assert, text: string): Promise<CheckResult> {
  if (a.type === 'contains') {
    const ok = text.toLowerCase().includes(a.value.toLowerCase());
    return { ok, assert: a, reason: ok ? undefined : `не найдено: "${a.value}"` };
  }
  if (a.type === 'notContains') {
    const ok = !text.toLowerCase().includes(a.value.toLowerCase());
    return { ok, assert: a, reason: ok ? undefined : `найдено запрещённое: "${a.value}"` };
  }
  if (a.type === 'regex') {
    const ok = new RegExp(a.value, 'i').test(text);
    return { ok, assert: a, reason: ok ? undefined : `regex не сматчился: ${a.value}` };
  }
  if (a.type === 'judge') {
    const j = await judge(a.criterion, text);
    return { ok: j.pass, assert: a, reason: j.reason };
  }
  return { ok: false, assert: a, reason: 'неизвестный тип ассерта' };
}

function loadCases(only?: string): { file: string; case: Case }[] {
  const files = fs
    .readdirSync(CASES_DIR)
    .filter((f) => f.endsWith('.json') && !f.startsWith('._'))
    .filter((f) => !only || f.includes(only));
  return files.map((f) => ({
    file: f,
    case: JSON.parse(fs.readFileSync(path.join(CASES_DIR, f), 'utf-8')) as Case,
  }));
}

async function runCase(c: Case, salonId: string, verbose: boolean) {
  const history: Array<{ role: 'user' | 'assistant'; text: string }> = [];
  const turnResults: { user: string; reply: string; checks: CheckResult[] }[] = [];
  let totalUsage = { in: 0, out: 0, cacheRead: 0, cacheCreate: 0 };

  for (const turn of c.turns) {
    const { text: reply, usage } = await aiAgent.processDryRun(salonId, history, turn.user);
    totalUsage.in += usage.inputTokens;
    totalUsage.out += usage.outputTokens;
    totalUsage.cacheRead += usage.cacheReadTokens;
    totalUsage.cacheCreate += usage.cacheCreateTokens;

    const checks: CheckResult[] = [];
    if (turn.assert) {
      for (const a of turn.assert) {
        checks.push(await checkAssert(a, reply));
      }
    }
    turnResults.push({ user: turn.user, reply, checks });

    history.push({ role: 'user', text: turn.user });
    history.push({ role: 'assistant', text: reply });
  }

  const allChecks = turnResults.flatMap((t) => t.checks);
  const passed = allChecks.filter((c) => c.ok).length;
  const failed = allChecks.length - passed;
  const status = failed === 0 ? '✅ PASS' : '❌ FAIL';

  console.log(`\n${status}  ${c.name}  [${passed}/${allChecks.length}]`);
  if (verbose || failed > 0) {
    for (const t of turnResults) {
      console.log(`  → ${t.user}`);
      console.log(`  ← ${t.reply.replace(/\n/g, ' ').slice(0, 200)}${t.reply.length > 200 ? '…' : ''}`);
      for (const ch of t.checks) {
        const mark = ch.ok ? '   ✓' : '   ✗';
        const label = ch.assert.type === 'judge' ? `judge` : `${ch.assert.type}`;
        console.log(`${mark} ${label}${ch.reason ? `: ${ch.reason}` : ''}`);
      }
    }
  }
  console.log(
    `  usage: in=${totalUsage.in} out=${totalUsage.out} cacheR=${totalUsage.cacheRead} cacheC=${totalUsage.cacheCreate}`
  );
  return { passed, failed, total: allChecks.length };
}

async function main() {
  const args = parseArgs();
  const salonId = args.salon || DEFAULT_SALON;
  const cases = loadCases(args.only);
  if (!cases.length) {
    console.error('Нет кейсов в evals/cases/');
    process.exit(1);
  }
  console.log(`Salon: ${salonId}`);
  console.log(`Cases: ${cases.length}`);
  const totals = { passed: 0, failed: 0, total: 0, casesPass: 0, casesFail: 0 };
  for (const { case: c } of cases) {
    try {
      const r = await runCase(c, c.salonId || salonId, args.verbose);
      totals.passed += r.passed;
      totals.failed += r.failed;
      totals.total += r.total;
      if (r.failed === 0) totals.casesPass++;
      else totals.casesFail++;
    } catch (e) {
      console.log(`\n💥 ERROR  ${c.name}: ${(e as Error).message}`);
      totals.casesFail++;
    }
  }
  console.log(`\n────────`);
  console.log(`Cases:   ${totals.casesPass} pass / ${totals.casesFail} fail`);
  console.log(`Asserts: ${totals.passed} pass / ${totals.failed} fail (всего ${totals.total})`);
  process.exit(totals.casesFail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
