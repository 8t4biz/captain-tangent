import { Variant, Verdict, Channel, SuggestResult } from './database.types';
import { verdictColor as verdictColorUI } from './ui';

export const weekStartMonday = (d = new Date()) => {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - diff);
  return x;
};

export const toISODate = (d: Date) => d.toISOString().slice(0, 10);

export const isMonday = (iso: string) => {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay() === 1;
};

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : '';

export const clampPct = (n?: number | null) => {
  if (n === undefined || n === null || Number.isNaN(n)) return undefined;
  return Math.max(0, Math.min(1000, n));
};

export const autoVerdict = (v: Variant): Verdict => {
  const r = clampPct(v.result);
  if (r === undefined) return '—';
  if (r >= v.target) return 'Double-Down';
  if (r <= v.target * 0.5) return 'Kill';
  return 'Iterate';
};

export const verdictOf = (v: Variant): Verdict => v.verdict_manual ?? autoVerdict(v);

export const verdictColor = verdictColorUI;

export const statusColor = (status: string) =>
  ({
    Inbox: 'bg-slate-100 text-slate-700 border-slate-200',
    Running: 'bg-blue-100 text-blue-800 border-blue-200',
    Review: 'bg-orange-100 text-orange-800 border-orange-200',
    Decided: 'bg-green-100 text-green-800 border-green-200',
  }[status] || 'bg-slate-100 text-slate-700 border-slate-200');

export const normalizeAction = (nextAction?: string | null) => {
  const s = (nextAction ?? '').trim().replace(/\s+/g, ' ');
  const MAX = 120;
  if (!s) return { next: '', overflow: '' };
  return s.length <= MAX
    ? { next: s, overflow: '' }
    : { next: s.slice(0, MAX).trim() + '…', overflow: s.slice(MAX).trim() };
};

export const startOfWeekMonday = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const diff = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - diff);
  return x;
};

export const isSameCalendarWeek = (iso: string, weekStart: Date) => {
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return d >= weekStart && d <= end;
};

export const channelColor = (c?: Channel | null) =>
  ({
    'Twitter': 'bg-sky-50 text-sky-700 border-sky-200',
    'Email': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Slack group': 'bg-violet-50 text-violet-700 border-violet-200',
    'Direct outreach': 'bg-amber-50 text-amber-700 border-amber-200',
    'Referral': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Organic': 'bg-teal-50 text-teal-700 border-teal-200',
    'Paid': 'bg-rose-50 text-rose-700 border-rose-200',
    'Other': 'bg-slate-100 text-slate-700 border-slate-200',
  }[c ?? 'Other']);

export const MIN_N = 30;

export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let prob =
    1 -
    d *
      t *
      (1.330274429 +
        t * (-1.821255978 + t * (1.781477937 + t * (-0.356563782 + t * 0.31938153))));
  return x >= 0 ? prob : 1 - prob;
}

export function zTestOneProportion(pHat: number, p0: number, n: number): { z: number; p: number } {
  const se = Math.sqrt((p0 * (1 - p0)) / n);
  if (se === 0) return { z: 0, p: 1 };
  const z = (pHat - p0) / se;
  const p = 1 - normalCdf(z);
  return { z, p };
}

export function ci95ForProportion(pHat: number, n: number): [number, number] {
  const se = Math.sqrt((pHat * (1 - pHat)) / n);
  const m = 1.96 * se;
  return [Math.max(0, pHat - m), Math.min(1, pHat + m)];
}

export function suggestVerdictFrom(v: Variant): SuggestResult {
  const reasons: string[] = [];
  const n = v.exposure_n ?? 0;

  if (v.result === undefined || v.result === null) {
    reasons.push('No Result % yet.');
    return { verdict: '—', reasons };
  }

  const pHat = (v.result ?? 0) / 100;

  if (n < MIN_N) {
    reasons.push(`Insufficient exposure (n=${n} < ${MIN_N}).`);
  }

  const rule = v.decision_rule;
  if (rule?.mode === 'absolute') {
    const ci = ci95ForProportion(pHat, Math.max(n, 1));
    const target = (v.target ?? 0) / 100;
    reasons.push(`95% CI: ${(ci[0]*100).toFixed(1)}% → ${(ci[1]*100).toFixed(1)}% vs target ${v.target ?? 0}%.`);
    if (n >= MIN_N && ci[0] >= target) return { verdict: 'Double-Down', reasons, ci95: ci };
    if (pHat <= target * 0.5) return { verdict: 'Kill', reasons, ci95: ci };
    return { verdict: 'Iterate', reasons, ci95: ci };
  }

  if (rule?.mode === 'uplift' || rule?.mode === 'uplift+sig') {
    const base = (v.baseline_pct ?? 0) / 100;
    if (base <= 0) {
      reasons.push('Missing Baseline % for uplift rule.');
      return { verdict: '—', reasons };
    }
    const uplift = ((pHat - base) / base) * 100;
    reasons.push(`Uplift: ${uplift.toFixed(1)}% (result ${v.result}% vs base ${v.baseline_pct}%).`);

    if (rule.mode === 'uplift+sig') {
      const { p } = zTestOneProportion(pHat, base, Math.max(n, 1));
      reasons.push(`p-value ≈ ${p.toFixed(3)} (one-tailed vs baseline)`);
      const pass = uplift >= rule.thresholdPct && p < rule.sig!;
      if (pass && n >= MIN_N) return { verdict: 'Double-Down', reasons, upliftPct: uplift, pValue: p };
      if (uplift <= 0) return { verdict: 'Kill', reasons, upliftPct: uplift, pValue: p };
      return { verdict: 'Iterate', reasons, upliftPct: uplift, pValue: p };
    } else {
      const pass = uplift >= rule.thresholdPct;
      if (pass && n >= MIN_N) return { verdict: 'Double-Down', reasons, upliftPct: uplift };
      if (uplift <= 0) return { verdict: 'Kill', reasons, upliftPct: uplift };
      return { verdict: 'Iterate', reasons, upliftPct: uplift };
    }
  }

  const target = (v.target ?? 0) / 100;
  const ci = ci95ForProportion(pHat, Math.max(n, 1));
  reasons.push(`95% CI: ${(ci[0]*100).toFixed(1)}% → ${(ci[1]*100).toFixed(1)}% vs target ${v.target ?? 0}%.`);
  if (n >= MIN_N && pHat >= target) return { verdict: 'Double-Down', reasons, ci95: ci };
  if (pHat <= target * 0.5) return { verdict: 'Kill', reasons, ci95: ci };
  return { verdict: 'Iterate', reasons, ci95: ci };
}
