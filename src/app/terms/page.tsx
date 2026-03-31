import { ViewportSection } from "@/components/viewport-section";

export default function TermsPage() {
  return (
    <ViewportSection>
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="space-y-3">
          <span className="tag">Terms</span>
          <h1 className="text-4xl font-semibold">Terms of Service</h1>
          <p className="text-sm text-muted">Last updated: {new Date().getFullYear()}</p>
        </div>

        <div className="card space-y-6 p-6 text-sm leading-7 text-muted">
          <section>
            <h2 className="text-lg font-semibold text-white">Use of the service</h2>
            <p className="mt-3">
              intellED provides problem set generation, answer evaluation, and performance
              tracking tools for educational use. Users may use the platform only for
              lawful purposes and must not misuse, disrupt, probe, reverse engineer, or
              abuse the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Accounts</h2>
            <p className="mt-3">
              Users are responsible for maintaining the confidentiality of their account
              credentials and for activities that occur under their account. Users must
              provide accurate account information and may not impersonate others.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Plans and access</h2>
            <p className="mt-3">
              intellED may offer free and paid access tiers. Free and paid plans can have
              usage limits, including problem set generation limits, storage limits, and
              feature restrictions. Access can be restricted when applicable plan limits
              are reached.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">AI-generated content</h2>
            <p className="mt-3">
              Problem Set questions, feedback, and scores may be generated or assisted by AI.
              AI output may be inaccurate, incomplete, or unsuitable for a specific exam or
              context. Users are responsible for reviewing and applying generated content
              with judgment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Acceptable use</h2>
            <p className="mt-3">
              Users may not use the platform to submit unlawful content, infringing
              material, malicious prompts, automated abuse, credential abuse, or content
              intended to harm the service or other users. We may suspend or terminate
              access for misuse.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Availability and changes</h2>
            <p className="mt-3">
              The service may change over time, including features, pricing, limits,
              supported providers, and availability. We do not guarantee uninterrupted or
              error-free operation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p className="mt-3">
              Questions about these terms can be sent to support@intelled.org.
            </p>
          </section>
        </div>
      </div>
    </ViewportSection>
  );
}
