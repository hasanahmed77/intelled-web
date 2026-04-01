"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ScoreRange = "perfect" | "top" | "high" | "mid" | "low";

const rangeMessages: Record<ScoreRange, string[]> = {
  perfect: [
    "ABSOLUTELY PERFECT.",
    "100%. UNTOUCHABLE.",
    "FLAWLESS. EVERY SINGLE ONE.",
    "PERFECT SCORE. LEGENDARY.",
    "NOT ONE MISTAKE. THAT IS ELITE.",
  ],
  top: [
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
  ],
  high: [
    "NEARLY THERE",
    "STRONG WORK. PUSH FOR PERFECT.",
    "SO CLOSE. ONE MORE PUSH.",
    "THAT WAS SHARP. KEEP REFINING.",
    "THE TOP IS RIGHT THERE.",
    "90 IS WAITING FOR YOU.",
    "ALMOST PERFECT. ALMOST.",
    "STRONG FOUNDATION. SHARPEN THE EDGE.",
  ],
  mid: [
    "EVERY REP BUILDS THE BRAIN",
    "THE WORK IS WORKING",
    "PROGRESS IS PROGRESS",
    "YOU SHOWED UP. THAT MATTERS.",
    "GROWTH TAKES REPS. KEEP GOING.",
    "EACH ATTEMPT MAKES YOU SHARPER",
    "THE LEARNING IS HAPPENING",
    "STAY IN THE PROCESS",
  ],
  low: [
    "HARD TOPICS BUILD STRONG MINDS",
    "THE COMEBACK STARTS NOW",
    "STRUGGLE IS WHERE GROWTH LIVES",
    "THIS IS HOW LEGENDS START",
    "EVERY MASTER WAS ONCE A BEGINNER",
    "THE HARD PART IS DOING IT AGAIN",
    "ROUGH START. STRONG FINISH. KEEP GOING.",
    "THE ONLY WAY IS THROUGH",
  ],
};

const rangeTextColor: Record<ScoreRange, string> = {
  perfect: "text-accent",
  top: "text-accent",
  high: "text-white",
  mid: "text-zinc-300",
  low: "text-zinc-400",
};

function playBalloonPop() {
  const ctx = new AudioContext();
  const now = ctx.currentTime;

  const bangSize = Math.floor(ctx.sampleRate * 0.25);
  const bangBuffer = ctx.createBuffer(1, bangSize, ctx.sampleRate);
  const bangData = bangBuffer.getChannelData(0);
  for (let i = 0; i < bangSize; i++) {
    bangData[i] =
      (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
  }
  const bang = ctx.createBufferSource();
  bang.buffer = bangBuffer;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 3000;
  lowpass.Q.value = 0.5;

  const eq = ctx.createBiquadFilter();
  eq.type = "lowshelf";
  eq.frequency.value = 250;
  eq.gain.value = 7;

  const bangGain = ctx.createGain();
  bangGain.gain.setValueAtTime(1.0, now);

  bang.connect(lowpass);
  lowpass.connect(eq);
  eq.connect(bangGain);
  bangGain.connect(ctx.destination);
  bang.start(now);
  bang.stop(now + 0.25);

  const thump = ctx.createOscillator();
  const thumpGain = ctx.createGain();
  thump.type = "sine";
  thump.frequency.setValueAtTime(80, now);
  thump.frequency.exponentialRampToValueAtTime(20, now + 0.08);
  thumpGain.gain.setValueAtTime(0.6, now);
  thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  thump.connect(thumpGain);
  thumpGain.connect(ctx.destination);
  thump.start(now);
  thump.stop(now + 0.12);
}

function playFirecrackerSounds() {
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  const crackCount = 10;

  for (let i = 0; i < crackCount; i++) {
    const delay = i * 0.13 + Math.random() * 0.04;
    const crackSize = Math.floor(ctx.sampleRate * 0.04);
    const buffer = ctx.createBuffer(1, crackSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < crackSize; j++) {
      data[j] =
        (Math.random() * 2 - 1) * Math.exp(-j / (ctx.sampleRate * 0.008));
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Each crack has slightly different tone
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1200 + Math.random() * 800;
    filter.Q.value = 1.0;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.04);

    source.connect(filter);
    filter.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);
    source.start(now + delay);
    source.stop(now + delay + 0.04);
  }
}

