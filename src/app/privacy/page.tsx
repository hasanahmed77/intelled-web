import { ViewportSection } from "@/components/viewport-section";

export default function PrivacyPage() {
  return (
    <ViewportSection>
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <div className="space-y-3">
          <span className="tag">Privacy</span>
          <h1 className="text-4xl font-semibold">Privacy Policy</h1>
          <p className="text-sm text-muted">Last updated: {new Date().getFullYear()}</p>
        </div>

        <div className="card space-y-6 p-6 text-sm leading-7 text-muted">
          <section>
            <h2 className="text-lg font-semibold text-white">What we collect</h2>
            <p className="mt-3">
              intellED collects the information required to operate the platform,
              including account details such as email address, full name, primary learning
              goal, problem set topics entered by the user, generated problem set content,
              submitted answers, AI-generated feedback, scores, and subscription-related
              status data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">How we use data</h2>
            <p className="mt-3">
              We use account and problem set data to authenticate users, generate
              problem sets, evaluate answers, display performance history, enforce plan
              limits, improve personalization, and provide support. Problem Set topics,
              prompts, answers, and grading context may be sent to third-party AI
              providers for generation and evaluation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Authentication and providers</h2>
            <p className="mt-3">
              Authentication is handled through Supabase. If users choose Google sign-in,
              identity information provided by Google is used to create or access their
              account. Email-based authentication and password reset emails are also
              processed through our configured authentication provider and email delivery
              infrastructure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">AI processing</h2>
            <p className="mt-3">
              User-entered problem set topics, problem set questions, submitted answers, and
              evaluation context may be processed by AI services to generate questions and
              score responses. Users should avoid submitting sensitive personal data in
              problem set prompts or answers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Data retention</h2>
            <p className="mt-3">
              We retain account, problem set, and attempt data as needed to operate the
              service, provide performance history, and enforce plan usage. Some generated
              data may be removed or limited according to product rules, including limits
              on the number of recent problem sets stored for a user.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Security</h2>
            <p className="mt-3">
              We use authentication controls, database access restrictions, and server-side
              authorization logic to protect user data. No system can guarantee absolute
              security, and users are responsible for keeping their login credentials
              secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white">Contact</h2>
            <p className="mt-3">
              Privacy questions can be sent to support@intelled.org.
            </p>
          </section>
        </div>
      </div>
    </ViewportSection>
  );
}
