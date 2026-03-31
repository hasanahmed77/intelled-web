"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function ConfettiBurst({
  triggerKey,
  recipientName,
}: {
  triggerKey: number;
  recipientName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("LEGENDS KEEP GOING");

  const messages = [
    "LEGENDS KEEP GOING",
    "YOU ARE LOCKING IN",
    "THAT WAS ELITE WORK",
    "SHARP MIND. CLEAN WIN.",
    "YOU ARE BUILDING MASTERY",
    "THAT WAS A POWER MOVE",
    "DISCIPLINE LOOKS GOOD ON YOU",
    "ANOTHER STEP TOWARD GREATNESS",
    "YOU MADE THAT LOOK EASY",
    "TOP TIER FOCUS",
  ];

  const runBurst = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || triggerKey === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    // 🎯 ORIGIN 10% BELOW CENTER
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.6;

    const colors = ["#ffd60a", "#fff4b8", "#ffffff", "#f4c430"];

    const particles = Array.from({ length: 140 }, () => ({
      x: originX + (Math.random() - 0.5) * 40,
      y: originY + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 12,
      // 🔥 upward bias for cinematic burst
      vy: (Math.random() - 1.3) * 10,
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    }));

    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // gravity effect
        p.vy += 0.18;

        // rotation & fade
        p.rotation += p.vr;
        p.life -= 0.015;

        if (p.life <= 0) return;

        ctx.save();
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      if (particles.some((p) => p.life > 0)) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }, [triggerKey]);

  useEffect(() => {
    const cleanup = runBurst();
    return cleanup;
  }, [runBurst]);

  useEffect(() => {
    if (triggerKey === 0) return;

    const baseMessage =
      messages[Math.floor(Math.random() * messages.length)] ??
      "LEGENDS KEEP GOING";

    const normalizedName = recipientName?.trim();

    setMessage(
      normalizedName
        ? `${baseMessage}, ${normalizedName.toUpperCase()}`
        : baseMessage
    );

    setShowMessage(true);

    const timeout = window.setTimeout(() => {
      setShowMessage(false);
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [recipientName, triggerKey]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[120]"
        aria-hidden="true"
      />

      {showMessage ? (
        <div className="pointer-events-none fixed inset-0 z-[130] flex items-center justify-center">
          <div className="animate-celebration-pop px-8 py-5 text-center">
            <p className="text-sm font-light uppercase tracking-[0.32em] text-accent md:text-lg">
              {message}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}