export function ConfettiBurst({
  triggerKey,
  recipientName,
  scoreRange = "top",
}: {
  triggerKey: number;
  recipientName?: string;
  scoreRange?: ScoreRange;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState("");

  const playSound = useCallback(() => {
    if (scoreRange !== "top" && scoreRange !== "perfect") return;
    try {
      playBalloonPop();
      if (scoreRange === "perfect") {
        setTimeout(() => playFirecrackerSounds(), 300);
      }
    } catch {
      // AudioContext not available
    }
  }, [scoreRange]);

  const runConfetti = useCallback((canvas: HTMLCanvasElement, ctx2d: CanvasRenderingContext2D) => {
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.6;
    const colors = ["#ffd60a", "#fff4b8", "#ffffff", "#f4c430"];

    const particles = Array.from({ length: 140 }, () => ({
      x: originX + (Math.random() - 0.5) * 40,
      y: originY + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 1.3) * 10,
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
    }));

    let raf = 0;
    const draw = () => {
      ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.rotation += p.vr;
        p.life -= 0.015;
        if (p.life <= 0) return;
        ctx2d.save();
        ctx2d.globalAlpha = Math.max(p.life, 0);
        ctx2d.translate(p.x, p.y);
        ctx2d.rotate(p.rotation);
        ctx2d.fillStyle = p.color;
        ctx2d.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx2d.restore();
      });
      if (particles.some((p) => p.life > 0)) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const runFirecracker = useCallback((canvas: HTMLCanvasElement, ctx2d: CanvasRenderingContext2D) => {
    const dpr = window.devicePixelRatio || 1;
    const sparkColors = ["#ff4444", "#ff8c00", "#ffd60a", "#ffffff", "#ff6b6b"];
    const burstCount = 8;
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;

    // All active sparks across all bursts
    const allSparks: {
      x: number; y: number;
      vx: number; vy: number;
      life: number; color: string; size: number;
    }[] = [];

    const draw = () => {
      ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);
      allSparks.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.15;
        s.life -= 0.022;
        if (s.life <= 0) return;
        ctx2d.save();
        ctx2d.globalAlpha = Math.max(s.life, 0);
        ctx2d.strokeStyle = s.color;
        ctx2d.lineWidth = s.size;
        ctx2d.lineCap = "round";
        ctx2d.beginPath();
        ctx2d.moveTo(s.x, s.y);
        ctx2d.lineTo(s.x - s.vx * 3, s.y - s.vy * 3);
        ctx2d.stroke();
        ctx2d.restore();
      });
      if (allSparks.some((s) => s.life > 0)) {
        raf = requestAnimationFrame(draw);
      } else {
        ctx2d.clearRect(0, 0, window.innerWidth, window.innerHeight);
      }
    };

    for (let b = 0; b < burstCount; b++) {
      const t = setTimeout(() => {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Random position across screen
        const bx = window.innerWidth * (0.15 + Math.random() * 0.7);
        const by = window.innerHeight * (0.1 + Math.random() * 0.5);

        for (let s = 0; s < 22; s++) {
          const angle = (s / 22) * Math.PI * 2;
          const speed = 3 + Math.random() * 5;
          allSparks.push({
            x: bx,
            y: by,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 1,
            color: sparkColors[Math.floor(Math.random() * sparkColors.length)],
            size: 1.5 + Math.random() * 1.5,
          });
        }

        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(draw);
      }, b * 170 + Math.random() * 60);
      timeouts.push(t);
    }

    return () => {
      timeouts.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, []);

  const runBurst = useCallback(() => {
    if (scoreRange !== "top" && scoreRange !== "perfect") return;
    const canvas = canvasRef.current;
    if (!canvas || triggerKey === 0) return;
    const ctx2d = canvas.getContext("2d");
    if (!ctx2d) return;

    const cleanups: (() => void)[] = [];
    cleanups.push(runConfetti(canvas, ctx2d) ?? (() => {}));

    if (scoreRange === "perfect") {
      const t = setTimeout(() => {
        const c = runFirecracker(canvas, ctx2d);
        if (c) cleanups.push(c);
      }, 400);
      cleanups.push(() => clearTimeout(t));
    }

    return () => cleanups.forEach((fn) => fn());
  }, [triggerKey, scoreRange, runConfetti, runFirecracker]);

  useEffect(() => {
    const cleanup = runBurst();
    return cleanup;
  }, [runBurst]);

  useEffect(() => {
    if (triggerKey === 0) return;
    playSound();
  }, [triggerKey, playSound]);

  useEffect(() => {
    if (triggerKey === 0) return;

    const pool = rangeMessages[scoreRange];
    const baseMessage = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
    const normalizedName = recipientName?.trim();
    setMessage(
      normalizedName
        ? `${baseMessage}, ${normalizedName.toUpperCase()}`
        : baseMessage
    );
    setShowMessage(true);

    const timeout = window.setTimeout(() => setShowMessage(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [recipientName, triggerKey, scoreRange]);

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
            <p className={`text-sm font-light uppercase tracking-[0.32em] md:text-lg ${rangeTextColor[scoreRange]}`}>
              {message}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
