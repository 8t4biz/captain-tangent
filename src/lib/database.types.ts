export type Status = 'Inbox' | 'Running' | 'Review' | 'Decided';
export type Verdict = 'Double-Down' | 'Iterate' | 'Kill' | '—';
export type ActionType = 'Ship' | 'Iterate' | 'Analyze' | 'Fix' | 'Pause';
export type Channel = 'Twitter' | 'Email' | 'Slack group' | 'Direct outreach' | 'Referral' | 'Organic' | 'Paid' | 'Other';
export type Effort = 'S' | 'M' | 'L' | 'XL';

export type DecisionRuleMode = 'absolute' | 'uplift' | 'uplift+sig';

export interface DecisionRule {
  mode: DecisionRuleMode;
  thresholdPct: number;
  sig?: number;
}

export interface SuggestResult {
  verdict: Verdict;
  reasons: string[];
  upliftPct?: number;
  pValue?: number;
  ci95?: [number, number];
}

export interface Variant {
  id: string;
  user_id: string;
  mvp: string;
  name: string;
  status: Status;
  metric: string;
  target: number;
  result?: number | null;
  week: string;
  verdict?: Verdict | null;
  verdict_manual?: Verdict | null;
  next_action?: string | null;
  action_type?: ActionType | null;
  notes?: string | null;
  owner?: string | null;
  due?: string | null;
  iteration?: number;
  channel?: Channel | null;
  channel_detail?: string | null;
  exposure_n?: number | null;
  baseline_pct?: number | null;
  decision_rule?: DecisionRule | null;
  effort?: Effort | null;
  confidence?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Database {
  public: {
    Tables: {
      variants: {
        Row: Variant;
        Insert: {
          user_id?: string;
          mvp: string;
          name: string;
          status: Status;
          metric: string;
          target: number;
          result?: number | null;
          week: string;
          verdict?: Verdict | null;
          verdict_manual?: Verdict | null;
          next_action?: string | null;
          action_type?: ActionType | null;
          notes?: string | null;
          owner?: string | null;
          due?: string | null;
          iteration?: number;
          channel?: Channel | null;
          channel_detail?: string | null;
          exposure_n?: number | null;
          baseline_pct?: number | null;
          decision_rule?: DecisionRule | null;
          effort?: Effort | null;
          confidence?: number | null;
        };
        Update: {
          user_id?: string;
          mvp?: string;
          name?: string;
          status?: Status;
          metric?: string;
          target?: number;
          result?: number | null;
          week?: string;
          verdict?: Verdict | null;
          verdict_manual?: Verdict | null;
          next_action?: string | null;
          action_type?: ActionType | null;
          notes?: string | null;
          owner?: string | null;
          due?: string | null;
          iteration?: number;
          channel?: Channel | null;
          channel_detail?: string | null;
          exposure_n?: number | null;
          baseline_pct?: number | null;
          decision_rule?: DecisionRule | null;
          effort?: Effort | null;
          confidence?: number | null;
        };
      };
    };
  };
}
