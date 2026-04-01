"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateStaticWorksheetAction } from "@/app/actions/worksheet";
import { LoadingBar } from "@/components/loading-bar";

const generationSteps = [
  "Loading your question bank...",
  "Building your problem set...",
  "Preparing the questions...",
  "Please Wait..."
] as const;

type StaticOption = {
  educationType: string;
  subject: string;
  topic: string;
};

type TopicChoice = {
  label: string;
  value: string;
  available: boolean;
};

type SelectChoice = {
  label: string;
  value: string;
  available: boolean;
};

const EDUCATION_TYPE_CHOICES: SelectChoice[] = [
  { label: "O Level", value: "O Level", available: true },
  { label: "A Level", value: "A Level", available: false },
  { label: "SSC", value: "SSC", available: false },
  { label: "HSC", value: "HSC", available: false },
  { label: "GRE", value: "GRE", available: false },
  { label: "SAT", value: "SAT", available: false },
  { label: "IELTS", value: "IELTS", available: false }
];

const O_LEVEL_SUBJECT_CHOICES: SelectChoice[] = [
  { label: "Mathematics", value: "Mathematics", available: true },
  { label: "Pure Mathematics", value: "Pure Mathematics", available: false },
  { label: "Physics", value: "Physics", available: false },
  { label: "Chemistry", value: "Chemistry", available: false },
  { label: "Biology", value: "Biology", available: false }
];

const O_LEVEL_MATH_CHAPTERS: Array<{ label: string; dbTopics: string[] }> = [
  { label: "Number", dbTopics: ["Number", "Number Skills"] },
  { label: "Sets", dbTopics: ["Sets"] },
  { label: "Algebra", dbTopics: ["Algebra"] },
  { label: "Functions", dbTopics: ["Functions"] },
  { label: "Matrices", dbTopics: ["Matrices"] },
  { label: "Geometry", dbTopics: ["Geometry"] },
  { label: "Mensuration", dbTopics: ["Mensuration"] },
  { label: "Vectors and transformation geometry", dbTopics: ["Vectors and transformation geometry"] },
  { label: "Trigonometry", dbTopics: ["Trigonometry"] },
  { label: "Statistics and probability", dbTopics: ["Statistics and probability"] }
];

export function StaticPracticeForm({
  options,
  generationDisabled = false,
  generationDisabledMessage = null
}: {
  options: StaticOption[];
  generationDisabled?: boolean;
  generationDisabledMessage?: string | null;
}) {
  const [state, setState] = useState<{ ok?: boolean; error?: string }>({});
  const [educationType, setEducationType] = useState("");
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("auto");
  const [generationStepIndex, setGenerationStepIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const educationTypes = useMemo<SelectChoice[]>(() => {
    const availableEducationTypes = new Set(options.map((option) => option.educationType));

    return EDUCATION_TYPE_CHOICES.map((choice) => ({
      ...choice,
      available: choice.available && availableEducationTypes.has(choice.value)
    }));
  }, [options]);

  const subjectOptions = useMemo<SelectChoice[]>(() => {
    if (!educationType) return [];

    if (educationType === "O Level") {
      const availableSubjects = new Set(
        options
          .filter((option) => option.educationType === educationType)
          .map((option) => option.subject)
      );

      return O_LEVEL_SUBJECT_CHOICES.map((choice) => ({
        ...choice,
        available: choice.available && availableSubjects.has(choice.value)
      }));
    }

    return [
      ...new Set(
        options
          .filter((option) => option.educationType === educationType)
          .map((option) => option.subject)
      )
    ].map((option) => ({
      label: option,
      value: option,
      available: true
    }));
  }, [educationType, options]);

  const topicOptions = useMemo<TopicChoice[]>(() => {
    if (!educationType || !subject) return [];

    if (educationType === "O Level" && subject === "Mathematics") {
      const availableTopics = new Set(
        options
          .filter(
            (option) => option.educationType === educationType && option.subject === subject
          )
          .map((option) => option.topic)
      );

      return O_LEVEL_MATH_CHAPTERS.map((chapter) => {
        const matchedTopic = chapter.dbTopics.find((topicName) => availableTopics.has(topicName));
        return {
          label: chapter.label,
          value: matchedTopic ?? chapter.dbTopics[0],
          available: Boolean(matchedTopic)
        };
      });
    }

    return [
      ...new Set(
        options
          .filter(
            (option) => option.educationType === educationType && option.subject === subject
          )
          .map((option) => option.topic)
      )
    ].map((topicName) => ({
      label: topicName,
      value: topicName,
      available: true
    }));
  }, [educationType, subject, options]);

  useEffect(() => {
    if (!isPending) {
      setGenerationStepIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setGenerationStepIndex((current) => Math.min(current + 1, generationSteps.length - 1));
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isPending]);

  return (
    <form
      className="relative space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (generationDisabled || !educationType || !subject || !topic || !difficulty) return;
        const formData = new FormData(event.currentTarget);

        startTransition(async () => {
          try {
            const result = await generateStaticWorksheetAction(formData);
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
                  : "Failed to create static problem set."
            });
          }
        });
      }}
    >
      {isPending ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 backdrop-blur-[3px]">
          <div className="loading-vignette absolute inset-0" />
          <div className="relative mx-4 flex w-full max-w-lg justify-center">
            <div className="loading-heartbeat absolute inset-0 rounded-[1.75rem] bg-accent/10 blur-2xl" />
            <div className="card relative w-full space-y-5 overflow-hidden px-7 py-7 text-center shadow-[0_24px_60px_rgba(0,0,0,0.55)]">
              <LoadingBar active />
              <p className="text-[11px] uppercase tracking-[0.24em] text-white">Generating</p>
              <p className="animate-status-pulse mt-3 text-lg text-accent transition-opacity duration-500">
                {generationSteps[generationStepIndex]}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card space-y-4 p-6">
        <div>
          <label className="text-sm text-muted">Education type</label>
          <select
            name="educationType"
            className="input mt-2"
            value={educationType}
            onChange={(event) => {
              setEducationType(event.target.value);
              setSubject("");
              setTopic("");
            }}
            required
          >
            <option value="">Select education type</option>
            {educationTypes.map((option) => (
              <option key={option.value} value={option.value} disabled={!option.available}>
                {option.available ? option.label : `${option.label} (Coming soon)`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted">Subject</label>
          <select
            name="subject"
            className="input mt-2"
            value={subject}
            onChange={(event) => {
              setSubject(event.target.value);
              setTopic("");
            }}
            disabled={!educationType}
            required
          >
            <option value="">Select subject</option>
            {subjectOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={!option.available}>
                {option.available ? option.label : `${option.label} (Coming soon)`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted">Topic</label>
          <select
            name="topic"
            className="input mt-2"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            disabled={!subject}
            required
          >
            <option value="">Select topic</option>
            {topicOptions.map((option) => (
              <option key={`${option.label}-${option.value}`} value={option.value} disabled={!option.available}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-muted">Difficulty</label>
          <select
            name="difficulty"
            className="input mt-2"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            required
          >
            <option value="auto">Auto (based on performance)</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
        {state.ok ? <p className="text-sm text-accent">Ready. Redirecting...</p> : null}
      </div>

      <div className="flex justify-center pt-2">
        <button
          className="button button-primary"
          type="submit"
          disabled={
            isPending || generationDisabled || !educationType || !subject || !topic || !difficulty
          }
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
