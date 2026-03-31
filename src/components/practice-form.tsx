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
  "HSC biology genetics problem set"
] as const;

const generationSteps = [
  "Sending to the AI...",
  "AI is evaluating...",
  "Tailoring the questions...",
  "Please wait..."
] as const;

export function PracticeForm({
  username,
  generationDisabled = false,
  generationDisabledMessage = null
}: {
  username: string;
  generationDisabled?: boolean;
  generationDisabledMessage?: string | null;
}) {
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

  const isGenerating = isPending;

  useEffect(() => {
    if (!isGenerating) {
      setGenerationStepIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setGenerationStepIndex((current) => Math.min(current + 1, generationSteps.length - 1));
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isGenerating]);

  return (
    <form
      className="relative space-y-4"
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        if (generationDisabled) {
          return;
        }
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
      {isGenerating ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-[3px]">
          <div className="loading-vignette absolute inset-0" />
          <div className="relative mx-4 flex w-full max-w-lg justify-center">
            <div className="loading-heartbeat absolute inset-0 rounded-[1.75rem] bg-accent/10 blur-2xl" />
            <div className="card relative w-full space-y-5 overflow-hidden px-7 py-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
              <LoadingBar active />
              <p className="text-[11px] uppercase tracking-[0.24em] text-white">
                Generating
              </p>
              <p className="animate-status-pulse mt-3 text-lg text-accent transition-opacity duration-500">
                {generationSteps[generationStepIndex]}
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <div className="card space-y-4 p-6">
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
        <div>
          <label className="text-sm text-muted">Language</label>
          <select name="language" className="input mt-2" defaultValue="english">
            <option value="english">English</option>
            <option value="bengali">Bengali</option>
          </select>
        </div>
        {state?.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
        {state?.ok ? (
          <p className="text-sm text-accent">Generated. Redirecting...</p>
        ) : null}
      </div>
      <div className="flex justify-center pt-2">
        <button
          className="button button-primary"
          type="submit"
          disabled={isPending || generationDisabled}
        >
          {isPending ? "Generating..." : generationDisabled ? "Can't go! :(" : "Go!"}
        </button>
      </div>
      {generationDisabledMessage ? (
        <p className="text-center text-sm text-accent">{generationDisabledMessage}</p>
      ) : null}
    </form>
  );
}
