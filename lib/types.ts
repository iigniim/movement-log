export type RiskLevel = "low" | "mid" | "high";

export type Member = {
  id: string;
  trainer_id: string | null;
  user_id: string | null;
  name: string | null;
  birth_date: string | null;
  gender: string | null;
};

export type ParqAnswer = {
  id: number;
  answer: boolean; // true = 예(yes)
};

export type Questionnaire = {
  id: string;
  member_id: string;
  parq_answers: ParqAnswer[];
  injury_history: string | null;
  surgery_history: string | null;
  chronic_condition: string | null;
  risk_level: RiskLevel | null;
  is_latest: boolean;
  created_at: string;
};
