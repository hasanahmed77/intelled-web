"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function StartPracticeLink() {
  const [href, setHref] = useState("/practice");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const syncHref = async () => {
      const { data } = await supabase.auth.getSession();
      setHref(data.session ? "/practice" : "/auth/sign-in?redirect=%2Fpractice");
    };

    syncHref();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setHref(session ? "/practice" : "/auth/sign-in?redirect=%2Fpractice");
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Link className="button button-primary" href={href}>
      Start Practicing
    </Link>
  );
}
