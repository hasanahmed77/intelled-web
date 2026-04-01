"use client";

import { useEffect, useRef, useState } from "react";
import { submitAttemptAction } from "@/app/actions/worksheet";
import { ConfettiBurst, type ScoreRange } from "@/components/confetti-burst";
import { LoadingBar } from "@/components/loading-bar";
import { MathText } from "@/components/math-text";
import { MathAnswerInput } from "@/components/math-answer-input";
import { QuestionDiagramView } from "@/components/question-diagram";
import type { QuestionDiagram } from "@/lib/worksheet/types";

const evaluationSteps = [
  "Reviewing your answers...",
  "Checking with AI tutor...",
  "Marking your responses...",
  "Calculating your score...",
  "Finalizing results..."
] as const;

function getScoreRange(score: number): ScoreRange {
  if (score === 100) return "perfect";
  if (score >= 90) return "top";
  if (score >= 75) return "high";
  if (score >= 50) return "mid";
  return "low";
}

type Question = {
  id: string;
  prompt: string;
  order: number;
  diagram?: QuestionDiagram | null;
};

type Result = {
  index: number;
  isCorrect: boolean;
  feedback: string;
  correctAnswer: string;
};

export function WorksheetAttemptForm({
  worksheetId,
  username,
  questions,
  submitted,
  initialAnswers,
  initialResult
}: {
  worksheetId: string;
  username: string;
  questions: Question[];
  submitted: boolean;
  initialAnswers: Record<string, string>;
  initialResult: { score: number; details: Result[] } | null;
}) {
  const [isSubmitted, setIsSubmitted] = useState<boolean>(submitted);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [result, setResult] = useState<{ score: number; details: Result[] } | null>(initialResult);
  const [error, setError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalStepIndex, setEvalStepIndex] = useState(0);
  const hasCelebratedRef = useRef(Boolean(initialResult));
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [scoreRange, setScoreRange] = useState<ScoreRange>(
    initialResult ? getScoreRange(initialResult.score) : "top"
  );
  const scoreRef = useRef<HTMLDivElement>(null);

  // Cycle through step messages while evaluating
  useEffect(() => {
    if (!isEvaluating) {
      setEvalStepIndex(0);
      return;
    }
    const interval = window.setInterval(() => {
      setEvalStepIndex((current) => Math.min(current + 1, evaluationSteps.length - 1));
    }, 4000);
    return () => window.clearInterval(interval);
  }, [isEvaluating]);

  // Trigger celebration and scroll to score once result lands
  useEffect(() => {
    if (!result || hasCelebratedRef.current) return;
    hasCelebratedRef.current = true;
    setScoreRange(getScoreRange(result.score));
    setConfettiTrigger((current) => current + 1);
    window.setTimeout(() => {
      scoreRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  }, [result]);

  const handleSubmit = async () => {
    if (isSubmitted) {
      setError("This problem set has already been submitted.");
      return;
    }

    const missing = questions.find((q) => !(answers[q.id] ?? "").trim());
    if (missing) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setError(null);
    setIsEvaluating(true);

    try {
      const payload = {
        worksheetId,
        questions: questions.map((question) => ({
          index: question.order,
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
      window.dispatchEvent(new CustomEvent("streak-changed"));
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      <ConfettiBurst triggerKey={confettiTrigger} recipientName={username} scoreRange={scoreRange} />

      {/* Fullscreen evaluation overlay */}
      {isEvaluating ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 backdrop-blur-[3px]">
          <div className="loading-vignette absolute inset-0" />
          <div className="relative mx-4 flex w-full max-w-lg justify-center">
            <div className="loading-heartbeat absolute inset-0 rounded-[1.75rem] bg-accent/10 blur-2xl" />
            <div className="card relative w-full space-y-5 overflow-hidden px-7 py-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
              <LoadingBar active />
              <p className="text-[11px] uppercase tracking-[0.24em] text-white">
                Evaluating
              </p>
              <p className="animate-status-pulse mt-3 text-lg text-accent transition-opacity duration-500">
                {evaluationSteps[evalStepIndex]}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card space-y-4 p-6">
        <LoadingBar active={isEvaluating} />
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-3 border-b border-ink-800 pb-4 last:border-b-0 last:pb-0">
            <p className="text-sm text-muted">Question {index + 1}</p>
            <MathText content={question.prompt} className="text-lg" />
            {question.diagram ? <QuestionDiagramView diagram={question.diagram} /> : null}
            <MathAnswerInput
              placeholder="Your answer"
              value={answers[question.id] ?? ""}
              disabled={isSubmitted || isEvaluating}
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

      {error ? <p className="text-sm text-red-400">ERROR: {error}</p> : null}

      <div ref={scoreRef} className="flex flex-wrap items-center justify-center gap-4 text-center">
        {isSubmitted ? (
          <span className="text-sm text-muted">Submitted</span>
        ) : (
          <button
            type="button"
            className="button button-primary"
            onClick={handleSubmit}
            disabled={isEvaluating}
          >
            Evaluate
          </button>
        )}
        {result ? (
          <p className="text-sm text-accent">Score: {result.score}%</p>
        ) : null}
      </div>
    </div>
  );
}
