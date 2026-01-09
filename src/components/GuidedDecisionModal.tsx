import { useState, useEffect } from 'react';
import { Modal } from './Modal';
import type { TestInput, TestOutput } from '../lib/types';
import { computeVerdict } from '../lib/decisionRules';
import { verdictColor, getEvidenceLevelColor, getEvidenceLevelIcon } from '../lib/ui';
import { Info, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';

interface GuidedDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuggest?: (verdict: TestOutput, input: TestInput) => void;
}

export function GuidedDecisionModal({ isOpen, onClose, onSuggest }: GuidedDecisionModalProps) {
  const [step, setStep] = useState<1 | 2>(1);

  const [input, setInput] = useState<TestInput>({
    type: 'landing',
    effort: 'M',
    target: 10,
  });

  const [preview, setPreview] = useState<TestOutput | null>(null);

  useEffect(() => {
    const computed = computeVerdict(input);
    setPreview(computed);
  }, [input]);

  const updateField = <K extends keyof TestInput>(field: K, value: TestInput[K]) => {
    setInput((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setInput({
      type: 'landing',
      effort: 'M',
      target: 10,
    });
    setStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const hasNumericData = input.result !== undefined && input.n !== undefined;
  const isStep1Valid = input.target > 0;

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Guided Decision Suggestor">
      <div className="space-y-6" role="form" aria-label="Guided decision form">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p>Let's gather some context about your test to suggest the best decision.</p>
            </div>

            <div>
              <label htmlFor="test-type" className="block text-sm font-medium text-slate-700 mb-1.5">
                Test type <span className="text-red-500">*</span>
              </label>
              <select
                id="test-type"
                value={input.type}
                onChange={(e) => updateField('type', e.target.value as TestInput['type'])}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                aria-label="Select test type"
              >
                <option value="landing">Landing Page</option>
                <option value="form">Form / Flow</option>
                <option value="micro-app">Micro-App</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">What kind of test are you running?</p>
            </div>

            <div>
              <label htmlFor="target" className="block text-sm font-medium text-slate-700 mb-1.5">
                Target (%) <span className="text-red-500">*</span>
              </label>
              <input
                id="target"
                type="number"
                min="0.1"
                step="0.1"
                value={input.target}
                onChange={(e) => updateField('target', parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="e.g., 10"
                aria-label="Target percentage"
                required
              />
              <p className="mt-1 text-xs text-slate-500">Your success threshold</p>
            </div>

            <div>
              <label htmlFor="effort" className="block text-sm font-medium text-slate-700 mb-1.5">
                Effort <span className="text-red-500">*</span>
              </label>
              <select
                id="effort"
                value={input.effort}
                onChange={(e) => updateField('effort', e.target.value as TestInput['effort'])}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                aria-label="Select effort level"
              >
                <option value="S">Small (S) - Quick win, low investment</option>
                <option value="M">Medium (M) - Moderate effort</option>
                <option value="L">Large (L) - Significant investment</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">How much work did this require?</p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStep1Valid}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600"
                aria-label="Continue to step 2"
              >
                Next
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p>Now add your results. Have data? Enter it below. No data yet? Use the confidence slider.</p>
            </div>

            <div>
              <label htmlFor="result" className="block text-sm font-medium text-slate-700 mb-1.5">
                Result (%)
              </label>
              <input
                id="result"
                type="number"
                min="0"
                step="0.1"
                value={input.result ?? ''}
                onChange={(e) => updateField('result', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="Leave blank if no data yet"
                aria-label="Result percentage"
              />
              <p className="mt-1 text-xs text-slate-500">The conversion rate you observed</p>
            </div>

            <div>
              <label htmlFor="exposure-n" className="block text-sm font-medium text-slate-700 mb-1.5">
                Exposure (n)
              </label>
              <input
                id="exposure-n"
                type="number"
                min="0"
                step="1"
                value={input.n ?? ''}
                onChange={(e) => updateField('n', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                placeholder="e.g., 150"
                aria-label="Number of exposures"
              />
              <p className="mt-1 text-xs text-slate-500">How many people saw this test?</p>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="mb-2 flex items-center gap-2">
                <label htmlFor="confidence-slider" className="text-sm font-medium text-slate-700">
                  No numbers? Rate your confidence
                </label>
                <button
                  type="button"
                  className="group relative"
                  aria-label="Information about confidence slider"
                >
                  <Info size={16} className="text-slate-400 hover:text-slate-600" />
                  <span className="pointer-events-none absolute -top-12 left-1/2 z-10 w-48 -translate-x-1/2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Use this if you don't have numeric results yet. Slide to express how confident you feel.
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-slate-500">Low</span>
                <input
                  id="confidence-slider"
                  type="range"
                  min={0}
                  max={100}
                  value={input.confidence ?? 50}
                  onChange={(e) => updateField('confidence', parseInt(e.target.value))}
                  disabled={hasNumericData}
                  className="flex-1 accent-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Confidence level slider"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={input.confidence ?? 50}
                />
                <span className="text-xs font-medium text-slate-500">High</span>
              </div>
              <div className="mt-2 text-center">
                <span className="text-lg font-semibold text-slate-800">{input.confidence ?? 50}%</span>
                <span className="ml-1 text-sm text-slate-600">confidence</span>
              </div>
              {hasNumericData && (
                <p className="mt-2 text-xs text-slate-600">Disabled: Using numeric data instead</p>
              )}
            </div>

            {preview && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 rounded-xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-600" />
                  <div className="text-sm font-semibold text-slate-700">Suggested Verdict</div>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                      verdictColor(preview.verdict || '—')
                    }`}
                    role="status"
                    aria-label={`Verdict: ${preview.verdict || 'Not determined'}`}
                  >
                    {preview.verdict || '—'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500">Evidence:</span>
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${getEvidenceLevelColor(preview.evidenceLevel)}`}>
                      <span>{getEvidenceLevelIcon(preview.evidenceLevel)}</span>
                      <span>{preview.evidenceLevel}</span>
                    </span>
                  </div>
                </div>
                <div className="rounded-lg bg-white border border-slate-100 p-3 text-sm text-slate-700 leading-relaxed">
                  {preview.rationale}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500 italic">Preview only — not saved</span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>Based on {hasNumericData ? 'numeric data' : 'confidence'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center gap-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                aria-label="Go back to step 1"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Cancel
                </button>
                {onSuggest && preview && preview.verdict && (
                  <button
                    type="button"
                    onClick={() => onSuggest(preview, input)}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-lg hover:scale-105 active:scale-100"
                    title="Apply this verdict to your variant"
                    aria-label="Apply suggested verdict"
                  >
                    <Sparkles size={16} />
                    Apply Suggestion
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
