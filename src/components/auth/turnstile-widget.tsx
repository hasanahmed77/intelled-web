"use client";

import { useEffect, useId, useRef } from "react";
import Script from "next/script";

const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

type TurnstileWidgetProps = {
  onTokenChange: (token: string | null) => void;
  resetKey?: number;
};

export function TurnstileWidget({ onTokenChange, resetKey = 0 }: TurnstileWidgetProps) {
  const containerId = useId().replace(/:/g, "");
  const widgetIdRef = useRef<string | null>(null);
  const renderedRef = useRef(false);

  const renderWidget = () => {
    if (!siteKey || renderedRef.current || !window.turnstile) {
      return;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      return;
    }

    widgetIdRef.current = window.turnstile.render(container, {
      sitekey: siteKey,
      theme: "dark",
      callback: (token: string) => onTokenChange(token),
      "expired-callback": () => onTokenChange(null),
      "error-callback": () => onTokenChange(null),
    });
    renderedRef.current = true;
  };

  useEffect(() => {
    renderWidget();
  }, [containerId]);

  useEffect(() => {
    if (!window.turnstile || !widgetIdRef.current) {
      return;
    }

    window.turnstile.reset(widgetIdRef.current);
    onTokenChange(null);
  }, [onTokenChange, resetKey]);

  if (!siteKey) {
    return (
      <p className="text-sm text-red-400">
        Turnstile is not configured. Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      <div id={containerId} className="min-h-[65px]" />
    </div>
  );
}
