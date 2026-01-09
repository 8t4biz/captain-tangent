export type TestInput = {
  type: "landing" | "form" | "micro-app";
  effort: "S" | "M" | "L";
  target: number;
  result?: number;
  n?: number;
  confidence?: number;
};

export type Verdict = "Kill" | "Iterate" | "Double-Down" | null;

export type TestOutput = {
  verdict: Verdict;
  rationale: string;
  evidenceLevel: "low" | "medium" | "high";
};
