"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { LoadingBar } from "@/components/loading-bar";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";

export function SignUpForm() {
  const [fullName, setFullName] = useState("");
  const [primaryLearningGoal, setPrimaryLearningGoal] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/practice";

  useEffect(() => {
    router.prefetch(redirectTo);
  }, [redirectTo, router]);

  const handle = async () => {
    setLoading(true);
    setMessage(null);
    setVerificationPending(false);
    if (!captchaToken) {
      setMessage("Please complete the verification check.");
      setLoading(false);
      return;
    }
    const supabase = createSupabaseBrowserClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        captchaToken: captchaToken ?? undefined,
        data: {
          full_name: fullName.trim(),
          primary_learning_goal: primaryLearningGoal.trim()
        }
      }
    });

    if (error) {
      setMessage(error.message);
      setCaptchaResetKey((value) => value + 1);
    } else {
      if (data.session) {
        router.replace(redirectTo);
      } else {
        setVerificationPending(true);
        setMessage(`Check ${email} and verify your email, then log in.`);
      }
    }

    setLoading(false);
  };

  return (
    <div className="mx-auto w-full max-w-md px-1 sm:px-0">
      <div className="card space-y-6 p-6 sm:p-8">
        <LoadingBar active={loading} />
        <div className="space-y-2">
          <span className="tag">Create account</span>
          <h1 className="text-2xl font-semibold sm:text-3xl">Start with intellED</h1>
          <p className="text-sm text-muted">Set up your account in minutes.</p>
        </div>
        <div className="space-y-4">
          <input
            className="input"
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
          <input
            className="input"
            type="text"
            placeholder="What do you primarily want to learn?"
            value={primaryLearningGoal}
            onChange={(event) => setPrimaryLearningGoal(event.target.value)}
          />
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
          {message ? (
            <p className={`text-sm ${verificationPending ? "text-accent" : "text-red-400"}`}>
              {message}
            </p>
          ) : null}
          <TurnstileWidget onTokenChange={setCaptchaToken} resetKey={captchaResetKey} />
        </div>
        <div className="flex flex-col gap-3">
          <button className="button button-primary" onClick={handle} disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </button>
          <GoogleAuthButton redirectTo={redirectTo} />
          <Link className="button" href={`/auth/sign-in?redirect=${encodeURIComponent(redirectTo)}`}>
            Already have an account?
          </Link>
        </div>
      </div>
    </div>
  );
}
