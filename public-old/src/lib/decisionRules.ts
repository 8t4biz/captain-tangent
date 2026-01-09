import { TestInput, TestOutput, Verdict } from './types';

export function computeVerdict(input: TestInput): TestOutput {
  const { result, target, effort, n, confidence } = input;

  let verdict: Verdict = null;
  let rationale = '';
  let evidenceLevel: 'low' | 'medium' | 'high' = 'low';

  if (result !== undefined && n !== undefined) {
    if (result >= target && (effort === 'S' || effort === 'M')) {
      verdict = 'Double-Down';
      rationale = 'Strong result on low/medium effort.';
    } else if (n < 100 && result < 0.5 * target) {
      verdict = 'Kill';
      rationale = 'Low sample and underperforming.';
    } else {
      verdict = 'Iterate';
      rationale = 'Mixed or inconclusive.';
    }
    evidenceLevel = n < 50 ? 'low' : n < 150 ? 'medium' : 'high';
  } else if (confidence !== undefined) {
    if (confidence >= 80 && (effort === 'S' || effort === 'M')) {
      verdict = 'Double-Down';
      rationale = 'High confidence with low/medium effort.';
    } else if (confidence <= 30) {
      verdict = 'Kill';
      rationale = 'Low confidence.';
    } else {
      verdict = 'Iterate';
      rationale = 'Medium confidence, needs testing.';
    }
    evidenceLevel = confidence < 40 ? 'low' : confidence < 70 ? 'medium' : 'high';
  }

  return { verdict, rationale, evidenceLevel };
}
