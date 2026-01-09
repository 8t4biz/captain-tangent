import { useState, useEffect, useRef } from 'react';
import type { Status, ActionType, Channel } from '../lib/database.types';
import { toISODate, weekStartMonday } from '../lib/utils';

const CHANNELS: Channel[] = [
  'Twitter',
  'Email',
  'Slack group',
  'Direct outreach',
  'Referral',
  'Organic',
  'Paid',
  'Other',
];

interface VariantFormData {
  mvp: string;
  name: string;
  status: Status;
  metric: string;
  target: number;
  result?: number | null;
  week: string;
  next_action?: string;
  action_type?: ActionType;
  notes?: string;
  owner?: string;
  due?: string;
  channel?: Channel | null;
  channel_detail?: string;
  exposure_n?: number | null;
}

interface VariantFormProps {
  onSubmit: (data: VariantFormData) => Promise<void>;
  onCancel: () => void;
  onSuggest?: () => void;
  initialData?: Partial<VariantFormData>;
  isSubmitting?: boolean;
  error?: string | null;
  isEditMode?: boolean;
}

type FieldKey = 'mvp' | 'week' | 'name' | 'status' | 'metric' | 'target' | 'result' | 'owner' | 'due' | 'next_action' | 'channel';
type FormIssue = { field?: FieldKey; message: string };

function validateFormData(data: VariantFormData): FormIssue[] {
  const issues: FormIssue[] = [];

  if (!data.mvp?.trim()) {
    issues.push({ field: 'mvp', message: 'MVP is required.' });
  }

  if (!data.week) {
    issues.push({ field: 'week', message: 'Week is required.' });
  }

  if (!data.name?.trim()) {
    issues.push({ field: 'name', message: 'Name is required.' });
  }

  if (!data.status) {
    issues.push({ field: 'status', message: 'Status is required.' });
  }

  if (!data.metric) {
    issues.push({ field: 'metric', message: 'Metric is required.' });
  }

  if (!(data.target > 0)) {
    issues.push({ field: 'target', message: 'Target % must be greater than 0.' });
  }

  if (data.next_action && data.next_action.length > 120) {
    issues.push({ field: 'next_action', message: 'Next Action max 120 chars. Put details in Notes.' });
  }

  if (data.status === 'Decided') {
    if (!data.next_action?.trim()) {
      issues.push({ field: 'next_action', message: 'Next Action required to mark Decided.' });
    }
    if (!data.owner?.trim()) {
      issues.push({ field: 'owner', message: 'Owner required to mark Decided.' });
    }
    if (!data.due) {
      issues.push({ field: 'due', message: 'Due date required to mark Decided.' });
    }
  }

  return issues;
}


