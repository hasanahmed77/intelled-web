import { gradeWorksheetWithOpenAI } from "@/lib/openai";

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

export async function gradeAnswers(params: {
  questions: {
    index: number;
    prompt: string;
    userAnswer: string;
  }[];
}) {
  const results = await gradeWorksheetWithOpenAI({
    questions: params.questions.map((q) => ({
      index: q.index,
      prompt: q.prompt,
      userAnswer: q.userAnswer
    }))
  });

  return params.questions.map((q) => {
    const ai = results.find((r) => r.index === q.index);
    if (!ai) {
      throw new Error("AI grading returned incomplete results.");
    }

    const user = normalize(q.userAnswer);
    const expected = normalize(ai.correctAnswer);
    const sameAnswer = expected.length > 0 && user === expected;
    const isCorrect = ai.isCorrect || sameAnswer;

    return {
      index: q.index,
      prompt: q.prompt,
      userAnswer: q.userAnswer,
      feedback: isCorrect ? "" : ai.feedback,
      isCorrect,
      correctAnswer: isCorrect ? "" : ai.correctAnswer
    };
  });
}
