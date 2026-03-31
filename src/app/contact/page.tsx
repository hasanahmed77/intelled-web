import Link from "next/link";
import { ViewportSection } from "@/components/viewport-section";

export default function ContactPage() {
  return (
    <ViewportSection>
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-3">
          <span className="tag">Contact</span>
          <h1 className="text-4xl font-semibold">Contact Us</h1>
          <p className="max-w-2xl text-muted">
            For account issues, product questions, or support requests, contact the team
            directly by email.
          </p>
        </div>

        <div className="card p-6">
          <p className="text-sm text-muted">Support email</p>
          <Link
            href="mailto:support@intelled.org"
            className="mt-3 inline-block text-2xl font-semibold text-white transition hover:text-accent"
          >
            support@intelled.org
          </Link>
          <p className="mt-4 text-sm leading-7 text-muted">
            When contacting support, include the email address used for your account and a
            short description of the issue so the request can be handled faster.
          </p>
        </div>
      </div>
    </ViewportSection>
  );
}