export function VariantForm({ onSubmit, onCancel, onSuggest, initialData, isSubmitting, error, isEditMode }: VariantFormProps) {
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<VariantFormData>({
    mvp: initialData?.mvp || '',
    name: initialData?.name || '',
    status: initialData?.status || 'Inbox',
    metric: initialData?.metric || 'Conversion %',
    target: initialData?.target || 10,
    result: initialData?.result ?? null,
    week: initialData?.week || toISODate(weekStartMonday()),
    next_action: initialData?.next_action || '',
    action_type: initialData?.action_type || 'Iterate',
    notes: initialData?.notes || '',
    owner: initialData?.owner || '',
    due: initialData?.due || '',
    channel: initialData?.channel ?? null,
    channel_detail: initialData?.channel_detail || '',
    exposure_n: initialData?.exposure_n ?? null,
  });

  const [formIssues, setFormIssues] = useState<FormIssue[]>([]);

  const errorFor = (key: FieldKey) => formIssues.find(i => i.field === key)?.message;
  const hasError = (key: FieldKey) => !!errorFor(key);
  const inputClass = (baseClass: string, err?: string) =>
    err
      ? baseClass.replace('border-slate-300', 'border-rose-300').replace('focus:border-emerald-500', 'focus:border-rose-500').replace('focus:ring-emerald-500/20', 'focus:ring-rose-200')
      : baseClass;

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormIssues([]);

    const issues = validateFormData(formData);
    if (issues.length > 0) {
      setFormIssues(issues);
      return;
    }

    const submissionData = {
      ...formData,
      due: formData.due?.trim() || undefined,
      owner: formData.owner?.trim() || undefined,
      next_action: formData.next_action?.trim() || undefined,
      notes: formData.notes?.trim() || undefined,
      channel_detail: formData.channel_detail?.trim() || undefined,
      exposure_n: formData.exposure_n ?? undefined,
    };

    await onSubmit(submissionData);
  };

  const previewVerdict = () => {
    if (!formData.result || formData.result === null) return '—';
    const r = formData.result;
    if (r >= formData.target) return 'Double-Down';
    if (r <= formData.target * 0.5) return 'Kill';
    return 'Iterate';
  };

  const verdictColor = (verdict: string) => ({
    'Double-Down': 'bg-emerald-100 text-emerald-800 border-emerald-200',
    'Iterate': 'bg-amber-100 text-amber-800 border-amber-200',
    'Kill': 'bg-rose-100 text-rose-800 border-rose-200',
    '—': 'bg-slate-100 text-slate-700 border-slate-200',
  }[verdict] || 'bg-slate-100 text-slate-700 border-slate-200');

  const updateField = <K extends keyof VariantFormData>(field: K, value: VariantFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formIssues.length > 0 && (
        <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800">
          <div className="font-semibold">Please fix {formIssues.length} {formIssues.length > 1 ? 'items' : 'item'}:</div>
          <ul className="mt-1 list-disc pl-5 text-sm">
            {formIssues.map((i, idx) => <li key={idx}>{i.message}</li>)}
          </ul>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="mvp" className="mb-1.5 block text-sm font-medium text-slate-700">
            MVP <span className="text-red-500">*</span>
          </label>
          <input
            id="mvp"
            type="text"
            value={formData.mvp}
            onChange={(e) => updateField('mvp', e.target.value)}
            placeholder="e.g., Paywall"
            className={inputClass('w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20', errorFor('mvp'))}
            required
          />
          {hasError('mvp') && <div className="mt-1 text-[10px] text-rose-600">{errorFor('mvp')}</div>}
        </div>

        <div>
          <label htmlFor="week" className="mb-1.5 block text-sm font-medium text-slate-700">
            Week <span className="text-red-500">*</span>
          </label>
          <input
            id="week"
            type="date"
            value={formData.week}
            onChange={(e) => updateField('week', e.target.value)}
            className={inputClass('w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20', errorFor('week'))}
          />
          {hasError('week') && <div className="mt-1 text-[10px] text-rose-600">{errorFor('week')}</div>}
        </div>
      </div>

      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          ref={nameInputRef}
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="e.g., Homepage CTA Redesign"
          className={inputClass('w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20', errorFor('name'))}
          required
        />
        {hasError('name') && <div className="mt-1 text-[10px] text-rose-600">{errorFor('name')}</div>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className="mb-1.5 block text-sm font-medium text-slate-700">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) => updateField('status', e.target.value as Status)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="Inbox">Inbox</option>
            <option value="Running">Running</option>
            <option value="Review">Review</option>
            <option value="Decided">Decided</option>
          </select>
        </div>

        <div>
          <label htmlFor="metric" className="mb-1.5 block text-sm font-medium text-slate-700">
            Metric <span className="text-red-500">*</span>
          </label>
          <select
            id="metric"
            value={formData.metric}
            onChange={(e) => updateField('metric', e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option>Conversion %</option>
            <option>Activation %</option>
            <option>Free→Paid %</option>
            <option>MRR %</option>
          </select>
        </div>

        <div>
          <label htmlFor="target" className="mb-1.5 block text-sm font-medium text-slate-700">
            Target (%) <span className="text-red-500">*</span>
          </label>
          <input
            id="target"
            type="number"
            min="0"
            step="0.1"
            value={formData.target}
            onChange={(e) => updateField('target', parseFloat(e.target.value) || 0)}
            className={inputClass('w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20', errorFor('target'))}
          />
          {hasError('target') && <div className="mt-1 text-[10px] text-rose-600">{errorFor('target')}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="result" className="mb-1.5 block text-sm font-medium text-slate-700">
            Result (%)
          </label>
          <input
            id="result"
            type="number"
            min="0"
            step="0.1"
            value={formData.result ?? ''}
            onChange={(e) => updateField('result', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder="Leave blank if no data"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div>
          <label htmlFor="exposure_n" className="mb-1.5 block text-sm font-medium text-slate-700">
            Exposure (n)
          </label>
          <input
            id="exposure_n"
            type="number"
            min="0"
            step="1"
            value={formData.exposure_n ?? ''}
            onChange={(e) => updateField('exposure_n', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="e.g., 120"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div>
        <label htmlFor="calc_k" className="mb-1.5 block text-sm font-medium text-slate-700">
          Quick calc (k/n → Result % + n)
        </label>
        <div className="flex gap-2">
          <input
            id="calc_k"
            placeholder="k (successes)"
            type="number"
            min={0}
            onBlur={(e) => {
              const k = Number(e.target.value || 0);
              const n = Number((document.getElementById('calc_n') as HTMLInputElement)?.value || 0);
              if (n > 0) {
                updateField('result', +(k / n * 100).toFixed(2));
                updateField('exposure_n', n);
              }
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <input
            id="calc_n"
            placeholder="n (trials)"
            type="number"
            min={0}
            onBlur={(e) => {
              const n = Number(e.target.value || 0);
              const kEl = document.getElementById('calc_k') as HTMLInputElement;
              const k = Number(kEl?.value || 0);
              if (n > 0) {
                updateField('result', +(k / n * 100).toFixed(2));
                updateField('exposure_n', n);
              }
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="owner" className="mb-1.5 block text-sm font-medium text-slate-700">
            Owner
          </label>
          <input
            id="owner"
            type="text"
            value={formData.owner}
            onChange={(e) => updateField('owner', e.target.value)}
            placeholder="Who's responsible?"
            className={inputClass('w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20', errorFor('owner'))}
          />
          {hasError('owner') && <div className="mt-1 text-[10px] text-rose-600">{errorFor('owner')}</div>}
        </div>

        <div>
          <label htmlFor="due" className="mb-1.5 block text-sm font-medium text-slate-700">
            Due Date
          </label>
          <input
            id="due"
            type="date"
            value={formData.due}
            onChange={(e) => updateField('due', e.target.value)}
            className={inputClass('w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20', errorFor('due'))}
          />
          {hasError('due') && <div className="mt-1 text-[10px] text-rose-600">{errorFor('due')}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="channel" className="mb-1.5 block text-sm font-medium text-slate-700">
            Source / Channel
          </label>
          <select
            id="channel"
            value={formData.channel ?? ''}
            onChange={(e) => updateField('channel', e.target.value ? (e.target.value as Channel) : null)}
            className={inputClass('w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20', errorFor('channel'))}
          >
            <option value="">None</option>
            {CHANNELS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {hasError('channel') && <div className="mt-1 text-[10px] text-rose-600">{errorFor('channel')}</div>}
        </div>

        <div>
          <label htmlFor="channel_detail" className="mb-1.5 block text-sm font-medium text-slate-700">
            Channel Detail (optional)
          </label>
          <input
            id="channel_detail"
            type="text"
            value={formData.channel_detail}
            onChange={(e) => updateField('channel_detail', e.target.value)}
            placeholder="e.g., 'List A', 'IH DMs', 'Cohort 2'"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="action_type" className="mb-1.5 block text-sm font-medium text-slate-700">
            Action Type
          </label>
          <select
            id="action_type"
            value={formData.action_type || 'Iterate'}
            onChange={(e) => updateField('action_type', e.target.value as ActionType)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="Ship">Ship</option>
            <option value="Iterate">Iterate</option>
            <option value="Analyze">Analyze</option>
            <option value="Fix">Fix</option>
            <option value="Pause">Pause</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="next_action" className="mb-1.5 block text-sm font-medium text-slate-700">
            Next Action (max 120 chars)
          </label>
          <input
            id="next_action"
            type="text"
            value={formData.next_action}
            onChange={(e) => updateField('next_action', e.target.value)}
            placeholder="One line: what happens next?"
            maxLength={120}
            className={inputClass('w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20', errorFor('next_action'))}
          />
          {hasError('next_action') ? (
            <div className="mt-1 text-[10px] text-rose-600">{errorFor('next_action')}</div>
          ) : (
            <div className="mt-1 text-xs text-slate-500">
              {formData.next_action?.length || 0}/120
            </div>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-slate-700">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={4}
          placeholder="Context, reasoning, details..."
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {formData.result !== null && formData.result !== undefined && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-2 text-sm font-medium text-slate-700">Verdict preview</div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${verdictColor(previewVerdict())}`}>
              {previewVerdict()}
            </span>
            <span className="text-xs text-slate-500">Based on Result vs Target</span>
          </div>
          <div className="mt-3 flex items-center gap-2">
            {isEditMode && onSuggest && (
              <button
                type="button"
                onClick={onSuggest}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                title="Open Decision Suggestor"
              >
                Suggest verdict
              </button>
            )}
            <span className="ml-auto text-[10px] text-slate-500">Preview only — not saved</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4">
        <div className="text-xs text-slate-500">Shortcut: ⌘/Ctrl+Enter to save</div>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-base font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          {isSubmitting ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Save Changes' : 'Create Variant')}
        </button>
        </div>
      </div>
    </form>
  );
}
