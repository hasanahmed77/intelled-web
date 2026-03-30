"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { LoadingBar } from "@/components/loading-bar";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) {
        setReady(true);
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const handle = async () => {
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/auth/sign-in?reset=success");
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-md px-1 sm:px-0">
      <div className="card space-y-6 p-6 sm:p-8">
        <LoadingBar active={loading} />
        <div className="space-y-2">
          <span className="tag">New password</span>
          <h1 className="text-2xl font-semibold sm:text-3xl">Choose a new password</h1>
          <p className="text-sm text-muted">
            {ready
              ? "Enter your new password below."
              : "Open this page from the email recovery link to continue."}
          </p>
        </div>
        <div className="space-y-4">
          <input
            className="input"
            type="password"
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!ready}
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={!ready}
          />
          {message ? <p className="text-sm text-red-400">{message}</p> : null}
        </div>
        <div className="flex flex-col gap-3">
          <button className="button button-primary" onClick={handle} disabled={loading || !ready}>
            {loading ? "Updating..." : "Update password"}
          </button>
          <Link className="button" href="/auth/sign-in">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
