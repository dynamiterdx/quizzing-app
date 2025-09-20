export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuizQuestion {
  id: string;
  question: string;
  choices: { id: string; text: string }[];
  correctChoiceId: string;
  explanation: string;
  subtopic?: string;
  difficulty?: Difficulty;
  language?: string;
}

export interface QuizSet {
  topic: string;
  difficulty: Difficulty;
  language: string;
  timed: boolean;
  durationSeconds?: number;
  questions: QuizQuestion[];
}

export interface SubtopicNode {
  id: string;
  name: string;
  children?: SubtopicNode[];
}

export interface DiagnosticPlan {
  topic: string;
  subtopics: SubtopicNode[];
}

export interface SubtopicScore {
  subtopic: string;
  initialScore: number; // 0-100
  latestScore: number; // 0-100
}

export interface PrepSummary {
  topic: string;
  scores: SubtopicScore[];
  pointers: { subtopic: string; tip: string }[];
}

