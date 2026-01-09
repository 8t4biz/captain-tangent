import { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useVariants } from './hooks/useVariants';
import type { Status, Verdict, Variant, Channel } from './lib/database.types';
import { Modal } from './components/Modal';
import { VariantForm } from './components/VariantForm';
import { AuthPage } from './components/AuthPage';
import { UserMenu } from './components/UserMenu';
import { DropdownMenu } from './components/DropdownMenu';
import { GuidedDecisionModal } from './components/GuidedDecisionModal';
import { toISODate, weekStartMonday, formatDate, verdictOf, verdictColor, statusColor, startOfWeekMonday, isSameCalendarWeek, channelColor, suggestVerdictFrom } from './lib/utils';
import type { SuggestResult } from './lib/database.types';
import { MoreVertical, Edit2, Copy, Trash2, CheckCircle } from 'lucide-react';

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

function Pill({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
      {text}
    </span>
  );
}

function SectionCard({ title, subtitle, right, children }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm overflow-visible">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const authLoading = false;
const user = true;

  const [tab, setTab] = useState<'library' | 'decisions'>('library');
  const { variants, loading, error, updateVariant, addVariant, deleteVariant } = useVariants();
  const [q, setQ] = useState('');
  const [mvpFilter, setMvpFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [channelFilter, setChannelFilter] = useState<'All' | Channel>('All');
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showAllReviewItems, setShowAllReviewItems] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuTriggerRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [_events, setEvents] = useState<any[]>([]);
  const [suggest, setSuggest] = useState<{ open: boolean; v: Variant | null; res?: SuggestResult }>({
    open: false,
    v: null,
  });
  const [guidedModal, setGuidedModal] = useState<{ open: boolean; v: Variant | null }>({
    open: false,
    v: null,
  });

  const weekStart = useMemo(() => startOfWeekMonday(), []);

  const mvps = useMemo(() => ['All', ...Array.from(new Set(variants.map((r) => r.mvp).filter(Boolean)))], [variants]);

  function track(type: string, payload: any = {}) {
    const evt = { type, at: new Date().toISOString(), ...payload };
    console.log('[event]', evt);
    setEvents((e) => [evt, ...e].slice(0, 200));
  }

  function openSuggest(v: Variant) {
    const res = suggestVerdictFrom(v);
    setSuggest({ open: true, v, res });
    track('suggest_open', { id: v.id, name: v.name });
  }

  function openGuidedModal(v: Variant) {
    setGuidedModal({ open: true, v });
    track('guided_modal_open', { id: v.id, name: v.name });
  }

  async function applyGuidedVerdict(output: any, input: any) {
    if (!guidedModal.v || !output.verdict) return;
    try {
      await updateVariant(guidedModal.v.id, { verdict_manual: output.verdict });
      setSuccessMessage(`Guided verdict applied: ${output.verdict}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setGuidedModal({ open: false, v: null });
      track('guided_verdict_apply', {
        id: guidedModal.v.id,
        verdict: output.verdict,
        rationale: output.rationale,
        evidenceLevel: output.evidenceLevel,
        input
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to apply verdict');
      setTimeout(() => setFormError(null), 5000);
    }
  }

  const filtered = useMemo(
    () =>
      variants.filter((r) => {
        const mi = mvpFilter === 'All' || r.mvp === mvpFilter;
        const si = statusFilter === 'All' || r.status === statusFilter;
        const qi = !q || r.name.toLowerCase().includes(q.toLowerCase());
        const ci = channelFilter === 'All' || r.channel === channelFilter;
        return mi && si && qi && ci;
      }),
    [variants, q, mvpFilter, statusFilter, channelFilter]
  );

  const allReviewVariants = useMemo(
    () => variants.filter((r) => r.status === 'Review'),
    [variants]
  );

  const decisionsThisWeek = useMemo(
    () => showAllReviewItems
      ? allReviewVariants
      : variants.filter((r) => r.status === 'Review' && isSameCalendarWeek(r.week, weekStart)),
    [variants, weekStart, showAllReviewItems, allReviewVariants]
  );

  const groups: Record<Verdict, Variant[]> = useMemo(() => {
    const g: Record<Verdict, Variant[]> = { 'Double-Down': [], Iterate: [], Kill: [], '—': [] };
    decisionsThisWeek.forEach((r) => g[verdictOf(r)].push(r));
    return g;
  }, [decisionsThisWeek]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'n' && !isModalOpen) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT') {
          e.preventDefault();
          handleOpenModal();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isModalOpen]);

  const markDecided = async (id: string) => {
    const v = variants.find((x) => x.id === id);
    if (!v) return;

    if (!v.owner || !v.next_action || !v.due) {
      setEditingVariant({ ...v, status: 'Decided' });
      setIsModalOpen(true);
      return;
    }

    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await updateVariant(id, { status: 'Decided' });
      setSuccessMessage('Variant marked as decided!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to mark as decided';
      setFormError(errorMsg);
      setTimeout(() => setFormError(null), 5000);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const duplicateAsIteration = async (v: Variant) => {
    const nextMonday = toISODate(weekStartMonday(new Date(new Date(v.week).getTime() + 7 * 86400000)));
    const copy = {
      mvp: v.mvp,
      name: v.name,
      status: 'Inbox' as Status,
      metric: v.metric,
      target: v.target,
      week: nextMonday,
      iteration: (v.iteration || 1) + 1,
      channel: v.channel ?? null,
      channel_detail: v.channel_detail ?? null,
    };

    setIsAddingVariant(true);
    try {
      await addVariant(copy);
      setSuccessMessage('Variant duplicated as next iteration!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to duplicate variant');
      setTimeout(() => setFormError(null), 5000);
    } finally {
      setIsAddingVariant(false);
    }
  };

  const inlineUpdateResult = async (id: string, val: string) => {
    const num = val === '' ? null : Number(val);
    if (val !== '' && Number.isNaN(num)) return;

    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await updateVariant(id, { result: num });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update result');
      setTimeout(() => setFormError(null), 5000);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleOpenModal = () => {
    setFormError(null);
    setEditingVariant(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVariant(null);
    setFormError(null);
  };

  const openEdit = (variant: Variant) => {
    setEditingVariant(variant);
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleFormSubmit = async (formData: any) => {
    setIsAddingVariant(true);
    setFormError(null);
    try {
      if (editingVariant) {
        await updateVariant(editingVariant.id, formData);
        setSuccessMessage('Variant updated!');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        const newVariant = await addVariant(formData);
        if (!newVariant) {
          setFormError('Failed to create variant. Please try again.');
          return;
        }
      }
      setTab('library');
      handleCloseModal();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsAddingVariant(false);
    }
  };

  const handleDelete = async (id: string) => {
    setUpdatingIds((prev) => new Set(prev).add(id));
    try {
      await deleteVariant(id);
      setSuccessMessage('Variant deleted!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setDeleteConfirmId(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete variant';
      setFormError(errorMsg);
      setTimeout(() => setFormError(null), 5000);
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl space-y-4 p-3 sm:space-y-6 sm:p-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>Error:</strong> {error}
          </div>
        )}
        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong>Error:</strong> {formError}
          </div>
        )}
        {successMessage && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            {successMessage}
          </div>
        )}
        <header className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Essentialist MVP Decision Dashboard</h1>
              <p className="text-sm text-slate-500 sm:text-base">One table, two views. Decide fast, act faster.</p>
            </div>
            <UserMenu />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-1.5">
              <button
                onClick={() => setTab('library')}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all sm:text-base ${
                  tab === 'library' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Library
              </button>
              <button
                onClick={() => setTab('decisions')}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-all sm:text-base ${
                  tab === 'decisions' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                Decisions
              </button>
            </div>
            <button
              onClick={handleOpenModal}
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-emerald-700 hover:shadow-lg active:scale-95 transition-all sm:text-base"
              title="Shortcut: N"
            >
              + New Variant
            </button>
          </div>
        </header>

        {tab === 'library' && (
          <SectionCard
            title="Variant Library"
            subtitle="Your single source of truth"
            right={
              <div className="hidden md:flex items-center gap-2 rounded-lg border border-slate-300 bg-white p-1">
                <button
                  onClick={() => setViewMode('simple')}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === 'simple' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Simple
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === 'detailed' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Detailed
                </button>
              </div>
            }
          >
            {(() => {
              const reviewedByChannel = filtered.filter(r => r.status === 'Review' && r.result !== undefined && r.channel);
              const channelStats = Array.from(
                reviewedByChannel.reduce((m, r) => {
                  const key = r.channel!;
                  const v = m.get(key) ?? { total: 0, wins: 0 };
                  v.total += 1;
                  v.wins += verdictOf(r) === 'Double-Down' ? 1 : 0;
                  m.set(key, v);
                  return m;
                }, new Map<Channel, { total: number; wins: number }>())
              );

              return channelStats.length > 0 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {channelStats.map(([ch, s]) => (
                    <div key={ch} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
                      <Pill text={ch} className={channelColor(ch)} />
                      <span className="text-slate-700">
                        {s.wins}/{s.total} wins · {Math.round((s.wins / s.total) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}

            <div className="mb-4 flex flex-col gap-3">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search variants..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
              />
              <div className="flex flex-col gap-3 sm:flex-row">
                <select
                  value={mvpFilter}
                  onChange={(e) => setMvpFilter(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                >
                  {mvps.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as Status | 'All')}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                >
                  <option>All</option>
                  <option>Inbox</option>
                  <option>Running</option>
                  <option>Review</option>
                  <option>Decided</option>
                </select>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value as 'All' | Channel)}
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                >
                  <option>All</option>
                  {CHANNELS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-3 md:hidden">
              {filtered.map((r) => {
                const vv = verdictOf(r);
                return (
                  <div
                    key={r.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="break-words font-semibold text-slate-900 text-sm leading-tight mb-1">
                          {r.mvp || 'No MVP'}
                        </div>
                        <div className="break-words text-sm text-slate-600 leading-snug mb-2">
                          {r.name}
                          {r.iteration ? <span className="text-xs text-slate-400 ml-1">· v{r.iteration}</span> : null}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Pill text={r.status} className={statusColor(r.status)} />
                          <Pill text={vv} className={verdictColor(vv)} />
                          {r.channel && <Pill text={r.channel} className={channelColor(r.channel)} />}
                          {r.action_type && (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 whitespace-nowrap">
                              {r.action_type}
                            </span>
                          )}
                        </div>
                      </div>
                      <Pill text={r.metric} className="bg-slate-100 text-slate-700 border-slate-200 text-xs whitespace-nowrap flex-shrink-0" />
                    </div>

                    <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-slate-600">
                          <span className="font-semibold">Target:</span> {r.target}%
                        </div>
                        <div className="text-slate-600">
                          <span className="font-semibold">Result:</span> {r.result ?? '—'}%
                        </div>
                      </div>
                    </div>

                    <details className="mb-3">
                      <summary className="cursor-pointer select-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 min-h-[44px] flex items-center">
                        View details
                      </summary>
                      <div className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        {r.next_action && (
                          <div>
                            <div className="text-xs font-semibold uppercase text-slate-500 mb-1">Next Action</div>
                            <div className="text-sm text-slate-700">{r.next_action}</div>
                          </div>
                        )}
                        {r.notes && r.notes.trim() && (
                          <div>
                            <div className="text-xs font-semibold uppercase text-slate-500 mb-1">Notes</div>
                            <div className="text-sm text-slate-700 whitespace-pre-wrap break-words">{r.notes}</div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-xs font-semibold uppercase text-slate-500 mb-1">Week</div>
                            <div className="text-slate-700">{formatDate(r.week)}</div>
                          </div>
                          {r.owner && (
                            <div>
                              <div className="text-xs font-semibold uppercase text-slate-500 mb-1">Owner</div>
                              <div className="text-slate-700">{r.owner}</div>
                            </div>
                          )}
                          {r.due && (
                            <div>
                              <div className="text-xs font-semibold uppercase text-slate-500 mb-1">Due</div>
                              <div className="text-slate-700">{formatDate(r.due)}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </details>

                    {deleteConfirmId === r.id ? (
                      <div className="rounded-lg border-2 border-rose-200 bg-rose-50 p-3">
                        <p className="mb-3 text-sm font-medium text-rose-900">Delete this variant?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform min-h-[44px]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={updatingIds.has(r.id)}
                            className="flex-1 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 transition-transform min-h-[44px]"
                          >
                            {updatingIds.has(r.id) ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 active:scale-95 transition-transform min-h-[44px]"
                        >
                          Edit variant
                        </button>
                        <div className="flex gap-2">
                          <button
                            onClick={() => duplicateAsIteration(r)}
                            disabled={isAddingVariant}
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 transition-transform min-h-[44px]"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(r.id)}
                            className="rounded-lg border border-rose-200 bg-white px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 active:scale-95 transition-transform min-h-[44px]"
                          >
                            Delete
                          </button>
                        </div>
                        {r.status !== 'Decided' && (
                          <>
                            <div className="flex gap-2">
                              <button
                                onClick={() => openGuidedModal(r)}
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform min-h-[44px]"
                              >
                                Guided
                              </button>
                              <button
                                onClick={() => openSuggest(r)}
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform min-h-[44px]"
                              >
                                Pro
                              </button>
                            </div>
                            <button
                              onClick={() => markDecided(r.id)}
                              disabled={updatingIds.has(r.id)}
                              className="w-full rounded-lg border-2 border-emerald-600 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 transition-transform min-h-[44px]"
                            >
                              {updatingIds.has(r.id) ? 'Saving...' : 'Mark decided'}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="px-3 py-3 font-semibold">MVP</th>
                    <th className="px-3 py-3 font-semibold">Name</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Channel</th>
                    <th className="px-3 py-3 font-semibold">Metric</th>
                    <th className="px-3 py-3 font-semibold">Target</th>
                    <th className="px-3 py-3 font-semibold">Result</th>
                    {viewMode === 'detailed' && <th className="px-3 py-3 font-semibold">Week</th>}
                    <th className="px-3 py-3 font-semibold">Verdict</th>
                    {viewMode === 'detailed' && <th className="px-3 py-3 font-semibold">Owner</th>}
                    <th className="px-3 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filtered.map((r) => {
                    const vv = verdictOf(r);
                    const isMenuOpen = openMenuId === r.id;
                    return (
                      <tr
                        key={r.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="px-3 py-3 text-slate-700">{r.mvp || '—'}</td>
                        <td className="px-3 py-3 font-medium text-slate-900">
                          <button
                            onClick={() => openEdit(r)}
                            className="max-w-[280px] truncate text-left hover:underline rounded focus:outline-none focus:ring-2 focus:ring-slate-300"
                            title="Edit variant"
                            aria-label={`Edit ${r.name}`}
                          >
                            {r.name}{' '}
                            {r.iteration ? <span className="text-xs text-slate-400">· v{r.iteration}</span> : null}
                          </button>
                        </td>
                        <td className="px-3 py-3">
                          <Pill text={r.status} className={statusColor(r.status)} />
                        </td>
                        <td className="px-3 py-3">
                          {r.channel ? (
                            <Pill text={r.channel} className={channelColor(r.channel)} />
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-slate-700">{r.metric}</td>
                        <td className="px-3 py-3 text-slate-700">{r.target}%</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <input
                              aria-label="Result percent"
                              value={r.result ?? ''}
                              onChange={(e) => inlineUpdateResult(r.id, e.target.value)}
                              onBlur={(e) => inlineUpdateResult(r.id, e.target.value.trim())}
                              placeholder="—"
                              disabled={updatingIds.has(r.id)}
                              className="w-16 rounded border border-slate-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-50"
                            />
                            <span className="text-slate-500">%</span>
                          </div>
                        </td>
                        {viewMode === 'detailed' && <td className="px-3 py-3 text-slate-700">{formatDate(r.week)}</td>}
                        <td className="px-3 py-3">
                          <Pill text={vv} className={verdictColor(vv)} />
                        </td>
                        {viewMode === 'detailed' && <td className="px-3 py-3 text-slate-700">{r.owner ?? '—'}</td>}
                        <td className="px-3 py-3">
                          <div className="flex justify-end">
                            {deleteConfirmId === r.id ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleDelete(r.id)}
                                  disabled={updatingIds.has(r.id)}
                                  className="rounded bg-rose-600 px-2 py-1 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {updatingIds.has(r.id) ? 'Deleting...' : 'Confirm'}
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  ref={(el) => {
                                    if (el) {
                                      menuTriggerRefs.current.set(r.id, el);
                                    } else {
                                      menuTriggerRefs.current.delete(r.id);
                                    }
                                  }}
                                  onClick={() => setOpenMenuId(isMenuOpen ? null : r.id)}
                                  className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-50"
                                  title="Actions"
                                  aria-expanded={isMenuOpen}
                                  aria-haspopup="true"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                                <DropdownMenu
                                  isOpen={isMenuOpen}
                                  onClose={() => setOpenMenuId(null)}
                                  trigger={menuTriggerRefs.current.get(r.id) || null}
                                  minWidth={192}
                                  className="rounded-lg border border-slate-200 bg-white shadow-lg"
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        openEdit(r);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                      Edit variant
                                    </button>
                                    <button
                                      onClick={() => {
                                        duplicateAsIteration(r);
                                        setOpenMenuId(null);
                                      }}
                                      disabled={isAddingVariant}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Copy className="h-4 w-4" />
                                      Duplicate
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDeleteConfirmId(r.id);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      Delete
                                    </button>
                                    {r.status !== 'Decided' && (
                                      <>
                                        <button
                                          onClick={() => {
                                            openGuidedModal(r);
                                            setOpenMenuId(null);
                                          }}
                                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                          Guided verdict
                                        </button>
                                        <button
                                          onClick={() => {
                                            openSuggest(r);
                                            setOpenMenuId(null);
                                          }}
                                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                          Pro verdict
                                        </button>
                                        <button
                                          onClick={() => {
                                            markDecided(r.id);
                                            setOpenMenuId(null);
                                          }}
                                          disabled={updatingIds.has(r.id)}
                                          className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          <CheckCircle className="h-4 w-4" />
                                          {updatingIds.has(r.id) ? 'Saving...' : 'Mark decided'}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </DropdownMenu>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}

        {tab === 'decisions' && (
          <>
            {showDebugInfo && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-900">Debug Information</h3>
                  <button
                    onClick={() => setShowDebugInfo(false)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                  >
                    Hide
                  </button>
                </div>
                <div className="text-blue-800 space-y-1">
                  <p><strong>Current week start (Monday):</strong> {formatDate(toISODate(weekStart))}</p>
                  <p><strong>Week end (Sunday):</strong> {formatDate(toISODate(new Date(weekStart.getTime() + 6 * 86400000)))}</p>
                  <p><strong>Total variants:</strong> {variants.length}</p>
                  <p><strong>Review status variants (all weeks):</strong> {allReviewVariants.length}</p>
                  <p><strong>Review variants THIS week:</strong> {variants.filter((r) => r.status === 'Review' && isSameCalendarWeek(r.week, weekStart)).length}</p>
                  <p><strong>Show all review items toggle:</strong> {showAllReviewItems ? 'ON' : 'OFF'}</p>
                </div>
                {allReviewVariants.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-700 font-medium">Review variants by week</summary>
                    <div className="mt-2 space-y-1 text-xs">
                      {allReviewVariants.map((v) => (
                        <div key={v.id} className="flex items-center justify-between gap-2 py-1 border-t border-blue-200">
                          <span className="truncate">{v.mvp} - {v.name}</span>
                          <span className={`rounded px-2 py-0.5 ${isSameCalendarWeek(v.week, weekStart) ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                            {formatDate(v.week)} {isSameCalendarWeek(v.week, weekStart) ? '(this week)' : '(different week)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}

            {allReviewVariants.length > 0 && !showAllReviewItems && variants.filter((r) => r.status === 'Review' && isSameCalendarWeek(r.week, weekStart)).length === 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 text-xl sm:text-2xl">💡</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-amber-900 mb-1 text-sm sm:text-base">No review items for this week</h3>
                    <p className="text-xs sm:text-sm text-amber-800 mb-3">
                      You have {allReviewVariants.length} review {allReviewVariants.length === 1 ? 'item' : 'items'} in other weeks.
                      The "This Week Decisions" tab only shows review items where the week field matches this week ({formatDate(toISODate(weekStart))}).
                    </p>
                    <button
                      onClick={() => setShowAllReviewItems(true)}
                      className="rounded-lg bg-amber-600 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-amber-700 active:scale-95 transition-transform"
                    >
                      Show all {allReviewVariants.length} review {allReviewVariants.length === 1 ? 'item' : 'items'}
                    </button>
                  </div>
                </div>
              </div>
            )}

          <SectionCard
            title="This Week Decisions"
            subtitle={showAllReviewItems ? `All review items (${decisionsThisWeek.length})` : `Review items for week of ${formatDate(toISODate(weekStart))} (${decisionsThisWeek.length})`}
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {!showDebugInfo && (
                <button
                  onClick={() => setShowDebugInfo(true)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  Show debug info
                </button>
              )}
              {showAllReviewItems && (
                <button
                  onClick={() => setShowAllReviewItems(false)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
                >
                  Show only this week
                </button>
              )}
            </div>
            <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 lg:grid-cols-3">
              {(['Double-Down', 'Iterate', 'Kill'] as Verdict[]).map((col) => (
                <div key={col} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          col === 'Double-Down' ? 'bg-emerald-500' : col === 'Iterate' ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                      />
                      <h3 className="text-sm font-semibold text-slate-800 sm:text-base">{col}</h3>
                    </div>
                    <Pill text={`${groups[col]?.length || 0}`} className="bg-white text-slate-700 border-slate-200" />
                  </div>
                  <div className="space-y-3">
                    {(groups[col] || []).map((r) => (
                      <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="break-words font-semibold text-slate-900 text-sm leading-tight mb-1">
                              {r.mvp}
                            </div>
                            <div className="break-words text-sm text-slate-600 leading-snug">
                              {r.name}
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                            {r.channel && <Pill text={r.channel} className={channelColor(r.channel)} />}
                            {r.action_type && (
                              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 whitespace-nowrap">
                                {r.action_type}
                              </span>
                            )}
                            <Pill text={r.metric} className="bg-slate-100 text-slate-700 border-slate-200 text-xs whitespace-nowrap" />
                          </div>
                        </div>
                        <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
                          <span className="font-semibold">Target:</span> {r.target}%  •  <span className="font-semibold">Result:</span> {r.result ?? '—'}%
                        </div>
                        <input
                          placeholder="Next action (one line, max 120 chars)"
                          defaultValue={r.next_action || ''}
                          onBlur={(e) => updateVariant(r.id, { next_action: e.target.value })}
                          maxLength={120}
                          className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                        />
                        {r.notes && r.notes.trim() && (
                          <details className="mb-3">
                            <summary className="cursor-pointer select-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 min-h-[44px] flex items-center">
                              View notes
                            </summary>
                            <div className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed break-words">
                              {r.notes}
                            </div>
                          </details>
                        )}
                        <div className="space-y-3">
                          <div className="flex flex-col gap-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase text-slate-500 w-16 flex-shrink-0">Owner</span>
                              <input
                                placeholder="Name"
                                defaultValue={r.owner || ''}
                                onBlur={(e) => updateVariant(r.id, { owner: e.target.value })}
                                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold uppercase text-slate-500 w-16 flex-shrink-0">Due</span>
                              <input
                                type="date"
                                defaultValue={r.due || ''}
                                onChange={(e) => updateVariant(r.id, { due: e.target.value })}
                                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => openGuidedModal(r)}
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform min-h-[44px]"
                            >
                              Guided
                            </button>
                            <button
                              onClick={() => openSuggest(r)}
                              className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-transform min-h-[44px]"
                            >
                              Pro
                            </button>
                          </div>
                          <button
                            onClick={() => markDecided(r.id)}
                            disabled={updatingIds.has(r.id)}
                            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 transition-transform min-h-[44px]"
                          >
                            {updatingIds.has(r.id) ? 'Saving...' : 'Mark decided'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {groups['—'].length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                      <h3 className="text-base font-semibold text-slate-800">Need data</h3>
                    </div>
                    <Pill text={`${groups['—']?.length || 0}`} className="bg-white text-slate-700 border-slate-200" />
                  </div>
                  <div className="space-y-3">
                    {groups['—'].map((r) => (
                      <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="break-words font-semibold text-slate-900 text-sm leading-tight mb-1">
                              {r.mvp}
                            </div>
                            <div className="break-words text-sm text-slate-600 leading-snug">
                              {r.name}
                            </div>
                          </div>
                          <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                            {r.channel && <Pill text={r.channel} className={channelColor(r.channel)} />}
                            <Pill text={r.metric} className="bg-slate-100 text-slate-700 border-slate-200 text-xs whitespace-nowrap" />
                          </div>
                        </div>
                        <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm font-medium text-amber-800">
                          Add results to trigger a verdict
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {decisionsThisWeek.length === 0 && allReviewVariants.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8 text-center">
              <div className="text-3xl sm:text-4xl mb-3">📋</div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No review items yet</h3>
              <p className="text-xs sm:text-sm text-slate-600 mb-4">
                When variants move to "Review" status, they'll appear here for decision-making.
              </p>
              <div className="inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-slate-500 bg-white border border-slate-200 rounded-lg px-2 sm:px-3 py-2">
                <span className="font-medium">Workflow:</span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5">Inbox</span>
                <span>→</span>
                <span className="rounded-full bg-blue-100 px-2 py-0.5">Running</span>
                <span>→</span>
                <span className="rounded-full bg-orange-100 px-2 py-0.5">Review</span>
                <span>→</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5">Decided</span>
              </div>
            </div>
          )}
          </>
        )}

        <footer className="text-center text-[10px] sm:text-xs text-slate-500 px-2">
          <p>Essentialist setup • Keep it to one table and a 10-minute weekly review.</p>
          <p className="mt-1 text-slate-400 sm:hidden">Tap any card to edit</p>
        </footer>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingVariant ? 'Edit Variant' : 'Create New Variant'}
      >
        <VariantForm
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
          onSuggest={editingVariant ? () => openSuggest(editingVariant) : undefined}
          initialData={editingVariant ? {
            mvp: editingVariant.mvp,
            name: editingVariant.name,
            status: editingVariant.status,
            metric: editingVariant.metric,
            target: editingVariant.target,
            result: editingVariant.result ?? undefined,
            week: editingVariant.week,
            next_action: editingVariant.next_action ?? undefined,
            action_type: editingVariant.action_type ?? undefined,
            notes: editingVariant.notes ?? undefined,
            owner: editingVariant.owner ?? undefined,
            due: editingVariant.due ?? undefined,
            channel: editingVariant.channel ?? undefined,
            channel_detail: editingVariant.channel_detail ?? undefined,
            exposure_n: editingVariant.exposure_n ?? undefined,
          } : undefined}
          isSubmitting={isAddingVariant}
          error={formError}
          isEditMode={!!editingVariant}
        />
      </Modal>

      <Modal
        isOpen={suggest.open}
        onClose={() => {
          setSuggest({ open: false, v: null });
          track('suggest_dismiss', {});
        }}
        title="Decision Suggestor"
      >
        {suggest.v && suggest.res && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
              <div className="font-medium text-slate-900">{suggest.v.mvp} — {suggest.v.name}</div>
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
                <div>Metric: <span className="text-slate-900">{suggest.v.metric}</span></div>
                <div>Exposure n: <span className="text-slate-900">{suggest.v.exposure_n ?? '—'}</span></div>
                {suggest.v.baseline_pct !== undefined && suggest.v.baseline_pct !== null && (
                  <div>Baseline: <span className="text-slate-900">{suggest.v.baseline_pct}%</span></div>
                )}
                <div>Result: <span className="text-slate-900">{suggest.v.result}%</span></div>
                {suggest.v.target !== undefined && <div>Target: <span className="text-slate-900">{suggest.v.target}%</span></div>}
                {suggest.v.decision_rule && (
                  <div className="col-span-2">
                    Rule: <span className="text-slate-900">
                      {suggest.v.decision_rule.mode === 'absolute' && `result ≥ ${suggest.v.decision_rule.thresholdPct}% ⇒ Double-Down`}
                      {suggest.v.decision_rule.mode === 'uplift' && `uplift ≥ ${suggest.v.decision_rule.thresholdPct}% ⇒ Double-Down`}
                      {suggest.v.decision_rule.mode === 'uplift+sig' && `uplift ≥ ${suggest.v.decision_rule.thresholdPct}% AND p < ${suggest.v.decision_rule.sig} ⇒ Double-Down`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
              <div className="mb-2 text-slate-700">Suggestion</div>
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <Pill text={suggest.res.verdict} className={verdictColor(suggest.res.verdict)} />
                {suggest.res.upliftPct !== undefined && (
                  <span className="text-slate-600">Uplift ≈ {suggest.res.upliftPct.toFixed(1)}%</span>
                )}
                {suggest.res.pValue !== undefined && (
                  <span className="text-slate-600">p ≈ {suggest.res.pValue.toFixed(3)}</span>
                )}
                {suggest.res.ci95 && (
                  <span className="text-slate-600">
                    95% CI {(suggest.res.ci95[0]*100).toFixed(1)}–{(suggest.res.ci95[1]*100).toFixed(1)}%
                  </span>
                )}
              </div>
              <ul className="list-disc pl-5 text-slate-600 space-y-1">
                {suggest.res.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>

              <div className="mt-3 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setSuggest({ open: false, v: null });
                    track('suggest_dismiss', {});
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  disabled={suggest.res.verdict === '—'}
                  onClick={async () => {
                    if (!suggest.v) return;
                    try {
                      await updateVariant(suggest.v.id, { verdict_manual: suggest.res!.verdict });
                      track('suggest_apply', { id: suggest.v.id, verdict: suggest.res!.verdict });
                      setSuggest({ open: false, v: null });
                    } catch (err) {
                      console.error('Failed to apply suggestion:', err);
                    }
                  }}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply suggestion
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <GuidedDecisionModal
        isOpen={guidedModal.open}
        onClose={() => {
          setGuidedModal({ open: false, v: null });
          track('guided_modal_dismiss', {});
        }}
        onSuggest={applyGuidedVerdict}
      />
    </div>
  );
}