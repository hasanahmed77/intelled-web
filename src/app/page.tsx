import Link from "next/link";
import Image from "next/image";
import LightRays from "@/components/light-rays";
import { StartPracticeLink } from "@/components/start-practice-link";

const points = [
  "Learn ANYTHING platform",
  "O/A Levels, SSC, HSC",
  "IELTS, GRE, SAT",
  "School subjects",
  "English + Bangla"
];

export default function HomePage() {
  return (
    <div
      className="relative w-screen bg-black text-white"
      style={{ marginLeft: "calc(50% - 50vw)" }}
    >
      <section className="relative min-h-[100svh] overflow-hidden px-4 py-0 sm:px-6 md:px-12">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/images/robot-yellow-more.jpg"
            alt="Robot hero background"
            width={1920}
            height={1080}
            loading="eager"
            priority
            className="absolute bottom-[-4%] left-1/2 z-0 w-[980px] -translate-x-1/2 mix-blend-screen opacity-40 sm:w-[1100px] md:bottom-[-6%] md:w-[1150px] md:opacity-55"
          />
          <LightRays
            raysOrigin="top-center"
            raysColor="#ffffff"
            raysSpeed={1}
            lightSpread={0.5}
            rayLength={3}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0}
            distortion={0}
            className="custom-rays"
            pulsating={false}
            fadeDistance={1}
            saturation={1}
          />
          <div className="absolute left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
          <div className="absolute bottom-8 left-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-8 right-10 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute inset-x-0 top-0 z-[1] h-72 bg-gradient-to-b from-black/40 via-black/10 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col items-center justify-center py-14 sm:py-16">
          <div className="max-w-5xl text-center">
            <h1 className="animate-hero-rise text-4xl font-semibold leading-[1.05] drop-shadow-[0_10px_28px_rgba(0,0,0,0.65)] sm:text-5xl md:text-7xl">
              <span className="bg-gradient-to-r from-accent via-yellow-300 to-white bg-clip-text text-transparent">
                Learn Anything.
              </span>
              <br />
              Practice Smarter.
            </h1>

            <p className="animate-hero-rise-delayed mx-auto mt-5 max-w-3xl text-base text-zinc-300 drop-shadow-[0_8px_22px_rgba(0,0,0,0.7)] sm:mt-6 sm:text-lg md:text-2xl">
              One platform for O/A Levels, SSC, HSC, IELTS, GRE, SAT, and school topics.
              Generate focused problem sets in English or Bangla, submit once, and get AI evaluation.
            </p>

            <div className="animate-hero-rise-soft mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8 sm:gap-3">
              {points.map((point) => (
                <span
                  key={point}
                  className="rounded-full border border-ink-700 bg-ink-900/85 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] text-zinc-200 shadow-[0_10px_20px_rgba(0,0,0,0.45)] sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.14em]"
                >
                  {point}
                </span>
              ))}
            </div>

            <div className="animate-hero-rise-late mt-7 flex flex-wrap justify-center gap-3">
              <StartPracticeLink />
              <Link className="button button-dark-accent" href="/pricing">
                View Pricing
              </Link>
            </div>
          </div>

          <div className="mt-10 grid w-full max-w-5xl gap-4 md:grid-cols-3">
            <div className="animate-card-fade card card-cracked p-5 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Generation</p>
              <p className="mt-2 text-sm text-zinc-200">Topic-specific problem sets for exact exam goals.</p>
            </div>
            <div className="animate-card-fade-delayed card card-cracked p-5 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Evaluation</p>
              <p className="mt-2 text-sm text-zinc-200">AI checks answers and returns feedback + score.</p>
            </div>
            <div className="animate-card-fade-late card card-cracked p-5 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Progress</p>
              <p className="mt-2 text-sm text-zinc-200">Difficulty adapts from your real submission history.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[78svh] overflow-hidden bg-black px-4 py-4 sm:min-h-[82svh] sm:px-6 sm:py-6 md:px-12 md:py-8">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[10%] top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-24 right-[8%] h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[78svh] w-full max-w-7xl flex-col justify-center sm:min-h-[82svh]">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.2em] text-accent">Two Practice Modes</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
              Two clear ways to practice on intellED.
            </h2>
            <p className="mt-4 max-w-xl text-sm text-zinc-300 sm:text-base">
              intellED combines syllabus-based practice with open-topic AI generation in one workflow.
            </p>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            <div className="card card-cracked flex min-h-0 flex-col justify-between p-4 sm:p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-accent">Curated Practice</p>
                <p className="mt-2 text-sm font-medium text-zinc-200 sm:text-base">
                  Structured exam prep when you need syllabus coverage.
                </p>
                <h3 className="mt-2 text-lg font-semibold sm:text-xl">Practice by subject, chapter, and difficulty.</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-300">
                  Choose the exam track, select a topic, and practice with structured sets built for real exam prep.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-zinc-300">
                <span className="rounded-full border border-ink-700 bg-ink-950/80 px-3 py-2">Topic-based practice</span>
                <span className="rounded-full border border-ink-700 bg-ink-950/80 px-3 py-2">Auto difficulty</span>
              </div>
            </div>

            <div className="card card-cracked flex min-h-0 flex-col justify-between border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(10,10,10,0.92))] p-4 sm:p-5 shadow-[0_18px_40px_rgba(255,255,255,0.03)]">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-accent">AI Practice</p>
                <p className="mt-2 text-sm font-medium text-zinc-200 sm:text-base">
                  Open-ended AI practice when you want to learn anything else.
                </p>
                <h3 className="mt-2 text-lg font-semibold sm:text-xl">Generate practice on almost any topic instantly.</h3>
                <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-300">
                  Ask for a concept, skill, or topic, and intellED generates a fresh set for focused learning on demand.
                </p>
              </div>

              <div className="mt-5 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.14em] text-zinc-300">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">Any topic</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2">Generated on demand</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative min-h-[78svh] overflow-hidden bg-black px-4 py-3 sm:min-h-[82svh] sm:px-6 sm:py-5 md:px-12 md:py-7">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-24 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute bottom-16 left-[12%] h-44 w-44 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[78svh] w-full max-w-7xl flex-col justify-center sm:min-h-[82svh]">
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-accent">Built for Exam Prep</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
                O Level Math is live now.
                <br />
                More academic and test-prep tracks are on the way.
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-zinc-300 sm:text-base">
                Today, intellED is focused on O Level Math learners. Students can practice by topic
                and difficulty inside curated sets, or switch to AI Practice for custom learning on
                any concept they want to improve.
              </p>
            </div>

            <div className="card p-4 sm:p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Available now</p>
              <p className="mt-2 text-xl font-semibold">O Level Math</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Topic-based curated practice with manual difficulty selection or auto difficulty.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Current focus</p>
              <p className="mt-2 text-base font-semibold">O Level curated study paths</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Practice by subject, chapter, and chosen or adaptive difficulty.
              </p>
            </div>

            <div className="card p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Coming soon</p>
              <p className="mt-2 text-base font-semibold">A Level, IELTS, GRE, SAT, SSC, HSC</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                More structured tracks are being added so learners can prepare across exams in one platform.
              </p>
            </div>

            <div className="card p-4 md:col-span-2 xl:col-span-1">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Why it matters</p>
              <p className="mt-2 text-base font-semibold">One platform for syllabus practice and open-topic learning</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">
                Use curated practice for structured prep. Use AI Practice when the topic goes beyond the syllabus.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <StartPracticeLink />
            <Link className="button button-dark-accent" href="/pricing">
              Explore Plans
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
