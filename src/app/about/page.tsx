import { ViewportSection } from "@/components/viewport-section";

export default function AboutPage() {
  return (
    <ViewportSection>
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="space-y-3">
          <span className="tag">About</span>
          <h1 className="text-4xl font-semibold">About intellED</h1>
          <p className="max-w-3xl text-muted">
            intellED is a student-focused practice platform that generates targeted
            problem sets, evaluates submitted answers, and tracks performance over time.
            The product is built for learners preparing for O Levels, A Levels, SSC,
            HSC, IELTS, GRE, SAT, and general school subjects.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-6">
            <h2 className="text-xl font-semibold">What the product does</h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              <li>Generates subject-specific problem sets from a user-provided topic</li>
              <li>Supports English and Bangla problem set generation</li>
              <li>Evaluates answers with AI and returns per-question feedback</li>
              <li>Tracks performance so practice can become more personalized over time</li>
            </ul>
          </div>
          <div className="card p-6">
            <h2 className="text-xl font-semibold">Why intellED</h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              intellED was built around a simple idea: students should be able to learn
              exactly what they need, when they need it, without digging through generic
              problem sets that do not match their goals. The name combines{" "}
              <span className="text-white">intellect</span> and{" "}
              <span className="text-white">education</span> into a compact identity that
              reflects focused learning, smart practice, and a cleaner way to study.
            </p>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold">Who intellED is for</h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            intellED is built for students who want focused practice instead of generic
            content. Users can specify the exact topic they want to learn, choose a
            difficulty level or let the platform adapt automatically, and review feedback
            from each submitted problem set to improve their understanding.
          </p>
        </div>
      </div>
    </ViewportSection>
  );
}
