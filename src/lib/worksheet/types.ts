import type { QuestionGradingMetadata } from "@/lib/grading/types";

export type Difficulty = "easy" | "medium" | "hard";
export type DifficultySelection = Difficulty | "auto";
export type WorksheetLanguage = "english" | "bengali";
export type WorksheetSource = "ai" | "static";

export type VennDiagramData = {
  setLabels: [string, string] | string[];
  regions: {
    A_only: string;
    intersection: string;
    B_only: string;
    outside?: string;
  };
};

export type VennThreeDiagramData = {
  setLabels: [string, string, string] | string[];
  regions: {
    A_only: string;
    B_only: string;
    C_only: string;
    AB?: string;
    AC?: string;
    BC?: string;
    ABC?: string;
    A_B?: string;
    A_C?: string;
    B_C?: string;
    A_B_C?: string;
    outside?: string;
  };
};

export type QuestionDiagram =
  | {
      type: "venn2";
      data: VennDiagramData;
    }
  | {
      type: "venn3";
      data: VennThreeDiagramData;
    };

export type GeneratedQuestion = {
  id?: string;
  prompt: string;
  answer: string;
  feedback: string;
  order: number;
  grading?: QuestionGradingMetadata;
};

export type GeneratedWorksheet = {
  title: string;
  topic: string;
  difficulty: Difficulty;
  language: WorksheetLanguage;
  source: WorksheetSource;
  questions: GeneratedQuestion[];
};

export type StaticQuestionBankItem = {
  prompt: string;
  feedback: string;
  correctAnswer: string;
  diagram?: QuestionDiagram;
};
