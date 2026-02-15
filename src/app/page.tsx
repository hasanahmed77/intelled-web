import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="grid gap-10 md:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <span className="tag">Personalized practice</span>
          <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
            Minimal, focused worksheets tailored to how you learn.
          </h1>
          <p className="text-lg text-muted">
            intellED creates adaptive practice sets, tracks performance, and
            helps students stay in the flow. Start with static worksheets today; plug in
            AI generation whenever you are ready.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link className="button button-primary" href="/practice">
              Generate practice
            </Link>
            <Link className="button" href="/pricing">
              View pricing
            </Link>
          </div>
          <div className="grid gap-4 text-sm text-muted md:grid-cols-3">
            <div className="card p-4">Adaptive difficulty recommendations.</div>
            <div className="card p-4">Detailed feedback on every question.</div>
            <div className="card p-4">Performance tracking for every student.</div>
          </div>
        </div>
        <div className="card space-y-6 p-8">
          <h2 className="text-xl font-semibold">What you get</h2>
          <ul className="space-y-4 text-sm text-muted">
            <li>10 worksheets generated per request.</li>
            <li>Difficulty controls: easy, medium, hard, auto.</li>
            <li>Profile analytics that inform future practice.</li>
            <li>Supabase-backed authentication and storage.</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Landing to practice in one flow",
            body: "Keep students focused with a single, distraction-free entry point."
          },
          {
            title: "Feedback built in",
            body: "Every question comes with detail so learners know what to improve."
          },
          {
            title: "Performance-aware",
            body: "The app stores scores and adjusts difficulty over time."
          }
        ].map((item) => (
          <div key={item.title} className="card p-6">
            <h3 className="text-lg font-semibold">{item.title}</h3>
            <p className="mt-3 text-sm text-muted">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
