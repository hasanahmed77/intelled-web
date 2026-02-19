"use client";

import { useState, useTransition } from "react";
import { submitAttemptAction } from "@/app/actions/worksheet";
import { LoadingBar } from "@/components/loading-bar";

type Question = {
  id: string;
  prompt: string;
  order: number;
};

type Result = {
  index: number;
  isCorrect: boolean;
  feedback: string;
};

export function WorksheetAttemptForm({
  worksheetId,
  difficulty,
  questions
}: {
  worksheetId: string;
  difficulty: "easy" | "medium" | "hard";
  questions: Question[];
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ score: number; details: Result[] } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const missing = questions.find(
        (q) => !(answers[q.id] ?? "").trim()
      );
      if (missing) {
        setError("Please answer all questions before submitting.");
        return;
      }

      const payload = {
        worksheetId,
        difficulty,
        questions: questions.map((question) => ({
          index: question.order,
          prompt: question.prompt,
          userAnswer: (answers[question.id] ?? "").trim()
        }))
      };

      const response = await submitAttemptAction(payload);
      if (!response.ok) {
        setError(response.error ?? "Unable to submit answers.");
        return;
      }
      setResult({ score: response.score ?? 0, details: response.details ?? [] });
    });
  };

  return (
    <div className="space-y-6">
      <div className="card space-y-4 p-6">
        <LoadingBar active={isPending} />
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3 border-b border-ink-800 pb-4 last:border-b-0 last:pb-0">
            <p className="text-sm text-muted">Question {index + 1}</p>
            <p className="text-lg">{question.prompt}</p>
            <input
              className="input"
              placeholder="Your answer"
              value={answers[question.id] ?? ""}
              onChange={(event) =>
                setAnswers((prev) => ({ ...prev, [question.id]: event.target.value }))
              }
            />
            {result ? (
              <div className="rounded-xl border border-ink-700 bg-ink-950/60 p-4 text-sm">
                <p className={result.details.find((d) => d.index === question.order)?.isCorrect ? "text-green-400" : "text-red-400"}>
                  {result.details.find((d) => d.index === question.order)?.isCorrect
                    ? "Correct"
                    : "Needs work"}
                </p>
                <p className="mt-2 text-muted">
                  {result.details.find((d) => d.index === question.order)?.feedback ??
                    "Review the concept and try again."}
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-400">ERROR:{error}</p> : null}

      <div className="flex flex-wrap items-center gap-4">
        <button className="button button-primary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Submitting..." : "Submit answers"}
        </button>
        {result ? (
          <p className="text-sm text-accent">Score: {result.score}%</p>
        ) : null}
      </div>
    </div>
  );
}
