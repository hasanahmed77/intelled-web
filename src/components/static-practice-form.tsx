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

type SubjectCatalogEntry = {
  educationType: string;
  subject: string;
  label: string;
  sortOrder: number;
};

type TopicCatalogEntry = {
  educationType: string;
  subject: string;
  topic: string;
  label: string;
  sortOrder: number;
};

function formatTopicLabel(label: string) {
  return label.replace(/^\d+\s*:\s*/, "").replace(/\s+\d+$/, "");
}

function normalizeTopicKey(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\band\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

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

export function StaticPracticeForm({
  options,
  subjectCatalog,
  topicCatalog,
  generationDisabled = false,
  generationDisabledMessage = null
}: {
  options: StaticOption[];
  subjectCatalog: SubjectCatalogEntry[];
  topicCatalog: TopicCatalogEntry[];
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

    const availableSubjects = new Set(
      options
        .filter((option) => option.educationType === educationType)
        .map((option) => option.subject)
    );
    const configuredSubjects = subjectCatalog
      .filter((entry) => entry.educationType === educationType)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

    const configuredChoices: SelectChoice[] = configuredSubjects.map((entry) => ({
      label: entry.label,
      value: entry.subject,
      available: availableSubjects.has(entry.subject)
    }));

    const configuredSubjectValues = new Set(configuredSubjects.map((entry) => entry.subject));
    const extraAvailableChoices: SelectChoice[] = [...availableSubjects]
      .filter((subjectName) => !configuredSubjectValues.has(subjectName))
      .sort((a, b) => a.localeCompare(b))
      .map((subjectName) => ({
        label: subjectName,
        value: subjectName,
        available: true
      }));

    return [...configuredChoices, ...extraAvailableChoices];
  }, [educationType, options, subjectCatalog]);

  const topicOptions = useMemo<TopicChoice[]>(() => {
    if (!educationType || !subject) return [];

    const availableTopicNames = options
        .filter(
          (option) => option.educationType === educationType && option.subject === subject
        )
        .map((option) => option.topic);
    const availableTopicsByKey = new Map<string, string>();
    for (const topicName of availableTopicNames) {
      const key = normalizeTopicKey(topicName);
      if (!availableTopicsByKey.has(key)) {
        availableTopicsByKey.set(key, topicName);
      }
    }

    const configuredTopics = topicCatalog
      .filter((entry) => entry.educationType === educationType && entry.subject === subject)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));

    const groupedTopics = new Map<
      string,
      { label: string; sortOrder: number; aliases: string[] }
    >();

    for (const entry of configuredTopics) {
      const key = `${entry.sortOrder}::${entry.label}`;
      const existing = groupedTopics.get(key);
      if (existing) {
        existing.aliases.push(entry.topic);
      } else {
        groupedTopics.set(key, {
          label: formatTopicLabel(entry.label),
          sortOrder: entry.sortOrder,
          aliases: [entry.topic]
        });
      }
    }

    const configuredChoices = [...groupedTopics.values()]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
      .map((group) => {
        const matchedTopic =
          group.aliases
            .map((topicName) => availableTopicsByKey.get(normalizeTopicKey(topicName)))
            .find(Boolean) ?? null;
        return {
          label: group.label,
          value: matchedTopic ?? group.aliases[0],
          available: Boolean(matchedTopic)
        };
      });

    const configuredTopicValues = new Set<string>();
    for (const entry of configuredTopics) {
      configuredTopicValues.add(normalizeTopicKey(entry.topic));
      configuredTopicValues.add(normalizeTopicKey(entry.label));
    }

    const extraAvailableChoices: TopicChoice[] = [...availableTopicsByKey.entries()]
      .filter(([topicKey]) => !configuredTopicValues.has(topicKey))
      .map(([, topicName]) => topicName)
      .sort((a, b) => a.localeCompare(b))
      .map((topicName) => ({
        label: formatTopicLabel(topicName),
        value: topicName,
        available: true
      }));

    return [...configuredChoices, ...extraAvailableChoices];
  }, [educationType, subject, options, topicCatalog]);

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
                  : "Failed to create curated problem set."
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
                {option.available ? option.label : `${option.label} (Coming soon)`}
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
