"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleAuthButton({
  redirectTo,
  label = "Continue with Google"
}: {
  redirectTo: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const origin = window.location.origin;
    const callbackUrl = `${origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl
      }
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button className="button w-full" type="button" onClick={handleGoogleAuth} disabled={loading}>
        {loading ? "Redirecting..." : label}
      </button>
      {message ? <p className="text-sm text-red-400">{message}</p> : null}
    </div>
  );
}
