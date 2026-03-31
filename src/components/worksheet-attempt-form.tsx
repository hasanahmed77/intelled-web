"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { submitAttemptAction } from "@/app/actions/worksheet";
import { ConfettiBurst } from "@/components/confetti-burst";
import { LoadingBar } from "@/components/loading-bar";
import { MathText } from "@/components/math-text";
import { MathAnswerInput } from "@/components/math-answer-input";

type Question = {
  id: string;
  prompt: string;
  order: number;
};

type Result = {
  index: number;
  isCorrect: boolean;
  feedback: string;
  correctAnswer: string;
};

export function WorksheetAttemptForm({
  worksheetId,
  difficulty,
  language,
  username,
  questions,
  submitted,
  initialAnswers,
  initialResult
}: {
  worksheetId: string;
  difficulty: "easy" | "medium" | "hard";
  language: "english" | "bengali";
  username: string;
  questions: Question[];
  submitted: boolean;
  initialAnswers: Record<string, string>;
  initialResult: { score: number; details: Result[] } | null;
}) {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(submitted);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [result, setResult] = useState<{ score: number; details: Result[] } | null>(
    initialResult
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasCelebratedRef = useRef(Boolean(initialResult && initialResult.score >= 90));
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  useEffect(() => {
    if (!result || result.score < 90 || hasCelebratedRef.current) {
      return;
    }

    hasCelebratedRef.current = true;
    setConfettiTrigger((current) => current + 1);
  }, [result]);

  const handleSubmit = () => {
    if (isSubmitted) {
      setError("This problem set has already been submitted.");
      return;
    }

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
        language,
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
      setIsSubmitted(true);
    });
  };

  return (
    <div className="space-y-6">
      <ConfettiBurst triggerKey={confettiTrigger} recipientName={username} />
      <div className="card space-y-4 p-6">
        <LoadingBar active={isPending} />
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3 border-b border-ink-800 pb-4 last:border-b-0 last:pb-0">
            <p className="text-sm text-muted">Question {index + 1}</p>
            <MathText content={question.prompt} className="text-lg" />
            <MathAnswerInput
              placeholder="Your answer"
              value={answers[question.id] ?? ""}
              disabled={isSubmitted}
              onChange={(nextValue) => setAnswers((prev) => ({ ...prev, [question.id]: nextValue }))}
            />
            {result ? (
              <div className="rounded-xl border border-ink-700 bg-ink-950/60 p-4 text-sm">
                {(() => {
                  const detail = result.details.find((d) => d.index === question.order);
                  if (!detail) return null;
                  const feedback = detail.feedback.trim();
                  const normalizedFeedback = feedback.toLowerCase();
                  const showFeedback =
                    feedback.length > 0 && !(detail.isCorrect && normalizedFeedback === "correct.");
                  const showCorrectAnswer =
                    !detail.isCorrect && detail.correctAnswer.trim().length > 0;

                  return (
                    <>
                      <p className={detail.isCorrect ? "text-green-400" : "text-red-400"}>
                        {detail.isCorrect ? "Correct" : "Needs work"}
                      </p>
                      {showFeedback ? (
                        <MathText content={feedback} className="mt-2 text-muted" />
                      ) : null}
                      {showCorrectAnswer ? (
                        <div className="mt-2 text-muted">
                          <span>Correct answer: </span>
                          <MathText content={detail.correctAnswer} className="inline" />
                        </div>
                      ) : null}
                    </>
                  );
                })()}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-400">ERROR:{error}</p> : null}

      <div className="flex flex-wrap items-center justify-center gap-4 text-center">
        {isSubmitted ? (
          <span className="text-sm text-muted">Submitted</span>
        ) : (
          <button className="button button-primary" onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Evaluating..." : "Evaluate"}
          </button>
        )}
        {result ? (
          <p className="text-sm text-accent">Score: {result.score}%</p>
        ) : null}
      </div>
    </div>
  );
}
