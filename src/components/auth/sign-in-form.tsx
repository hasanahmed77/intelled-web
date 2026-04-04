"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { LoadingBar } from "@/components/loading-bar";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";

export function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/practice";

  const handle = async () => {
    setLoading(true);
    setMessage(null);
    if (!captchaToken) {
      setMessage("Please complete the verification check.");
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        captchaToken: captchaToken ?? undefined
      }
    });

    if (error) {
      setMessage(error.message);
      setCaptchaResetKey((value) => value + 1);
    } else {
      router.push(redirectTo);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-md px-1 sm:px-0">
      <div className="card space-y-6 p-6 sm:p-8">
        <LoadingBar active={loading} />
        <div className="space-y-2">
          <span className="tag">Sign in</span>
          <h1 className="text-2xl font-semibold sm:text-3xl">Welcome back</h1>
          <p className="text-sm text-muted">Use your email and password.</p>
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
          <div className="flex justify-end">
            <Link
              className="text-sm text-muted transition hover:text-accent"
              href="/auth/forgot-password"
            >
              Forgot password?
            </Link>
          </div>
          <TurnstileWidget onTokenChange={setCaptchaToken} resetKey={captchaResetKey} />
        </div>
        <div className="flex flex-col gap-3">
          <button className="button button-primary" onClick={handle} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <GoogleAuthButton redirectTo={redirectTo} />
          <Link className="button" href={`/auth/sign-up?redirect=${encodeURIComponent(redirectTo)}`}>
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
