export function verdictColor(verdict: string | null): string {
  const colors: Record<string, string> = {
    'Double-Down': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Iterate': 'bg-amber-100 text-amber-800 border-amber-200',
    'Kill': 'bg-rose-100 text-rose-800 border-rose-200',
    '—': 'bg-slate-100 text-slate-700 border-slate-200',
  };
  return colors[verdict || '—'] || colors['—'];
}

export function getEvidenceLevelColor(level: 'low' | 'medium' | 'high'): string {
  const colors = {
    high: 'text-emerald-600',
    medium: 'text-amber-600',
    low: 'text-rose-600',
  };
  return colors[level];
}

export function getEvidenceLevelIcon(level: 'low' | 'medium' | 'high'): string {
  const icons = {
    high: '✓✓✓',
    medium: '✓✓',
    low: '✓',
  };
  return icons[level];
}
