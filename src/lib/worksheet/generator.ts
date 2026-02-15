import type { Difficulty, GeneratedWorksheet } from "@/lib/worksheet/types";

const EASY = [
  "Differentiate f(x) = 3x^2",
  "Differentiate f(x) = 5x - 7",
  "Find the gradient of y = 4x^3",
  "Differentiate y = x^2 + 4x + 1",
  "Differentiate y = 2x^4",
  "Find dy/dx for y = 7x",
  "Differentiate y = x^3 - 3x",
  "Find the derivative of y = 9x^2",
  "Differentiate y = 12x^5",
  "Differentiate y = 6x^2 + 2"
];

const MEDIUM = [
  "Differentiate f(x) = 3x^4 - 2x^2 + 8",
  "Find dy/dx for y = (2x - 1)^3",
  "Differentiate y = 5x^3 + 4x^{-1}",
  "Differentiate y = 8x^5 - 3x",
  "Differentiate y = (x^2 + 3x)^2",
  "Find dy/dx for y = 6x^2 - 4x^{-2}",
  "Differentiate y = 2x^4 + x^2 - 9",
  "Differentiate y = 7x^{-3} + 2x",
  "Find dy/dx for y = (3x^2 - 1)^2",
  "Differentiate y = 9x^2 + 5x + 4"
];

const HARD = [
  "Differentiate y = (2x^3 - x + 1)(x^2 - 4)",
  "Find dy/dx for y = (3x - 2)^4",
  "Differentiate y = (x^2 + 1)^3",
  "Differentiate y = 5x^4 - 3x^{-2} + 7x",
  "Find dy/dx for y = (2x^2 - 3x + 1)^2",
  "Differentiate y = x^5 + 4x^2 - 6x^{-1}",
  "Differentiate y = (x^3 - 2x)^2",
  "Find dy/dx for y = (4x - 1)(x^3 + 2)",
  "Differentiate y = (x^2 - 5)^3",
  "Find dy/dx for y = (2x^2 + 3x - 1)(x - 4)"
];

const ANSWERS: Record<Difficulty, string[]> = {
  easy: [
    "6x",
    "5",
    "12x^2",
    "2x + 4",
    "8x^3",
    "7",
    "3x^2 - 3",
    "18x",
    "60x^4",
    "12x"
  ],
  medium: [
    "12x^3 - 4x",
    "6(2x - 1)^2",
    "15x^2 - 4x^{-2}",
    "40x^4 - 3",
    "2(x^2 + 3x)(2x + 3)",
    "12x + 8x^{-3}",
    "8x^3 + 2x",
    "-21x^{-4} + 2",
    "2(3x^2 - 1)(6x)",
    "18x + 5"
  ],
  hard: [
    "(6x^2 - 1)(x^2 - 4) + (2x^3 - x + 1)(2x)",
    "12(3x - 2)^3",
    "3(x^2 + 1)^2(2x)",
    "20x^3 + 6x^{-3} + 7",
    "2(2x^2 - 3x + 1)(4x - 3)",
    "5x^4 + 8x + 6x^{-2}",
    "2(x^3 - 2x)(3x^2 - 2)",
    "4(x^3 + 2) + (4x - 1)(3x^2)",
    "3(x^2 - 5)^2(2x)",
    "(4x - 1) + (2x^2 + 3x - 1)"
  ]
};

export function generateWorksheet(topic: string, difficulty: Difficulty) {
  const prompts = difficulty === "easy" ? EASY : difficulty === "medium" ? MEDIUM : HARD;
  const answers = ANSWERS[difficulty];

  const questions = prompts.map((prompt, qIndex) => {
    const answer = answers[qIndex] ?? "";
    return {
      id: crypto.randomUUID(),
      prompt: `${prompt}`,
      answer,
      feedback: `Review the differentiation rules applied to: ${prompt}.`,
      order: qIndex + 1
    };
  });

  const worksheet: GeneratedWorksheet = {
    title: "Worksheet",
    topic,
    difficulty,
    questions
  };

  return worksheet;
}
