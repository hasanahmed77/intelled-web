import { gradeWorksheetWithOllama } from "@/lib/ollama";

export async function gradeAnswers(params: {
  questions: {
    index: number;
    prompt: string;
    userAnswer: string;
  }[];
}) {
  const results = await gradeWorksheetWithOllama({
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

    return {
      index: q.index,
      prompt: q.prompt,
      userAnswer: q.userAnswer,
      feedback: ai.feedback,
      isCorrect: ai.isCorrect
    };
  });
}
