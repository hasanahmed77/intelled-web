"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/practice";

  const handle = async () => {
    setLoading(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
    } else {
      router.push(redirectTo);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="card space-y-6 p-8">
        <div className="space-y-2">
          <span className="tag">Create account</span>
          <h1 className="text-3xl font-semibold">Start with intellED</h1>
          <p className="text-sm text-muted">Set up your account in minutes.</p>
        </div>
        <div className="space-y-4">
          <input
            className="input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {message ? <p className="text-sm text-red-400">{message}</p> : null}
        </div>
        <div className="flex flex-col gap-3">
          <button className="button button-primary" onClick={handle} disabled={loading}>
            Create account
          </button>
          <Link className="button" href={`/auth/sign-in?redirect=${encodeURIComponent(redirectTo)}`}>
            Already have an account?
          </Link>
        </div>
      </div>
    </div>
  );
}
