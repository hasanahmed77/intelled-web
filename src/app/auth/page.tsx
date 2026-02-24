import Link from "next/link";
import { ViewportSection } from "@/components/viewport-section";

export default function AuthIndexPage() {
  return (
    <ViewportSection center>
      <div className="mx-auto w-full max-w-md">
      <div className="card space-y-6 p-8 text-center">
        <div className="space-y-2">
          <span className="tag">Account</span>
          <h1 className="text-3xl font-semibold">Welcome to intellED</h1>
          <p className="text-sm text-muted">Sign in or create a new account.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link className="button button-primary" href="/auth/sign-in">
            Sign in
          </Link>
          <Link className="button" href="/auth/sign-up">
            Create account
          </Link>
        </div>
      </div>
      </div>
    </ViewportSection>
  );
}
