import Link from "next/link";
import LightRays from "@/components/light-rays";
import { StartPracticeLink } from "@/components/start-practice-link";

const points = [
  "Learn ANYTHING platform",
  "O/A Levels, SSC, HSC",
  "IELTS, GRE, SAT",
  "School subjects"
];

export default function HomePage() {
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-black text-white">
      <section className="relative min-h-[100svh] overflow-hidden px-6 py-0 md:px-12">
        <div className="pointer-events-none absolute inset-0">
          <img
            src="/images/robot-yellow-more.jpg"
            alt="Robot hero background"
            className="absolute bottom-[-6%] left-1/2 z-0 w-[1150px] max-w-[96vw] -translate-x-1/2 opacity-50 md:opacity-65"
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

        <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-7xl flex-col items-center justify-center py-16">
          <div className="max-w-5xl text-center">
            <h1 className="text-5xl font-semibold leading-[1.05] drop-shadow-[0_10px_28px_rgba(0,0,0,0.65)] md:text-7xl">
              <span className="bg-gradient-to-r from-accent via-yellow-300 to-white bg-clip-text text-transparent">
                Learn Anything.
              </span>
              <br />
              Practice Smarter.
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg text-zinc-300 drop-shadow-[0_8px_22px_rgba(0,0,0,0.7)] md:text-2xl">
              One platform for O/A Levels, SSC, HSC, IELTS, GRE, SAT, and school topics.
              Generate focused worksheets, submit once, and get AI evaluation.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {points.map((point) => (
                <span
                  key={point}
                  className="rounded-full border border-ink-700 bg-ink-900/85 px-4 py-2 text-xs uppercase tracking-[0.14em] text-zinc-200 shadow-[0_10px_20px_rgba(0,0,0,0.45)]"
                >
                  {point}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <StartPracticeLink />
              <Link className="button button-dark-accent" href="/pricing">
                View Pricing
              </Link>
            </div>
          </div>

            <div className="mt-10 grid w-full max-w-5xl gap-4 md:grid-cols-3">
            <div className="card card-cracked p-5 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Generation</p>
              <p className="mt-2 text-sm text-zinc-200">Topic-specific worksheets for exact exam goals.</p>
            </div>
            <div className="card card-cracked p-5 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Evaluation</p>
              <p className="mt-2 text-sm text-zinc-200">AI checks answers and returns feedback + score.</p>
            </div>
            <div className="card card-cracked p-5 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
              <p className="text-xs uppercase tracking-[0.16em] text-muted">Progress</p>
              <p className="mt-2 text-sm text-zinc-200">Difficulty adapts from your real submission history.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
