import Link from "next/link";

export default function AuthIndexPage() {
  return (
    <div className="mx-auto min-h-[calc(100svh-6rem)] max-w-md pb-16 pt-24">
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
  );
}
