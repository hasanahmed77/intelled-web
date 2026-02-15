"use client";

import { useState, useTransition } from "react";
import { generateWorksheetsAction } from "@/app/actions/worksheet";

export function PracticeForm() {
  const [state, setState] = useState<{ ok?: boolean; error?: string }>({});
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="card space-y-4 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await generateWorksheetsAction(formData);
          setState(result);
        });
      }}
    >
      <div>
        <label className="text-sm text-muted">Worksheet prompt</label>
        <input
          name="topic"
          className="input mt-2"
          placeholder="A level Edexcel pure mathematics 1 differentiation mastery"
          required
        />
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
        <p className="text-sm text-accent">Generated. Scroll down to view worksheets.</p>
      ) : null}
      <button className="button button-primary" type="submit" disabled={isPending}>
        {isPending ? "Generating..." : "Generate 10 worksheets"}
      </button>
    </form>
  );
}
