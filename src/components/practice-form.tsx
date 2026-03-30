"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateWorksheetsAction } from "@/app/actions/worksheet";
import { LoadingBar } from "@/components/loading-bar";

const promptExamples = [
  "A Level integration u-substitution",
  "Simultaneous equations mastery",
  "O Level trigonometry revision",
  "SAT English reading practice",
  "GRE math quantitative drills",
  "IELTS writing task structure",
  "SSC physics electricity basics",
  "HSC biology genetics worksheet"
] as const;

const generationSteps = [
  "Sending your topic to the AI",
  "Selecting the right difficulty",
  "Generating the worksheet questions",
  "Preparing your practice session"
] as const;

export function PracticeForm({ username }: { username: string }) {
  const [state, setState] = useState<{ ok?: boolean; error?: string }>({});
  const [isPending, startTransition] = useTransition();
  const [topic, setTopic] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [isHintVisible, setIsHintVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const interval = window.setInterval(() => {
      setIsHintVisible(false);
      window.setTimeout(() => {
        setPlaceholderIndex((current) => (current + 1) % promptExamples.length);
        setIsHintVisible(true);
      }, 240);
    }, 2600);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!isPending) {
      setGenerationStepIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setGenerationStepIndex((current) => (current + 1) % generationSteps.length);
    }, 1600);

    return () => window.clearInterval(interval);
  }, [isPending]);

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            const result = await generateWorksheetsAction(formData);
            setState(result);
            if (result.ok && result.worksheetId) {
              router.push(`/practice/${result.worksheetId}`);
            }
          } catch (error) {
            setState({
              ok: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to generate worksheet."
            });
          }
        });
      }}
    >
      <div className="card space-y-4 p-6">
        <LoadingBar active={isPending} />
        <div>
          <label className="text-sm text-muted">Topic</label>
          <div className="relative mt-2">
            <input
              name="topic"
              className="input relative z-10 bg-ink-950/95 placeholder:text-transparent"
              placeholder=" "
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              required
            />
            {topic.length === 0 ? (
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute left-4 top-1/2 z-20 -translate-y-1/2 text-zinc-500 transition-all duration-300 ease-out ${
                  isHintVisible && !isFocused
                    ? "translate-y-[-50%] opacity-100"
                    : "translate-y-[calc(-50%+6px)] opacity-0"
                }`}
              >
                {promptExamples[placeholderIndex]}
              </span>
            ) : null}
          </div>
        </div>
        <div>
          <label className="text-sm text-muted">Difficulty</label>
          <select name="difficulty" className="input mt-2">
            <option value="auto">Auto (based on performance)</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
        {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
        {state?.ok ? (
          <p className="text-sm text-accent">Generated. Redirecting...</p>
        ) : null}
      </div>
      {isPending ? (
        <div className="mx-auto flex max-w-md items-center justify-center">
          <div className="rounded-2xl border border-accent/20 bg-ink-900/70 px-4 py-3 text-center text-sm text-zinc-300">
            <p className="text-xs uppercase tracking-[0.18em] text-accent/80">Generating</p>
            <p className="mt-2 transition-opacity duration-300">
              {generationSteps[generationStepIndex]}
            </p>
          </div>
        </div>
      ) : null}
      <div className="flex justify-center pt-2">
        <button className="button button-primary" type="submit" disabled={isPending}>
          {isPending ? "Generating..." : "Go!"}
        </button>
      </div>
    </form>
  );
}
