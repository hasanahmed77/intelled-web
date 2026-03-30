"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LoadingBar } from "@/components/loading-bar";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/reset-password`
        : undefined;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Password reset link sent. Check your email.");
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-md px-1 sm:px-0">
      <div className="card space-y-6 p-6 sm:p-8">
        <LoadingBar active={loading} />
        <div className="space-y-2">
          <span className="tag">Reset password</span>
          <h1 className="text-2xl font-semibold sm:text-3xl">Reset your password</h1>
          <p className="text-sm text-muted">We will send you a recovery link.</p>
        </div>
        <div className="space-y-4">
          <input
            className="input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
        </div>
        <div className="flex flex-col gap-3">
          <button className="button button-primary" onClick={handle} disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
          </button>
          <Link className="button" href="/auth/sign-in">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
