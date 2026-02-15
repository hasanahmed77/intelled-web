export type Difficulty = "easy" | "medium" | "hard";
export type DifficultySelection = Difficulty | "auto";

export type GeneratedQuestion = {
  id?: string;
  prompt: string;
  answer: string;
  feedback: string;
  order: number;
};

export type GeneratedWorksheet = {
  title: string;
  topic: string;
  difficulty: Difficulty;
  questions: GeneratedQuestion[];
};
